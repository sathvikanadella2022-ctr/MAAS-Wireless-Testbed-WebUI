import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ComputerRoundedIcon from '@mui/icons-material/ComputerRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import io from 'socket.io-client';

interface ResourceStatus {
  id: string;
  type: 'PC' | 'USRP';
  name: string;
  status: 'online' | 'offline' | 'busy';
}

interface Reservation {
  id: string;
  resource: string;
  startTime: string;
  endTime: string;
}

interface MachineViewModel extends ResourceStatus {
  reservations: Reservation[];
  currentReservation: Reservation | null;
  nextReservation: Reservation | null;
  nextAvailableAt: string;
}

const statusLabelMap: Record<ResourceStatus['status'], string> = {
  online: 'Available now',
  busy: 'In use',
  offline: 'Offline'
};

const statusColorMap: Record<ResourceStatus['status'], 'success' | 'warning' | 'default'> = {
  online: 'success',
  busy: 'warning',
  offline: 'default'
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

const formatWindow = (startTime: string, endTime: string) =>
  `${formatDateTime(startTime)} - ${new Date(endTime).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })}`;

const Dashboard: React.FC = () => {
  const [resources, setResources] = useState<ResourceStatus[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const [statusRes, reservationRes] = await Promise.all([
          fetch('/api/status', { credentials: 'include' }),
          fetch('/api/reservations', { credentials: 'include' })
        ]);

        if (!statusRes.ok) {
          throw new Error('Unable to load resource status.');
        }

        if (!reservationRes.ok) {
          throw new Error('Unable to load reservation schedule.');
        }

        const statusData = await statusRes.json();
        const reservationData = await reservationRes.json();

        if (!isMounted) {
          return;
        }

        setResources(statusData.resources ?? []);
        setReservations(reservationData.reservations ?? []);
        setError('');
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    const socket = io({ path: '/socket.io' });
    socket.on('statusUpdate', (data: ResourceStatus[]) => {
      setResources(data);
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

  const machines = useMemo<MachineViewModel[]>(() => {
    const now = Date.now();

    return resources
      .map((resource) => {
        const machineReservations = reservations
          .filter((reservation) => reservation.resource === resource.name)
          .sort(
            (left, right) =>
              new Date(left.startTime).getTime() - new Date(right.startTime).getTime()
          );

        const currentReservation =
          machineReservations.find((reservation) => {
            const start = new Date(reservation.startTime).getTime();
            const end = new Date(reservation.endTime).getTime();
            return start <= now && end >= now;
          }) ?? null;

        const nextReservation =
          machineReservations.find((reservation) => new Date(reservation.startTime).getTime() > now) ??
          null;

        const nextAvailableAt =
          resource.status === 'offline'
            ? 'Unavailable until the machine comes back online'
            : currentReservation
              ? `Free at ${formatDateTime(currentReservation.endTime)}`
              : 'Available immediately';

        return {
          ...resource,
          reservations: machineReservations,
          currentReservation,
          nextReservation,
          nextAvailableAt
        };
      })
      .sort((left, right) => {
        const statusRank = { online: 0, busy: 1, offline: 2 };
        return statusRank[left.status] - statusRank[right.status];
      });
  }, [reservations, resources]);

  const summary = useMemo(() => {
    const availableNow = machines.filter((machine) => machine.status === 'online').length;
    const busyNow = machines.filter((machine) => machine.status === 'busy').length;
    const offline = machines.filter((machine) => machine.status === 'offline').length;
    const upcomingReservations = reservations.filter(
      (reservation) => new Date(reservation.startTime).getTime() > Date.now()
    ).length;

    return { availableNow, busyNow, offline, upcomingReservations };
  }, [machines, reservations]);

  if (loading) {
    return (
      <Box mt={6} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box mt={4} mb={6}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 3,
          borderRadius: 4,
          color: '#f8fafc',
          background:
            'linear-gradient(135deg, rgba(8,47,73,1) 0%, rgba(15,76,117,1) 48%, rgba(34,116,165,1) 100%)'
        }}
      >
        <Stack spacing={2}>
          <Chip
            label="5G resource operations"
            sx={{
              width: 'fit-content',
              color: '#dbeafe',
              bgcolor: 'rgba(255,255,255,0.12)',
              borderRadius: 2
            }}
          />
          <Typography variant="h4" fontWeight={700}>
            Dashboard
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: 720, color: 'rgba(248,250,252,0.82)' }}>
            See which machines are free right now, what time slots are already booked, and which
            resources are opening up next.
          </Typography>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Stack spacing={1}>
              <CheckCircleRoundedIcon color="success" />
              <Typography variant="overline">Available now</Typography>
              <Typography variant="h4" fontWeight={700}>
                {summary.availableNow}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Stack spacing={1}>
              <PendingActionsRoundedIcon color="warning" />
              <Typography variant="overline">Currently busy</Typography>
              <Typography variant="h4" fontWeight={700}>
                {summary.busyNow}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Stack spacing={1}>
              <EventAvailableRoundedIcon color="primary" />
              <Typography variant="overline">Upcoming bookings</Typography>
              <Typography variant="h4" fontWeight={700}>
                {summary.upcomingReservations}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Stack spacing={1}>
              <AccessTimeRoundedIcon color="disabled" />
              <Typography variant="overline">Offline resources</Typography>
              <Typography variant="h4" fontWeight={700}>
                {summary.offline}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {machines.map((machine) => (
          <Grid item xs={12} md={6} key={machine.id}>
            <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
              <Stack spacing={2.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    {machine.type === 'PC' ? <ComputerRoundedIcon /> : <MemoryRoundedIcon />}
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {machine.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {machine.type} resource
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    label={statusLabelMap[machine.status]}
                    color={statusColorMap[machine.status]}
                    variant={machine.status === 'offline' ? 'outlined' : 'filled'}
                  />
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: '100%' }}>
                      <Typography variant="overline" color="text.secondary">
                        Next available
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {machine.nextAvailableAt}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: '100%' }}>
                      <Typography variant="overline" color="text.secondary">
                        Next booked slot
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {machine.nextReservation
                          ? formatWindow(machine.nextReservation.startTime, machine.nextReservation.endTime)
                          : 'No upcoming reservations'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Time slots
                  </Typography>
                  {machine.currentReservation && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      In use until {formatDateTime(machine.currentReservation.endTime)}
                    </Alert>
                  )}
                  {machine.reservations.length > 0 ? (
                    <Stack spacing={1.25}>
                      {machine.reservations.slice(0, 4).map((reservation) => {
                        const isCurrent =
                          machine.currentReservation !== null &&
                          machine.currentReservation.id === reservation.id;

                        return (
                          <Paper
                            key={reservation.id}
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              borderRadius: 3,
                              borderColor: isCurrent ? 'warning.main' : 'divider',
                              bgcolor: isCurrent ? 'rgba(237, 108, 2, 0.08)' : 'transparent'
                            }}
                          >
                            <Typography variant="body2" fontWeight={600}>
                              {formatWindow(reservation.startTime, reservation.endTime)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {isCurrent ? 'Current reservation' : 'Scheduled reservation'}
                            </Typography>
                          </Paper>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No reservations scheduled for this machine.
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
