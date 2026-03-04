import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ensureAuthenticated, ensureRole } from '../modules/auth';
import { auditLog } from '../modules/audit';
import { Server as SocketIOServer } from 'socket.io';

const prisma = new PrismaClient();

export default (io: SocketIOServer) => {
  const router = Router();

  // Real-time status (mock)
  router.get('/status', (req, res) => {
    res.json({ resources: [
      { id: 'pc1', type: 'PC', name: 'PC-1', status: 'online' },
      { id: 'usrp1', type: 'USRP', name: 'USRP-1', status: 'busy' }
    ] });
  });

  // Reservations CRUD
  router.get('/reservations', ensureAuthenticated, async (req, res) => {
    const reservations = await prisma.reservation.findMany();
    res.json({ reservations });
  });

  router.post('/reservations', ensureAuthenticated, async (req, res) => {
    const { resource, startTime, endTime } = req.body;
    // Conflict detection
    const conflicts = await prisma.reservation.findMany({
      where: {
        resource,
        OR: [
          { startTime: { lte: endTime }, endTime: { gte: startTime } }
        ]
      }
    });
    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'Reservation conflict detected' });
    }
    const reservation = await prisma.reservation.create({
      data: {
        resource,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        userId: req.user.id
      }
    });
    await auditLog(req.user.id, 'reservation_create', `Resource: ${resource}`);
    const reservations = await prisma.reservation.findMany();
    res.json({ reservations });
  });

  // Terminal session scaffold
  router.post('/terminal/start', ensureAuthenticated, async (req, res) => {
    // TODO: Implement SSH session start
    await auditLog(req.user.id, 'terminal_start', 'Started terminal session');
    res.json({ sessionId: 'placeholder', message: 'SSH session scaffold' });
  });

  router.post('/terminal/end', ensureAuthenticated, async (req, res) => {
    // TODO: Implement SSH session end
    await auditLog(req.user.id, 'terminal_end', 'Ended terminal session');
    res.json({ message: 'SSH session ended (scaffold)' });
  });

  // Admin-only example
  router.get('/admin/users', ensureAuthenticated, ensureRole('ADMIN'), async (req, res) => {
    const users = await prisma.user.findMany();
    res.json({ users });
  });

  return router;
};
