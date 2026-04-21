# 5G Portal Backend

## Setup

1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies:
   ```
   npm install
   ```
3. Run Prisma migrations:
   ```
   npx prisma migrate dev --name init
   ```
4. Start dev server:
   ```
   npm run dev
   ```

## Single-Port Deployment

Build the frontend first, then run the backend on local port `3003`. In production, place an HTTPS reverse proxy on public port `3002`. When `frontend/dist` exists, the backend serves the React app and API from the same origin behind that proxy.

Start the production server with:

```
npm start
```

Example backend environment:

```env
PUBLIC_BACKEND_URL=https://ubuntu-4.engr.uconn.edu:3002
FRONTEND_URL=https://ubuntu-4.engr.uconn.edu:3002
GLOBUS_REDIRECT_URI=https://ubuntu-4.engr.uconn.edu:3002/auth/callback
PORT=3003
NODE_ENV=production
SESSION_COOKIE_SECURE=true
```

## API Endpoints
- `/api/status` — Real-time resource status (mock)
- `/api/reservations` — Create/view reservations (auth required)
- `/api/terminal/start` — Start SSH session (scaffold)
- `/api/terminal/end` — End SSH session (scaffold)
- `/api/admin/users` — List users (admin only)
- `/auth/login` — Globus login
- `/auth/callback` — Globus callback (stub)

## Notes
- Role-based access enforced on protected routes
- Auditing scaffolded in `modules/audit.ts`
- MAAS/Ironic integration scaffolds in `integrations/`
- Globus must be configured with the exact backend callback URI. Set either `GLOBUS_REDIRECT_URI` directly or `PUBLIC_BACKEND_URL` and let the app resolve `/auth/callback`.
- If `FRONTEND_URL` is unset, auth redirects now fall back to `PUBLIC_BACKEND_URL` and then `http://localhost:3002`.
