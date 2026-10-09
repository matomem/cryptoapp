import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";
import { neon } from "@neondatabase/serverless";

const scrypt = promisify(scryptCallback);
const ROOT = process.cwd();
const DIST = resolve(ROOT, "dist");
const COOKIE = "mycrypto_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const MAX_BODY_BYTES = 16 * 1024;
let allowedAssets = new Set(["XBT"]);

function loadLocalEnv() {
  // Minimal .env loader for local clones. Existing process/platform values win.
  return readFile(resolve(ROOT, ".env"), "utf8").then((data) => {
    for (const line of data.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match || match[1] in process.env) continue;
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  }).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}

function sendJson(res, status, body, extraHeaders = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...extraHeaders });
  res.end(JSON.stringify(body));
}
function fail(status, message) { const error = new Error(message); error.status = status; return error; }
function sessionCookie(token, secure) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure ? "; Secure" : ""}`;
}
function clearCookie(secure) {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}
function getCookie(req, name) {
  const header = req.headers.cookie || "";
  const entry = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(name + "="));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
}
function hashToken(token) { return createHmac("sha256", process.env.SESSION_SECRET || "").update(token).digest("hex"); }
async function readBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) throw fail(413, "Request body is too large.");
  }
  if (!body) return {};
  try { return JSON.parse(body); } catch { throw fail(400, "Request must contain valid JSON."); }
}
function safeUser(user) { return { id: user.id, email: user.email, fullName: user.full_name || "" }; }

async function main() {
  await loadLocalEnv();
  allowedAssets = new Set((process.env.LUNO_ALLOWED_ASSETS || "XBT").split(",").map((v) => v.trim().toUpperCase()).filter(Boolean));
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required. Copy .env.example to .env and configure Neon.");
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32 || process.env.SESSION_SECRET.startsWith("replace-with-")) throw new Error("SESSION_SECRET must be replaced with a random value of at least 32 characters.");
  const sql = neon(process.env.DATABASE_URL);
  try {
    const tables = await sql`SELECT to_regclass('public.app_users') AS users_table, to_regclass('public.app_sessions') AS sessions_table`;
    if (!tables[0]?.users_table || !tables[0]?.sessions_table) throw new Error("Database schema is missing. Run server/schema.sql against your Neon database.");
  } catch (error) {
    throw new Error(`Cannot connect to Neon or verify the schema: ${error.message}`);
  }
  const secureCookies = process.env.NODE_ENV === "production";
  const lunoKey = process.env.LUNO_API_KEY_ID;
  const lunoSecret = process.env.LUNO_API_KEY_SECRET;
  const lunoBase = (process.env.LUNO_API_BASE_URL || "https://api.luno.com").replace(/\/$/, "");
  const rate = new Map();

  async function luno(path, { method = "GET", form } = {}) {
    if (!lunoKey || !lunoSecret) throw fail(503, "Luno integration is not configured on the server. Set LUNO_API_KEY_ID and LUNO_API_KEY_SECRET.");
    const headers = { Authorization: "Basic " + Buffer.from(`${lunoKey}:${lunoSecret}`).toString("base64"), Accept: "application/json" };
    let body;
    if (form) { headers["Content-Type"] = "application/x-www-form-urlencoded"; body = new URLSearchParams(form).toString(); }
    const response = await fetch(lunoBase + path, { method, headers, body, signal: AbortSignal.timeout(15000) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof payload.error === "string" ? payload.error : typeof payload.message === "string" ? payload.message : "Luno rejected the request.";
      throw fail(response.status === 401 || response.status === 403 ? 502 : response.status, `Luno API error: ${message}`);
    }
    return payload;
  }

  async function getUser(req) {
    const token = getCookie(req, COOKIE);
    if (!token) return null;
    const tokenHash = hashToken(token);
    const rows = await sql`SELECT u.id, u.email, u.full_name FROM app_sessions s JOIN app_users u ON u.id = s.user_id WHERE s.token_hash = ${tokenHash} AND s.expires_at > NOW() LIMIT 1`;
    return rows[0] || null;
  }
  async function requireUser(req) {
    const user = await getUser(req);
    if (!user) throw fail(401, "Please sign in to continue.");
    return user;
  }
  async function passwordHash(password, salt = randomBytes(16).toString("hex")) {
    const key = await scrypt(password, salt, 64);
    return `scrypt:${salt}:${Buffer.from(key).toString("hex")}`;
  }
  async function passwordMatches(password, encoded) {
    const [kind, salt, expectedHex] = String(encoded).split(":");
    if (kind !== "scrypt" || !salt || !expectedHex) return false;
    const actual = Buffer.from(await scrypt(password, salt, 64));
    const expected = Buffer.from(expectedHex, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  function checkRateLimit(req) {
    const key = req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const current = (rate.get(key) || []).filter((time) => now - time < 60_000);
    if (current.length >= 30) throw fail(429, "Too many requests. Wait a minute and try again.");
    current.push(now); rate.set(key, current);
  }
  async function createSession(userId) {
    const token = randomBytes(32).toString("base64url");
    await sql`INSERT INTO app_sessions (user_id, token_hash, expires_at) VALUES (${userId}, ${hashToken(token)}, NOW() + INTERVAL '7 days')`;
    return token;
  }

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      if (req.method === "OPTIONS") {
        res.writeHead(204, { "Allow": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }); return res.end();
      }
      if (url.pathname.startsWith("/api/")) {
        checkRateLimit(req);
        if (req.method === "GET" && url.pathname === "/api/health") {
          await sql`SELECT 1`;
          return sendJson(res, 200, { ok: true, database: "connected", lunoConfigured: Boolean(lunoKey && lunoSecret) });
        }
        if (req.method === "POST" && url.pathname === "/api/auth/register") {
          const data = await readBody(req);
          const email = String(data.email || "").trim().toLowerCase();
          const password = String(data.password || "");
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400, "Enter a valid email address.");
          if (password.length < 12 || password.length > 256) throw fail(400, "Password must be between 12 and 256 characters.");
          const encoded = await passwordHash(password);
          try {
            const inserted = await sql`INSERT INTO app_users (email, password_hash) VALUES (${email}, ${encoded}) RETURNING id, email, full_name`;
            return sendJson(res, 201, { user: safeUser(inserted[0]), message: "Account created. Sign in to continue." });
          } catch (error) {
            if (error.code === "23505") throw fail(409, "An account with that email already exists.");
            throw error;
          }
        }
        if (req.method === "POST" && url.pathname === "/api/auth/login") {
          const data = await readBody(req);
          const email = String(data.email || "").trim().toLowerCase();
          const password = String(data.password || "");
          const rows = await sql`SELECT id, email, full_name, password_hash FROM app_users WHERE email = ${email} LIMIT 1`;
          if (!rows[0] || !(await passwordMatches(password, rows[0].password_hash))) throw fail(401, "Email or password is incorrect.");
          const token = await createSession(rows[0].id);
          return sendJson(res, 200, { user: safeUser(rows[0]) }, { "Set-Cookie": sessionCookie(token, secureCookies) });
        }
        if (req.method === "POST" && url.pathname === "/api/auth/logout") {
          const token = getCookie(req, COOKIE);
          if (token) await sql`DELETE FROM app_sessions WHERE token_hash = ${hashToken(token)}`;
          return sendJson(res, 200, { ok: true }, { "Set-Cookie": clearCookie(secureCookies) });
        }
        if (req.method === "GET" && url.pathname === "/api/auth/me") {
          const user = await getUser(req);
          if (!user) throw fail(401, "Please sign in to continue.");
          return sendJson(res, 200, { user: safeUser(user) });
        }

        const user = await requireUser(req);
        if (req.method === "GET" && url.pathname === "/api/wallet/summary") {
          const data = await luno("/api/1/balance");
          const balances = Array.isArray(data.balance) ? data.balance : [];
          const balanceFor = (asset) => balances.filter((item) => item.asset === asset).reduce((sum, item) => sum + Number(item.balance || 0), 0).toString();
          return sendJson(res, 200, { bitcoinBalance: balanceFor("XBT"), zarBalance: balanceFor("ZAR"), provider: "Luno" });
        }
        if (req.method === "GET" && url.pathname === "/api/wallet/address") {
          const asset = String(url.searchParams.get("currency") || "XBT").toUpperCase();
          if (!allowedAssets.has(asset)) throw fail(400, "This asset is not enabled by the server.");
          const address = await luno("/api/1/funding_address?asset=" + encodeURIComponent(asset));
          if (!address.address) throw fail(502, "Luno did not return a receiving address for this asset.");
          return sendJson(res, 200, { address: address.address, currency: asset, network: address.network ?? null });
        }
        if (req.method === "GET" && url.pathname === "/api/transactions") {
          const accountsData = await luno("/api/1/accounts");
          const accounts = Array.isArray(accountsData.accounts) ? accountsData.accounts : [];
          const batches = await Promise.all(accounts.slice(0, 20).map(async (account) => {
            try {
              const result = await luno(`/api/1/accounts/${encodeURIComponent(account.id)}/transactions?min_row=-50&max_row=0`);
              return (result.transactions || []).map((tx) => ({ ...tx, account_id: account.id, account_currency: account.currency }));
            } catch { return []; }
          }));
          const transactions = batches.flat().sort((a, b) => Number(b.timestamp || b.created_at || 0) - Number(a.timestamp || a.created_at || 0)).slice(0, 100).map((tx, index) => ({
            id: String(tx.id ?? tx.row_index ?? `${tx.account_id}-${index}`),
            type: Number(tx.balance_delta || tx.amount || 0) < 0 ? "sent" : "received",
            amount: String(Math.abs(Number(tx.balance_delta || tx.amount || 0))),
            currency: String(tx.currency || tx.account_currency || "Unknown"),
            createdAt: new Date(Number(tx.timestamp || tx.created_at || Date.now())).toISOString(),
            status: String(tx.status || "recorded"),
          }));
          return sendJson(res, 200, { transactions, provider: "Luno" });
        }
        if (req.method === "POST" && url.pathname === "/api/transfers") {
          const data = await readBody(req);
          const recipientAddress = String(data.recipientAddress || "").trim();
          const currency = String(data.currency || "XBT").toUpperCase();
          const amount = String(data.amount || "");
          if (!allowedAssets.has(currency)) throw fail(400, "This asset is not enabled for transfers by the server.");
          if (!recipientAddress || recipientAddress.length > 512) throw fail(400, "Enter a valid destination address.");
          if (!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(amount) || Number(amount) <= 0) throw fail(400, "Enter a positive amount.");
          if (!/\d/.test(amount)) throw fail(400, "Enter a valid amount.");
          const externalId = randomBytes(16).toString("hex");
          const result = await luno("/api/1/send", { method: "POST", form: { address: recipientAddress, amount, currency, external_id: externalId } });
          const withdrawalId = result.withdrawal_id || result.id;
          if (!withdrawalId) throw fail(502, "Luno did not confirm a withdrawal identifier. Check your Luno account before retrying.");
          return sendJson(res, 202, { message: "Luno accepted the send request. Verify its status in your Luno account.", provider: "Luno", withdrawalId, status: "submitted" });
        }
        if (req.method === "GET" && url.pathname === "/api/settings") {
          const rows = await sql`SELECT full_name, email, language, currency, email_notifications, security_alerts FROM app_users WHERE id = ${user.id} LIMIT 1`;
          const p = rows[0];
          return sendJson(res, 200, { fullName: p.full_name || "", email: p.email, language: p.language || "en", currency: p.currency || "ZAR", emailNotifications: p.email_notifications, securityAlerts: p.security_alerts });
        }
        if (req.method === "PUT" && url.pathname === "/api/settings/profile") {
          const data = await readBody(req);
          const fullName = String(data.fullName || "").trim().slice(0, 120);
          const email = String(data.email || "").trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400, "Enter a valid email address.");
          try {
            const rows = await sql`UPDATE app_users SET full_name = ${fullName}, email = ${email}, updated_at = NOW() WHERE id = ${user.id} RETURNING full_name, email, language, currency, email_notifications, security_alerts`;
            const p = rows[0];
            return sendJson(res, 200, { fullName: p.full_name || "", email: p.email, language: p.language, currency: p.currency, emailNotifications: p.email_notifications, securityAlerts: p.security_alerts });
          } catch (error) { if (error.code === "23505") throw fail(409, "That email address is already registered."); throw error; }
        }
        if (req.method === "POST" && url.pathname === "/api/settings/password") {
          const data = await readBody(req);
          const currentPassword = String(data.currentPassword || "");
          const newPassword = String(data.newPassword || "");
          if (newPassword.length < 12 || newPassword.length > 256) throw fail(400, "New password must be between 12 and 256 characters.");
          const rows = await sql`SELECT password_hash FROM app_users WHERE id = ${user.id} LIMIT 1`;
          if (!rows[0] || !(await passwordMatches(currentPassword, rows[0].password_hash))) throw fail(401, "Current password is incorrect.");
          await sql`UPDATE app_users SET password_hash = ${await passwordHash(newPassword)}, updated_at = NOW() WHERE id = ${user.id}`;
          await sql`DELETE FROM app_sessions WHERE user_id = ${user.id}`;
          return sendJson(res, 200, { message: "Password changed. Please sign in again." }, { "Set-Cookie": clearCookie(secureCookies) });
        }
        if (req.method === "PUT" && url.pathname === "/api/settings/preferences") {
          const data = await readBody(req);
          const language = data.language === undefined ? null : String(data.language);
          const currency = data.currency === undefined ? null : String(data.currency).toUpperCase();
          const emailNotifications = typeof data.emailNotifications === "boolean" ? data.emailNotifications : null;
          const securityAlerts = typeof data.securityAlerts === "boolean" ? data.securityAlerts : null;
          if (language !== null && language !== "en") throw fail(400, "Unsupported language.");
          if (currency !== null && !["ZAR", "BTC"].includes(currency)) throw fail(400, "Unsupported display currency.");
          const rows = await sql`UPDATE app_users SET language = COALESCE(${language}, language), currency = COALESCE(${currency}, currency), email_notifications = COALESCE(${emailNotifications}, email_notifications), security_alerts = COALESCE(${securityAlerts}, security_alerts), updated_at = NOW() WHERE id = ${user.id} RETURNING full_name, email, language, currency, email_notifications, security_alerts`;
          const p = rows[0];
          return sendJson(res, 200, { fullName: p.full_name || "", email: p.email, language: p.language, currency: p.currency, emailNotifications: p.email_notifications, securityAlerts: p.security_alerts });
        }
        throw fail(404, "API route not found.");
      }

      // Serve the production build when available; API routes never fall through to the SPA.
      const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
      const filePath = resolve(DIST, "." + requestedPath);
      if (filePath !== DIST && !filePath.startsWith(DIST + sep)) throw fail(403, "Forbidden.");
      try {
        const info = await stat(filePath);
        if (!info.isFile()) throw new Error("Not a file");
        const body = await readFile(filePath);
        const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".json": "application/json; charset=utf-8" };
        res.writeHead(200, { "Content-Type": types[extname(filePath)] || "application/octet-stream", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'", "Referrer-Policy": "strict-origin-when-cross-origin" });
        return res.end(body);
      } catch {
        const index = await readFile(resolve(DIST, "index.html")).catch(() => null);
        if (!index) throw fail(503, "Frontend build is missing. Run npm run build before starting the server.");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "X-Content-Type-Options": "nosniff" });
        return res.end(index);
      }
    } catch (error) {
      const status = Number.isInteger(error.status) ? error.status : 500;
      if (status >= 500) console.error("[server]", error);
      return sendJson(res, status, { message: status === 500 ? "Internal server error. Check server logs." : error.message });
    }
  });

  const port = Number(process.env.PORT || 3000);
  server.listen(port, "0.0.0.0", () => console.log(`MyCrypto server listening on port ${port}`));
}
main().catch((error) => { console.error(error.message); process.exit(1); });
