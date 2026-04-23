import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { DeploymentStatus, Role } from '@prisma/client';
import { ensureAuthenticated, ensureRole, isDevAuthEnabled } from '../modules/auth';
import { auditLog } from '../modules/audit';
import { prisma } from '../modules/prisma';
import { canStartTerminal, destroySession, listTerminalTargets, registerPendingSession, resolveReservationResource } from '../modules/ssh';
import { Server as SocketIOServer } from 'socket.io';

type ResourceStatus = 'online' | 'offline' | 'busy';
type DeploymentStatusLabel = 'queued' | 'deploying' | 'ready' | 'failed';

interface PortalUser {
  id: string;
  email: string;
  role: Role;
}

interface ResourceRecord {
  id: string;
  type: 'PC' | 'USRP';
  name: string;
  status: ResourceStatus;
  location: string;
  supportsImaging: boolean;
  notes: string;
}

interface ImageRecord {
  id: string;
  name: string;
  version: string;
  os: string;
  stack: string;
  description: string;
}

interface ReservationRecord {
  id: string;
  userId: string;
  userEmail: string;
  resource: string;
  startTime: string;
  endTime: string;
  purpose: string;
  project: string;
}

interface DeploymentRecord {
  id: string;
  resource: string;
  imageId: string;
  imageName: string;
  requestedBy: string;
  scheduledAt: string;
  notes: string;
  status: DeploymentStatusLabel;
  createdAt: string;
}

const resources: ResourceRecord[] = [
  {
    id: 'pc1',
    type: 'PC',
    name: 'PC-1',
    status: 'online',
    location: 'ITEB Lab Rack A',
    supportsImaging: true,
    notes: 'Primary OAI gNB host'
  },
  {
    id: 'pc2',
    type: 'PC',
    name: 'PC-2',
    status: 'online',
    location: 'ITEB Lab Rack A',
    supportsImaging: true,
    notes: 'Core network validation node'
  },
  {
    id: 'pc3',
    type: 'PC',
    name: 'PC-3',
    status: 'busy',
    location: 'ITEB Lab Rack B',
    supportsImaging: true,
    notes: 'Reserved for throughput experiments'
  },
  {
    id: 'pc4',
    type: 'PC',
    name: 'PC-4',
    status: 'online',
    location: 'ITEB Lab Rack B',
    supportsImaging: true,
    notes: 'Spare validation node for image testing'
  },
  {
    id: 'usrp1',
    type: 'USRP',
    name: 'USRP-1',
    status: 'busy',
    location: 'ITEB Lab RF Shelf',
    supportsImaging: false,
    notes: 'Attached to PC-1'
  },
  {
    id: 'usrp2',
    type: 'USRP',
    name: 'USRP-2',
    status: 'offline',
    location: 'ITEB Lab RF Shelf',
    supportsImaging: false,
    notes: 'Awaiting calibration'
  }
];

const images: ImageRecord[] = [
  {
    id: 'img-oai-gnb',
    name: 'OAI gNB Base',
    version: '2026.03',
    os: 'Ubuntu 24.04 LTS',
    stack: 'OpenAirInterface + UHD',
    description: 'Clean gNB image with UHD drivers and baseline radio tooling.'
  },
  {
    id: 'img-oai-core',
    name: 'OAI Core Lab',
    version: '2026.02',
    os: 'Ubuntu 24.04 LTS',
    stack: 'OAI Core + Metrics',
    description: 'Core network image with logging and Grafana exporters enabled.'
  },
  {
    id: 'img-blank',
    name: 'Research Sandbox',
    version: '2026.01',
    os: 'Ubuntu 24.04 LTS',
    stack: 'Minimal Ubuntu',
    description: 'Minimal baseline image for custom experiments and package installs.'
  }
];

const fallbackReservations: ReservationRecord[] = [];
const fallbackDeployments: DeploymentRecord[] = [];

const findFallbackReservationConflict = (resource: string, start: Date, end: Date) =>
  fallbackReservations.find((reservation) => (
    reservation.resource === resource &&
    new Date(reservation.startTime).getTime() < end.getTime() &&
    new Date(reservation.endTime).getTime() > start.getTime()
  )) ?? null;

const getUser = (req: any) => req.user as PortalUser | undefined;

const deploymentStatusLabelMap: Record<DeploymentStatus, DeploymentStatusLabel> = {
  QUEUED: 'queued',
  DEPLOYING: 'deploying',
  READY: 'ready',
  FAILED: 'failed'
};

