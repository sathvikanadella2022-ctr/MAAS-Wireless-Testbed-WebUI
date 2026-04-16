import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import passport from 'passport';
import { globusStrategy } from './modules/auth';
import apiRouter from './routes/api';
import authRouter from './routes/auth';
import { auditLogger } from './modules/audit';
import { claimPendingSession, spawnPtySession, destroySession } from './modules/ssh';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { path: '/socket.io', cors: { origin: '*' } });
const cookieSecure = process.env.SESSION_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: cookieSecure,
    sameSite: 'lax'
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(auditLogger);

app.use('/api', apiRouter(io));
app.use('/auth', authRouter);

// WebSocket: real-time resource status updates
io.on('connection', (socket) => {
  socket.emit('statusUpdate', [
    { id: 'pc1', type: 'PC', name: 'PC-1', status: 'online' },
    { id: 'pc2', type: 'PC', name: 'PC-2', status: 'online' },
    { id: 'pc3', type: 'PC', name: 'PC-3', status: 'busy' },
    { id: 'pc4', type: 'PC', name: 'PC-4', status: 'online' },
    { id: 'usrp1', type: 'USRP', name: 'USRP-1', status: 'busy' },
    { id: 'usrp2', type: 'USRP', name: 'USRP-2', status: 'offline' }
  ]);
});

// WebSocket: terminal namespace — one PTY per authenticated session
const terminalNs = io.of('/terminal');

terminalNs.on('connection', (socket) => {
  const sessionId = socket.handshake.auth.sessionId as string | undefined;

  if (!sessionId) {
    socket.emit('terminal:error', 'No session ID provided.');
    socket.disconnect();
    return;
  }

  const pending = claimPendingSession(sessionId);
  if (!pending) {
    socket.emit('terminal:error', 'Session not found or expired. Please start a new session.');
    socket.disconnect();
    return;
  }

  let ptyProcess;
  try {
    ptyProcess = spawnPtySession(sessionId, pending.userId, pending.resource);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start terminal session.';
    socket.emit('terminal:error', message);
    socket.disconnect();
    return;
  }

  ptyProcess.onData((data) => {
    socket.emit('terminal:output', data);
  });

  ptyProcess.onExit(() => {
    socket.emit('terminal:exit');
    socket.disconnect();
  });

  socket.on('terminal:input', (data: string) => {
    ptyProcess.write(data);
  });

  socket.on('terminal:resize', ({ cols, rows }: { cols: number; rows: number }) => {
    try { ptyProcess.resize(cols, rows); } catch { /* ignore race */ }
  });

  socket.on('disconnect', () => {
    destroySession(sessionId);
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
