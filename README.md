# MyCrypto

MyCrypto is a React, TypeScript, and Vite cryptocurrency wallet interface backed by a Node.js API server, Neon PostgreSQL, and the Luno API. It does not fall back to fake balances or pretend transactions when services are unavailable.

## Quick start from a clone

Requirements: Node.js 20+ and npm.

```sh
git clone https://github.com/matomem/cryptoapp.git
cd cryptoapp
npm install
cp .env.example .env
```

Configure `.env` with your Neon PostgreSQL connection string, a random session secret of at least 32 characters, and your Luno API credentials. Then run the SQL in `server/schema.sql` once against the same Neon database.

```sh
npm run build
npm start
```

Open http://localhost:3000. See [DEPLOYMENT.md](DEPLOYMENT.md) for complete instructions and troubleshooting.

## Real services

- Registration, login, logout, sessions, profile, password changes and preferences are handled by the Node API and stored in Neon.
- Balances, receiving addresses, transaction history and crypto send requests are fetched from Luno using server-side API credentials.
- If required credentials, tables, or provider permissions are missing, the app returns an error rather than creating sample data.
- Sending cryptocurrency can move real funds. Configure `LUNO_ALLOWED_ASSETS` conservatively and only enable Luno write permissions when you intend to send funds.

## Security

Keep `.env` private. Never expose Neon or Luno secrets through `VITE_*` variables or browser code. Deploy the frontend and backend together on a Node-capable host over HTTPS. A static-only deployment without the API server cannot provide live account functionality.

## Development checks

```sh
npm run lint
npm run build
node --check server/index.mjs
```