const upsertSessionUser = async (user: PortalUser | undefined) => {
  if (!user) {
    return null;
  }

  try {
    return await prisma.user.upsert({
      where: { email: user.email },
      update: { role: user.role },
      create: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch {
    // DB not available — return a plain object so routes keep working in dev
    return { id: user.id, email: user.email, role: user.role };
  }
};

const serializeReservation = (reservation: {
  id: string;
  userId: string;
  resource: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
  project: string;
  user: { email: string };
}) => ({
  id: reservation.id,
  userId: reservation.userId,
  userEmail: reservation.user.email,
  resource: reservation.resource,
  startTime: reservation.startTime.toISOString(),
  endTime: reservation.endTime.toISOString(),
  purpose: reservation.purpose,
  project: reservation.project
});

const loadReservations = async () => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { startTime: 'asc' }
    });
    return reservations.map(serializeReservation);
  } catch {
    return [...fallbackReservations].sort(
      (left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime()
    );
  }
};

const loadDeployments = async () => {
  try {
    const deployments = await prisma.deployment.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return deployments.map((deployment) => ({
      id: deployment.id,
      resource: deployment.resource,
      imageId: deployment.imageId,
      imageName: deployment.imageName,
      requestedBy: deployment.requestedBy,
      scheduledAt: deployment.scheduledAt.toISOString(),
      notes: deployment.notes ?? '',
      status: deploymentStatusLabelMap[deployment.status],
      createdAt: deployment.createdAt.toISOString()
    }));
  } catch {
    return [...fallbackDeployments].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }
};

const updateResourceStatus = async (io: SocketIOServer) => {
  const now = Date.now();
  let reservations: { resource: string; startTime: Date; endTime: Date }[] = [];
  try {
    reservations = await prisma.reservation.findMany({
      select: { resource: true, startTime: true, endTime: true }
    });
  } catch {
    // DB not available — skip status update from reservations
  }

  resources.forEach((resource) => {
    if (resource.type === 'USRP' && resource.status === 'offline') {
      return;
    }

    const hasActiveReservation = reservations.some((reservation) => {
      if (reservation.resource !== resource.name) {
        return false;
      }

      const start = reservation.startTime.getTime();
      const end = reservation.endTime.getTime();
      return start <= now && end >= now;
    });

    resource.status = hasActiveReservation ? 'busy' : resource.status === 'offline' ? 'offline' : 'online';
  });

  io.emit('statusUpdate', resources.map(({ id, type, name, status }) => ({ id, type, name, status })));
};

