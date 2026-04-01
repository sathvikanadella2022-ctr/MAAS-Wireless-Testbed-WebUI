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

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { path: '/socket.io', cors: { origin: '*' } });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(auditLogger);

app.use('/api', apiRouter(io));
app.use('/auth', authRouter);

// WebSocket: mock status updates
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

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
