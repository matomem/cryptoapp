# MyCrypto

MyCrypto is a React, TypeScript, and Vite cryptocurrency wallet interface.

## Development

Requirements: Node.js 20+ and npm.

```sh
git clone https://github.com/matomem/cryptoapp.git
cd cryptoapp
npm install
npm run dev
```

Run static checks before deploying:

```sh
npm run lint
npm run build
```

## Deployment and live services

The frontend now sends authentication, wallet, transaction, transfer, and account-settings requests to same-origin `/api/*` endpoints. These requests must be implemented by a trusted serverless/backend service before those features will work in production. A frontend-only deployment is not sufficient for authentication or cryptocurrency transfers.

Required backend routes used by the frontend:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/wallet/summary`
- `GET /api/wallet/address` (receive address)
- `GET /api/transactions`
- `POST /api/transfers`
- `GET /api/settings`
- `PUT /api/settings/profile`
- `POST /api/settings/password`
- `PUT /api/settings/preferences`

## Required production configuration

Configure secrets in the backend hosting provider's environment-variable settings, never in frontend code or committed files.

- `DATABASE_URL`: Neon PostgreSQL connection string.
- `SESSION_SECRET`: long, random server-side session signing secret.
- `LUNO_API_KEY_ID` and `LUNO_API_KEY_SECRET`: Luno API credentials with only the permissions actually required.
- `LUNO_API_BASE_URL`: official Luno API base URL appropriate to the intended environment.

Do not add these secrets to `VITE_*` variables: Vite exposes those values to every browser user. Do not commit a real `.env` file.

## Financial safety

The UI does not generate balances, addresses, or transaction history locally. It must receive them from the authenticated backend/provider. A transfer must be validated server-side, require an authenticated session and an explicit user confirmation, and be reported as complete only after the provider confirms it. Never use a user's exchange API credentials in browser code.

## Project status

The interface is being migrated away from mock behavior. Production operation is not complete until the backend routes above are deployed, Neon is configured, the Luno integration is authorized and tested, and the production build and end-to-end checks pass.
