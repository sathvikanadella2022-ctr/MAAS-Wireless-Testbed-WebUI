import { Router } from 'express';
import { ensureAuthenticated, ensureRole } from '../modules/auth';
import { auditLog } from '../modules/audit';
import { Server as SocketIOServer } from 'socket.io';

type UserRole = 'RESEARCHER' | 'ADMIN';
type ResourceStatus = 'online' | 'offline' | 'busy';
type DeploymentStatus = 'queued' | 'deploying' | 'ready' | 'failed';

interface PortalUser {
  id: string;
  email: string;
  role: UserRole;
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

interface ImageRecord {
  id: string;
  name: string;
  version: string;
  os: string;
  stack: string;
  description: string;
}

interface DeploymentRecord {
  id: string;
  resource: string;
  imageId: string;
  imageName: string;
  requestedBy: string;
  scheduledAt: string;
  notes: string;
  status: DeploymentStatus;
  createdAt: string;
}

const createIso = (hoursFromNow: number) => new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();

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

let reservations: ReservationRecord[] = [
  {
    id: 'res-1',
    userId: 'stub-user',
    userEmail: 'user@globus.org',
    resource: 'PC-3',
    startTime: createIso(-1),
    endTime: createIso(3),
    purpose: 'Run UE attach and throughput validation',
    project: 'OpenAirInterface bring-up'
  },
  {
    id: 'res-2',
    userId: 'stub-user',
    userEmail: 'user@globus.org',
    resource: 'PC-1',
    startTime: createIso(6),
    endTime: createIso(10),
    purpose: 'Prepare gNB benchmark image',
    project: 'Image readiness'
  },
  {
    id: 'res-3',
    userId: 'admin-user',
    userEmail: 'admin@globus.org',
    resource: 'PC-4',
    startTime: createIso(12),
    endTime: createIso(16),
    purpose: 'Core network failover test',
    project: 'OAI core validation'
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

let deployments: DeploymentRecord[] = [
  {
    id: 'dep-1',
    resource: 'PC-1',
    imageId: 'img-oai-gnb',
    imageName: 'OAI gNB Base',
    requestedBy: 'admin@globus.org',
    scheduledAt: createIso(2),
    notes: 'Refresh before Thursday demo',
    status: 'queued',
    createdAt: createIso(-2)
  },
  {
    id: 'dep-2',
    resource: 'PC-2',
    imageId: 'img-oai-core',
    imageName: 'OAI Core Lab',
    requestedBy: 'user@globus.org',
    scheduledAt: createIso(-3),
    notes: 'Metrics stack enabled',
    status: 'ready',
    createdAt: createIso(-5)
  }
];

const getUser = (req: any) => req.user as PortalUser | undefined;

const sortReservations = (records: ReservationRecord[]) =>
  [...records].sort(
    (left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime()
  );

const sortDeployments = (records: DeploymentRecord[]) =>
  [...records].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

const updateResourceStatus = (io: SocketIOServer) => {
  const now = Date.now();

  resources.forEach((resource) => {
    if (resource.type === 'USRP' && resource.status === 'offline') {
      return;
    }

    const hasActiveReservation = reservations.some((reservation) => {
      if (reservation.resource !== resource.name) {
        return false;
      }

      const start = new Date(reservation.startTime).getTime();
      const end = new Date(reservation.endTime).getTime();
      return start <= now && end >= now;
    });

    resource.status = hasActiveReservation ? 'busy' : resource.status === 'offline' ? 'offline' : 'online';
  });

  io.emit('statusUpdate', resources.map(({ id, type, name, status }) => ({ id, type, name, status })));
};

export default (io: SocketIOServer) => {
  const router = Router();
  const devAuthEnabled = process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH !== 'false';

  updateResourceStatus(io);

  router.get('/status', (_req, res) => {
    updateResourceStatus(io);
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
    res.json({ reservations: sortReservations(reservations) });
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

    const conflictingReservation = reservations.find((entry) => {
      if (entry.resource !== resource) {
        return false;
      }

      const existingStart = new Date(entry.startTime).getTime();
      const existingEnd = new Date(entry.endTime).getTime();
      return start.getTime() < existingEnd && end.getTime() > existingStart;
    });

    if (conflictingReservation) {
      return res.status(409).json({
        error: `Somebody already booked ${resource} from ${new Date(conflictingReservation.startTime).toLocaleString()} to ${new Date(conflictingReservation.endTime).toLocaleString()}. Please choose a different time.`
      });
    }

    const reservation: ReservationRecord = {
      id: `res-${Date.now()}`,
      userId: user?.id ?? 'unknown-user',
      userEmail: user?.email ?? 'unknown@globus.org',
      resource,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      purpose,
      project
    };

    reservations = sortReservations([...reservations, reservation]);
    updateResourceStatus(io);
    await auditLog(user?.id, 'reservation_create', `Resource: ${resource}; Project: ${project}`);
    res.status(201).json({ reservations });
  });

  router.delete('/reservations/:id', ensureAuthenticated, async (req, res) => {
    const user = getUser(req);
    const reservation = reservations.find((entry) => entry.id === req.params.id);

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    const isOwner = reservation.userId === user?.id;
    const isAdmin = user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You can only cancel your own reservations.' });
    }

    reservations = reservations.filter((entry) => entry.id !== reservation.id);
    updateResourceStatus(io);
    await auditLog(user?.id, 'reservation_cancel', `Resource: ${reservation.resource}`);
    res.json({ reservations: sortReservations(reservations) });
  });

  router.get('/images', ensureAuthenticated, async (_req, res) => {
    res.json({ images });
  });

  router.get('/deployments', ensureAuthenticated, async (_req, res) => {
    res.json({ deployments: sortDeployments(deployments) });
  });

  router.post('/deployments', ensureAuthenticated, async (req, res) => {
    const { resource, imageId, scheduledAt, notes } = req.body as {
      resource?: string;
      imageId?: string;
      scheduledAt?: string;
      notes?: string;
    };

    const user = getUser(req);

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

    const overlappingReservation = reservations.find((entry) => {
      if (entry.resource !== resource) {
        return false;
      }

      const start = new Date(entry.startTime).getTime();
      const end = new Date(entry.endTime).getTime();
      const deploymentStart = deploymentTime.getTime();
      const deploymentEnd = deploymentStart + 90 * 60 * 1000;
      return deploymentStart < end && deploymentEnd > start;
    });

    if (overlappingReservation) {
      return res.status(409).json({
        error: `Deployment overlaps with a reservation on ${resource}. Choose another time.`
      });
    }

    const deployment: DeploymentRecord = {
      id: `dep-${Date.now()}`,
      resource,
      imageId,
      imageName: selectedImage.name,
      requestedBy: user?.email ?? 'unknown@globus.org',
      scheduledAt: deploymentTime.toISOString(),
      notes: notes?.trim() ?? '',
      status: deploymentTime.getTime() <= Date.now() ? 'deploying' : 'queued',
      createdAt: new Date().toISOString()
    };

    deployments = sortDeployments([deployment, ...deployments]);
    await auditLog(user?.id, 'deployment_create', `Resource: ${resource}; Image: ${selectedImage.name}`);
    res.status(201).json({ deployments });
  });

  router.post('/terminal/start', ensureAuthenticated, async (req, res) => {
    const { resource } = req.body as { resource?: string };
    const user = getUser(req);

    if (!resource) {
      return res.status(400).json({ error: 'Pick a resource before starting a terminal session.' });
    }

    const hasReservation = reservations.some((reservation) => {
      const now = Date.now();
      return (
        reservation.resource === resource &&
        reservation.userId === user?.id &&
        new Date(reservation.startTime).getTime() <= now &&
        new Date(reservation.endTime).getTime() >= now
      );
    });

    if (!hasReservation && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You need an active reservation for this resource.' });
    }

    await auditLog(user?.id, 'terminal_start', `Started terminal session for ${resource}`);
    res.json({ sessionId: `terminal-${Date.now()}`, message: `Terminal ready for ${resource}.` });
  });

  router.post('/terminal/end', ensureAuthenticated, async (req, res) => {
    const user = getUser(req);
    await auditLog(user?.id, 'terminal_end', 'Ended terminal session');
    res.json({ message: 'SSH session ended.' });
  });

  router.get('/me', (req, res) => {
    const isAuth = req.isAuthenticated && req.isAuthenticated();
    const user = getUser(req);

    if ((!isAuth && !(devAuthEnabled && user)) || !user) {
      return res.status(401).json({ user: null });
    }

    return res.json({ user });
  });

  router.get('/admin/users', ensureAuthenticated, ensureRole('ADMIN'), async (_req, res) => {
    res.json({
      users: [
        { id: 'admin-user', email: 'admin@globus.org', role: 'ADMIN' },
        { id: 'stub-user', email: 'user@globus.org', role: 'RESEARCHER' }
      ]
    });
  });

  return router;
};
