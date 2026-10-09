# Run MyCrypto from a Git clone

## Requirements

- Node.js 20 or newer and npm
- A Neon PostgreSQL database
- A Luno account and API key for live wallet features

## Install

```sh
git clone https://github.com/matomem/cryptoapp.git
cd cryptoapp
npm install
cp .env.example .env
```

Edit `.env` with your Neon connection string and a randomly generated `SESSION_SECRET`. Add Luno credentials on the server only. Do not commit `.env` or paste secrets into frontend code.

## Initialize Neon

Open the Neon SQL Editor for your database, paste the contents of `server/schema.sql`, and run it once. This creates the account and session tables. The server intentionally exits at startup if the database URL or session secret is missing.

## Build and run

```sh
npm run build
npm start
```

Open http://localhost:3000. The Node server serves the built frontend and its same-origin API routes, so API requests do not rely on a separate mock server.

## Live Luno configuration

Create an API key in Luno with only the permissions you actually need. Read-only balance/address/transaction functionality requires the matching read permissions. Sending crypto requires Luno's send permission and can move real funds. Configure only assets you intend to support in `LUNO_ALLOWED_ASSETS` (use Luno asset codes such as `XBT`, not the display label `BTC`).

A successful send API response means Luno accepted the request; it does not necessarily mean the blockchain transfer is complete. Confirm the withdrawal status in Luno. Test first with small amounts and a verified destination. Never enable write permissions on a key that is not intended to send funds.

## Deployment

Deploy the built frontend and Node server together on a Node-capable host. Set the environment variables in the host's secret manager. The process must be reachable over HTTPS in production because session cookies are marked Secure when `NODE_ENV=production`. A static-only host is insufficient unless it also runs/proxies the API backend.

## Troubleshooting

- `DATABASE_URL is required`: configure Neon in the local `.env` or hosting environment.
- Database table errors: run `server/schema.sql` against the same Neon database.
- `Luno integration is not configured`: set the Luno key ID and secret on the backend host.
- Luno permission errors: regenerate/configure the key with only the permissions needed for the endpoint.
- Do not create fake fallback balances or transactions to mask configuration failures; the UI should show the API error.
