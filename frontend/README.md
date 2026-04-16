# 5G Portal Frontend

## Setup

1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies:
   ```
   npm install
   ```
3. Start dev server:
   ```
   npm run dev
   ```

## Features
- Homepage with Documentation and Login cards
- Dashboard (real-time websocket updates driven by reservation state and mock resource inventory)
- Reservations (create/view, conflict detection)
- Web SSH terminal (placeholder)
- Documentation pages

## Notes
- API URL and Globus client ID set in `.env`
- Real Globus login requires backend `GLOBUS_CLIENT_ID`, `GLOBUS_CLIENT_SECRET`, and `GLOBUS_REDIRECT_URI`
- Demo login appears only when backend `DEV_AUTH=true`
- Uses Material UI for styling
