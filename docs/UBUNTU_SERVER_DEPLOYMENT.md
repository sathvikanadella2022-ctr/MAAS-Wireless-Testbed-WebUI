# Ubuntu Server Deployment

This guide deploys the portal on a single public port with HTTPS:

- App URL: `https://ubuntu-4.engr.uconn.edu:3002`
- Globus callback: `https://ubuntu-4.engr.uconn.edu:3002/auth/callback`

The recommended layout is:

- public HTTPS listener on `:3002`
- reverse proxy forwards to `127.0.0.1:3003`
- Node backend serves the built frontend bundle on `127.0.0.1:3003`

This keeps the app on a single public port while satisfying Globus's HTTPS callback requirement.

## 1. Install system packages

```bash
sudo apt update
sudo apt install -y git curl build-essential openssh-client postgresql postgresql-contrib
```

## 2. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 3. Create a service user

```bash
sudo useradd --system --create-home --shell /bin/bash portal
sudo mkdir -p /opt/5g-portal
sudo chown portal:portal /opt/5g-portal
```

## 4. Clone the repo

```bash
sudo -u portal git clone <your-repo-url> /opt/5g-portal
cd /opt/5g-portal
```

## 5. Install dependencies

```bash
cd /opt/5g-portal/backend && sudo -u portal npm install
cd /opt/5g-portal/frontend && sudo -u portal npm install
```

## 6. Configure PostgreSQL

```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE DATABASE "5g_portal";
CREATE USER portal_user WITH PASSWORD 'change_me';
GRANT ALL PRIVILEGES ON DATABASE "5g_portal" TO portal_user;
\q
```

## 7. Create the production env file

Start from the checked-in template:

```bash
cp /opt/5g-portal/backend/env.production.example /opt/5g-portal/backend/env.production
chmod 600 /opt/5g-portal/backend/env.production
```

Edit `/opt/5g-portal/backend/env.production` and set at least:

```env
DATABASE_URL=postgresql://portal_user:change_me@localhost:5432/5g_portal
PUBLIC_BACKEND_URL=https://ubuntu-4.engr.uconn.edu:3002
FRONTEND_URL=https://ubuntu-4.engr.uconn.edu:3002
GLOBUS_REDIRECT_URI=https://ubuntu-4.engr.uconn.edu:3002/auth/callback
GLOBUS_CLIENT_ID=your-globus-client-id
GLOBUS_CLIENT_SECRET=your-globus-client-secret
GLOBUS_ADMIN_EMAILS=admin1@uconn.edu,admin2@uconn.edu
SESSION_SECRET=replace-with-a-long-random-secret
PORT=3003
NODE_ENV=production
SESSION_COOKIE_SECURE=true
DEV_AUTH=false
```

Notes:

- Keep `PUBLIC_BACKEND_URL` and `FRONTEND_URL` identical for this single-port deployment.
- Register the exact callback URI with Globus before enabling login.
- The backend stays on local port `3003`; only the reverse proxy should be exposed publicly on `3002`.

## 8. Configure terminal targets

Edit `/opt/5g-portal/backend/data/terminal-targets.json` and replace any Windows-only key paths with Linux paths.

Example:

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
    "privateKeyPath": "/home/portal/.ssh/controller_key",
    "reservationResource": "PC-1",
    "description": "SSH terminal for the controller machine."
  }
]
```

## 9. Run Prisma

```bash
cd /opt/5g-portal/backend
sudo -u portal npx prisma generate
sudo -u portal npx prisma migrate deploy
```

Use `npx prisma migrate dev --name init` only for local development, not for the server.

## 10. Build the frontend and backend

```bash
cd /opt/5g-portal/frontend && sudo -u portal npm run build
cd /opt/5g-portal/backend && sudo -u portal npm run build
```

## 11. Install Caddy as the HTTPS reverse proxy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Copy the provided config:

```bash
sudo mkdir -p /etc/caddy
sudo cp /opt/5g-portal/deploy/caddy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl restart caddy
```

## 12. Smoke test the backend locally

```bash
cd /opt/5g-portal/backend
sudo -u portal bash -lc 'set -a && source /opt/5g-portal/backend/env.production && set +a && npm start'
```

Expected backend result:

- backend listens on port `3003`
- `/` returns the frontend HTML on `http://127.0.0.1:3003/`
- `/dashboard` returns the frontend HTML on `http://127.0.0.1:3003/dashboard`

## 13. Install the systemd service

```bash
sudo cp /opt/5g-portal/deploy/systemd/5g-portal.service /etc/systemd/system/5g-portal.service
sudo systemctl daemon-reload
sudo systemctl enable --now 5g-portal
```

## 14. Useful service commands

```bash
sudo systemctl status 5g-portal
sudo journalctl -u 5g-portal -f
sudo systemctl restart 5g-portal
sudo systemctl status caddy
```

## 15. Update workflow

```bash
cd /opt/5g-portal
sudo -u portal git pull
cd /opt/5g-portal/backend && sudo -u portal npm install
cd /opt/5g-portal/frontend && sudo -u portal npm install
cd /opt/5g-portal/frontend && sudo -u portal npm run build
cd /opt/5g-portal/backend && sudo -u portal npm run build
sudo systemctl restart 5g-portal
sudo systemctl reload caddy
```

## 16. Firewall

Only `3002` needs to be open publicly for the app itself.

If `ufw` is in use:

```bash
sudo ufw allow 3002/tcp
```

## 17. Before go-live

- Confirm `https://ubuntu-4.engr.uconn.edu:3002` loads the app.
- Confirm Globus is registered with `https://ubuntu-4.engr.uconn.edu:3002/auth/callback`.
- Confirm `backend/data/terminal-targets.json` does not contain Windows paths.
- Confirm `DEV_AUTH=false`.
- Rotate any previously exposed Globus secrets before deployment.
