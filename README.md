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
- Backend API: http://localhost:3002

## Ubuntu Setup

Use these steps when moving the project to a new Ubuntu machine.

### 1. Install system packages
```bash
sudo apt update
sudo apt install -y git curl build-essential openssh-client postgresql postgresql-contrib
```

### 2. Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 3. Clone the repository
```bash
git clone <your-repo-url>
cd 5G_portal
```

### 4. Install frontend and backend dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

Do not copy `node_modules` from Windows to Ubuntu. Install dependencies again on Ubuntu so native packages like `node-pty` are built for Linux.

### 5. Configure backend environment variables
```bash
cd ../backend
cp .env.example .env
```

Edit `backend/.env` and set at least:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/5g_portal
PUBLIC_BACKEND_URL=https://ubuntu-4.engr.uconn.edu:3002
FRONTEND_URL=https://ubuntu-4.engr.uconn.edu:3002
GLOBUS_REDIRECT_URI=https://ubuntu-4.engr.uconn.edu:3002/auth/callback
SESSION_SECRET=some-long-random-secret
PORT=3003
NODE_ENV=production
SESSION_COOKIE_SECURE=true
```

If you want the terminal to connect to remote lab machines over SSH, add entries like:

```env
TERMINAL_HOST_PC_1=192.168.1.25
TERMINAL_USER_PC_1=ubuntu
TERMINAL_PORT_PC_1=22
TERMINAL_KEY_PC_1=/home/youruser/.ssh/pc1_key
```

For a cleaner multi-machine list in the UI, prefer `backend/data/terminal-targets.json` instead of many `TERMINAL_HOST_*` variables. Example:

```json
[
  {
    "resource": "local",
    "label": "Local shell (dev / demo)",
    "type": "local",
    "description": "Runs a shell directly on the backend host."
  },
  {
    "resource": "controller",
    "label": "Controller Node",
    "type": "ssh",
    "host": "10.10.10.13",
    "username": "controller",
    "port": 22,
    "privateKeyPath": "/home/youruser/.ssh/controller_key",
    "description": "SSH terminal for the controller machine."
  }
]
```

### 6. Set up PostgreSQL
```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE DATABASE "5g_portal";
CREATE USER portal_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE "5g_portal" TO portal_user;
\q
```

Update `DATABASE_URL` in `backend/.env` to match the database credentials you created.

### 7. Run Prisma
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 8. Build the frontend
```bash
cd ../frontend
npm run build
```

### 9. Start the backend
```bash
cd ../backend
npm start
```

In production, expose only `3002` publicly over HTTPS and reverse-proxy it to the backend on `127.0.0.1:3003`.

### 10. Open the app
Visit:

```text
https://ubuntu-4.engr.uconn.edu:3002
```

### Ubuntu Notes
- The terminal feature uses `bash` on Linux and can SSH to remote hosts if `TERMINAL_HOST_*` or `TERMINAL_RESOURCE_HOSTS` is configured in `backend/.env`.
- Make sure `ssh` is installed on the Ubuntu machine if you plan to use remote terminal sessions.
- If you move SSH keys from Windows, update their paths to Linux-style paths such as `/home/youruser/.ssh/...`.
- Globus should use `https://ubuntu-4.engr.uconn.edu:3002/auth/callback` as the registered callback URI for this deployment.
- If the checked-in `backend/.env` contains real secrets, rotate them before moving to a new machine.

## Folder Structure
- `frontend/` — React app (Vite)
- `backend/` — Express API server (TypeScript, Prisma)

## Documentation
- Full step-by-step setup and operations guide: `docs/ARA_SETUP_GUIDE.md`
- Ubuntu single-port deployment guide: `docs/UBUNTU_SERVER_DEPLOYMENT.md`

## Notes
- Globus OAuth2/OIDC integration is stubbed for local dev; see backend `.env.example` for required secrets.
- All features are MVP-level and use mock data where integration is not possible.
- Production deployment can run entirely on `:3002` because the backend now serves the built frontend bundle when `frontend/dist` exists.

##Backend
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/5g_portal
GLOBUS_CLIENT_ID=your-globus-client-id
GLOBUS_CLIENT_SECRET=your-globus-client-secret
PUBLIC_BACKEND_URL=https://ubuntu-4.engr.uconn.edu:3002
GLOBUS_REDIRECT_URI=https://ubuntu-4.engr.uconn.edu:3002/auth/callback
FRONTEND_URL=https://ubuntu-4.engr.uconn.edu:3002
SESSION_SECRET=dev-secret
PORT=3003
NODE_ENV=production
SESSION_COOKIE_SECURE=true


##frontend
# Frontend environment variables
VITE_API_URL=http://localhost:3002
VITE_GLOBUS_CLIENT_ID=efe0cf86-a07c-443f-a5cc-b52cfcb13968
VITE_GLOBUS_AUTH_URL=https://auth.globus.org/v2/oauth2/authorize
