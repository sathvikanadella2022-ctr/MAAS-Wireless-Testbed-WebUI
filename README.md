# University Open-Source 5G Testbed Portal

## Overview
A full-stack MVP web portal for managing a university open-source 5G testbed. Features include:
- Globus OAuth2/OIDC login
- Dashboard for real-time status of bare-metal PCs and USRPs
- Reservations with conflict detection
- Web SSH terminal scaffold
- Documentation pages
- Role-based access control (Researcher, Admin)
- Auditing/logging scaffold
- Integration scaffolding for MAAS/OpenStack Ironic

## Tech Stack
- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **Database:** Postgres via Prisma

## Local Development

### Prerequisites
- Node.js (18+ recommended)
- PostgreSQL (running locally or remote)

### Setup

#### 1. Install dependencies
```
cd frontend && npm install
cd ../backend && npm install
```

#### 2. Configure environment variables
- Copy `.env.example` to `.env` in both `frontend/` and `backend/` and fill in required values.

#### 3. Setup database (backend)
```
cd backend
npx prisma migrate dev --name init
```

#### 4. Run locally
- In two terminals:
```
cd frontend && npm run dev
cd backend && npm run dev
```

#### 5. Open in browser
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Folder Structure
- `frontend/` — React app (Vite)
- `backend/` — Express API server (TypeScript, Prisma)

## Notes
- Globus OAuth2/OIDC integration is stubbed for local dev; see backend `.env.example` for required secrets.
- All features are MVP-level and use mock data where integration is not possible.