export default (io: SocketIOServer) => {
  const router = Router();
  const devAuthEnabled = isDevAuthEnabled();

  void updateResourceStatus(io).catch((error) => {
    console.error('Failed to initialize resource status:', error);
  });

  router.get('/status', async (_req, res) => {
    await updateResourceStatus(io);
    res.json({
      resources: resources.map((resource) => ({
        id: resource.id,
        type: resource.type,
        name: resource.name,
        status: resource.status,
        location: resource.location,
        supportsImaging: resource.supportsImaging,
        notes: resource.notes
      }))
    });
  });

  router.get('/reservations', ensureAuthenticated, async (_req, res) => {
    res.json({ reservations: await loadReservations() });
  });

  router.post('/reservations', ensureAuthenticated, async (req, res) => {
    const { resource, startTime, endTime, purpose, project } = req.body as {
      resource?: string;
      startTime?: string;
      endTime?: string;
      purpose?: string;
      project?: string;
    };

    const user = getUser(req);
    const dbUser = await upsertSessionUser(user);

    if (!dbUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!resource || !startTime || !endTime || !purpose || !project) {
      return res.status(400).json({ error: 'Fill in resource, time window, project, and purpose.' });
    }

    const selectedResource = resources.find((entry) => entry.name === resource);
    if (!selectedResource) {
      return res.status(404).json({ error: 'Selected resource was not found.' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Choose valid start and end times.' });
    }

    if (start <= new Date()) {
      return res.status(400).json({ error: 'Reservations must start in the future.' });
    }

    if (end <= start) {
      return res.status(400).json({ error: 'End time must be after start time.' });
    }

    let conflictingReservation = null;
    try {
      conflictingReservation = await prisma.reservation.findFirst({
        where: {
          resource,
          startTime: { lt: end },
          endTime: { gt: start }
        },
        orderBy: { startTime: 'asc' }
      });
    } catch {
      // DB unavailable — skip conflict check in dev
    }

    if (!conflictingReservation) {
      conflictingReservation = findFallbackReservationConflict(resource, start, end);
    }

    if (conflictingReservation) {
      return res.status(409).json({
        error: `Somebody already booked ${resource} from ${conflictingReservation.startTime.toLocaleString()} to ${conflictingReservation.endTime.toLocaleString()}. Please choose a different time.`
      });
    }

    try {
      await prisma.reservation.create({
        data: {
          userId: dbUser.id,
          resource,
          startTime: start,
          endTime: end,
          purpose: purpose.trim(),
          project: project.trim()
        }
      });
    } catch {
      fallbackReservations.push({
        id: `reservation-${randomBytes(8).toString('hex')}`,
        userId: dbUser.id,
        userEmail: dbUser.email,
        resource,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        purpose: purpose.trim(),
        project: project.trim()
      });
    }

    await updateResourceStatus(io);
    await auditLog(dbUser.id, 'reservation_create', `Resource: ${resource}; Project: ${project.trim()}`);
    res.status(201).json({ reservations: await loadReservations() });
  });

  router.delete('/reservations/:id', ensureAuthenticated, async (req, res) => {
    const user = getUser(req);
    let reservation: { id: string; userId: string; resource: string; user: { email: string } } | null = null;
    let useFallbackReservationStore = false;
    try {
      reservation = await prisma.reservation.findUnique({
        where: { id: req.params.id },
        include: { user: { select: { email: true } } }
      });
    } catch {
      const fallbackReservation = fallbackReservations.find((entry) => entry.id === req.params.id);
      reservation = fallbackReservation ? {
        id: fallbackReservation.id,
        userId: fallbackReservation.userId,
        resource: fallbackReservation.resource,
        user: { email: fallbackReservation.userEmail }
      } : null;
      useFallbackReservationStore = true;
    }

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    const isOwner = reservation.userId === user?.id;
    const isAdmin = user?.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You can only cancel your own reservations.' });
    }

    try {
      if (useFallbackReservationStore) {
        const reservationIndex = fallbackReservations.findIndex((entry) => entry.id === reservation.id);
        if (reservationIndex >= 0) {
          fallbackReservations.splice(reservationIndex, 1);
        }
      } else {
        await prisma.reservation.delete({ where: { id: reservation.id } });
      }
    } catch {
      return res.status(503).json({ error: 'Database unavailable.' });
    }
    await updateResourceStatus(io);
    await auditLog(user?.id, 'reservation_cancel', `Resource: ${reservation.resource}`);
    res.json({ reservations: await loadReservations() });
  });

  router.get('/images', ensureAuthenticated, async (_req, res) => {
    res.json({ images });
  });

  router.get('/deployments', ensureAuthenticated, async (_req, res) => {
    res.json({ deployments: await loadDeployments() });
  });

  router.get('/terminal/targets', ensureAuthenticated, async (_req, res) => {
    res.json({ targets: listTerminalTargets() });
  });

  router.post('/deployments', ensureAuthenticated, async (req, res) => {
    const { resource, imageId, scheduledAt, notes } = req.body as {
      resource?: string;
      imageId?: string;
      scheduledAt?: string;
      notes?: string;
    };

    const user = getUser(req);
    const dbUser = await upsertSessionUser(user);

    if (!dbUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!resource || !imageId || !scheduledAt) {
      return res.status(400).json({ error: 'Choose a resource, image, and deployment time.' });
    }

    const selectedResource = resources.find((entry) => entry.name === resource);
    if (!selectedResource || !selectedResource.supportsImaging) {
      return res.status(400).json({ error: 'This resource cannot accept an image deployment.' });
    }

    const selectedImage = images.find((entry) => entry.id === imageId);
    if (!selectedImage) {
      return res.status(404).json({ error: 'Selected image was not found.' });
    }

    const deploymentTime = new Date(scheduledAt);
    if (Number.isNaN(deploymentTime.getTime())) {
      return res.status(400).json({ error: 'Choose a valid deployment time.' });
    }

    let overlappingReservation = null;
    try {
      overlappingReservation = await prisma.reservation.findFirst({
        where: {
          resource,
          startTime: { lt: new Date(deploymentTime.getTime() + 90 * 60 * 1000) },
          endTime: { gt: deploymentTime }
        }
      });
    } catch {
      // DB unavailable — skip overlap check in dev
    }

    if (!overlappingReservation) {
      overlappingReservation = findFallbackReservationConflict(
        resource,
        deploymentTime,
        new Date(deploymentTime.getTime() + 90 * 60 * 1000)
      );
    }

    if (overlappingReservation) {
      return res.status(409).json({
        error: `Deployment overlaps with a reservation on ${resource}. Choose another time.`
      });
    }

    try {
      await prisma.deployment.create({
        data: {
          userId: dbUser.id,
          resource,
          imageId,
          imageName: selectedImage.name,
          requestedBy: dbUser.email,
          scheduledAt: deploymentTime,
          notes: notes?.trim() || null,
          status: deploymentTime.getTime() <= Date.now() ? DeploymentStatus.DEPLOYING : DeploymentStatus.QUEUED
        }
      });
    } catch {
      fallbackDeployments.unshift({
        id: `deployment-${randomBytes(8).toString('hex')}`,
        resource,
        imageId,
        imageName: selectedImage.name,
        requestedBy: dbUser.email,
        scheduledAt: deploymentTime.toISOString(),
        notes: notes?.trim() || '',
        status: deploymentTime.getTime() <= Date.now() ? 'deploying' : 'queued',
        createdAt: new Date().toISOString()
      });
    }

    await auditLog(dbUser.id, 'deployment_create', `Resource: ${resource}; Image: ${selectedImage.name}`);
    res.status(201).json({ deployments: await loadDeployments() });
  });

  router.post('/terminal/start', ensureAuthenticated, async (req, res) => {
    const { resource } = req.body as { resource?: string };
    const user = getUser(req);
    const reservationResource = resource ? resolveReservationResource(resource) : '';

    if (!resource) {
      return res.status(400).json({ error: 'Pick a resource before starting a terminal session.' });
    }

    const isDevLocalShell = resource === 'local';
    const selectedResource = resources.find((entry) => entry.name === resource);
    const configuredTerminalTarget = listTerminalTargets().find((entry) => entry.resource === resource);

    if (!selectedResource && !configuredTerminalTarget && !isDevLocalShell) {
      return res.status(404).json({ error: 'Selected resource was not found.' });
    }

    const terminalCheck = canStartTerminal(resource);
    if (!terminalCheck.ok) {
      return res.status(400).json({ error: terminalCheck.error });
    }

    if (isDevLocalShell) {
      const sessionId = `terminal-${randomBytes(16).toString('hex')}`;
      registerPendingSession(sessionId, user!.id, resource);

      await auditLog(user?.id, 'terminal_start', `Started terminal session for ${resource}`);
      return res.json({ sessionId, message: `Terminal ready for ${resource}.` });
    }

    // Check for an active reservation; skip the DB check gracefully in dev mode if the DB is unavailable
    let hasReservation = false;
    try {
      const now = new Date();
      const row = await prisma.reservation.findFirst({
        where: {
          resource: reservationResource,
          userId: user?.id,
          startTime: { lte: now },
          endTime: { gte: now }
        }
      });
      hasReservation = row !== null;
    } catch {
      // DB not reachable — allow in dev mode, block in production
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Database unavailable.' });
      }
      hasReservation = true; // dev bypass
    }

    if (!hasReservation && user?.role !== Role.ADMIN) {
      return res.status(403).json({ error: 'You need an active reservation for this resource.' });
    }

    const sessionId = `terminal-${randomBytes(16).toString('hex')}`;
    registerPendingSession(sessionId, user!.id, resource);

    await auditLog(user?.id, 'terminal_start', `Started terminal session for ${resource}`);
    res.json({ sessionId, message: `Terminal ready for ${resource}.` });
  });

  router.post('/terminal/end', ensureAuthenticated, async (req, res) => {
    const { sessionId } = req.body as { sessionId?: string };
    const user = getUser(req);

    if (sessionId) {
      destroySession(sessionId);
    }

    await auditLog(user?.id, 'terminal_end', 'Ended terminal session');
    res.json({ message: 'SSH session ended.' });
  });

  router.get('/me', async (req, res) => {
    const isAuth = req.isAuthenticated && req.isAuthenticated();
    const user = getUser(req);

    if ((!isAuth && !(devAuthEnabled && user)) || !user) {
      return res.status(401).json({ user: null });
    }

    const dbUser = await upsertSessionUser(user);
    return res.json({ user: dbUser ?? user });
  });

  router.get('/admin/users', ensureAuthenticated, ensureRole(Role.ADMIN), async (_req, res) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
        select: { id: true, email: true, role: true }
      });
      res.json({ users });
    } catch {
      res.json({ users: [] });
    }
  });

  return router;
};
