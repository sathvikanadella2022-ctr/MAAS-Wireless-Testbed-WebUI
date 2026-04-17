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
