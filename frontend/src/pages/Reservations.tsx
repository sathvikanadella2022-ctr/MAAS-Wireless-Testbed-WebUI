import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from '../components/AuthContext';

interface Resource {
  id: string;
  type: 'PC' | 'USRP';
  name: string;
  status: 'online' | 'offline' | 'busy';
  location: string;
  notes: string;
}

interface Reservation {
  id: string;
  resource: string;
  startTime: string;
  endTime: string;
  purpose: string;
  project: string;
  userEmail: string;
  userId: string;
}

const toLocalInputValue = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60 * 1000);
  return adjusted.toISOString().slice(0, 16);
};

const Reservations: React.FC = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [resource, setResource] = useState('');
  const [project, setProject] = useState('');
  const [purpose, setPurpose] = useState('');
  const [startTime, setStartTime] = useState(toLocalInputValue(new Date(Date.now() + 2 * 60 * 60 * 1000)));
  const [endTime, setEndTime] = useState(toLocalInputValue(new Date(Date.now() + 4 * 60 * 60 * 1000)));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadReservations = async () => {
    const statusRes = await fetch('/api/status', { credentials: 'include' });
    const statusData = await statusRes.json();

    if (!statusRes.ok) {
      throw new Error('Unable to load lab resources.');
    }

    setResources(statusData.resources ?? []);

    const reservationRes = await fetch('/api/reservations', { credentials: 'include' });

    if (reservationRes.status === 401) {
      setReservations([]);
      return;
    }

    const reservationData = await reservationRes.json();

    if (!reservationRes.ok) {
      throw new Error(reservationData.error || 'Unable to load reservations.');
    }

    setReservations(reservationData.reservations ?? []);
  };

  useEffect(() => {
    loadReservations().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load reservations.');
    });
  }, [user]);

  useEffect(() => {
    if (!resource) {
      const firstPc = resources.find((entry) => entry.type === 'PC');
      if (firstPc) {
        setResource(firstPc.name);
      }
    }
  }, [resource, resources]);

  const groupedReservations = useMemo(() => {
    const map = new Map<string, Reservation[]>();

    resources.forEach((entry) => map.set(entry.name, []));
    reservations.forEach((entry) => {
      const current = map.get(entry.resource) ?? [];
      current.push(entry);
      map.set(entry.resource, current);
    });

    return map;
  }, [reservations, resources]);

  const handleCreate = async () => {
    setError('');
    setSuccess('');

    if (!resource) {
      setError('Choose a PC before reserving a slot.');
      return;
    }

    if (!project.trim() || !purpose.trim()) {
      setError('Add both a project name and a short purpose for the reservation.');
      return;
    }

    const res = await fetch('/api/reservations', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resource,
        startTime,
        endTime,
        purpose: purpose.trim(),
        project: project.trim()
      })
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Error creating reservation');
      return;
    }

    setReservations(data.reservations);
    setProject('');
    setPurpose('');
    setSuccess(`Reservation created for ${resource}.`);
  };

  const handleCancel = async (id: string) => {
    setError('');
    setSuccess('');

    const res = await fetch(`/api/reservations/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Error canceling reservation');
      return;
    }

    setReservations(data.reservations);
    setSuccess('Reservation canceled.');
  };

  return (
    <Box mt={1} mb={6}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 3,
          borderRadius: 4,
          color: '#f8fafc',
          background: 'linear-gradient(135deg, #3d2f6d 0%, #145374 55%, #1c7c8c 100%)'
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h4" fontWeight={700}>
            Reservations
          </Typography>
          <Typography sx={{ maxWidth: 760, color: 'rgba(248,250,252,0.84)' }}>
            Pick a machine, schedule a clean time window, and include enough project context so the
            lab team knows what the slot is for.
          </Typography>
        </Stack>
      </Paper>

      {!user && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Use the Demo Login button in the top bar before creating reservations.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Create Reservation
              </Typography>
              <TextField
                select
                label="Resource"
                value={resource}
                onChange={(event) => setResource(event.target.value)}
                fullWidth
                helperText="Pick one of the four lab PCs."
              >
                {resources
                  .filter((entry) => entry.type === 'PC')
                  .map((entry) => (
                    <MenuItem key={entry.id} value={entry.name}>
                      {entry.name} ({entry.status})
                    </MenuItem>
                  ))}
              </TextField>
              <TextField
                label="Project"
                value={project}
                onChange={(event) => setProject(event.target.value)}
                fullWidth
                placeholder="Example: OAI core validation"
              />
              <TextField
                label="Purpose"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                fullWidth
                multiline
                minRows={3}
                placeholder="What experiment or setup work will happen during this slot?"
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start Time"
                    type="datetime-local"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End Time"
                    type="datetime-local"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              <Button variant="contained" size="large" onClick={handleCreate}>
                Reserve Slot
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Stack spacing={2.5}>
            {resources
              .filter((entry) => entry.type === 'PC')
              .map((entry) => (
                <Paper key={entry.id} sx={{ p: 3, borderRadius: 4 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          {entry.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {entry.location} • {entry.notes}
                        </Typography>
                      </Box>
                      <Chip
                        label={entry.status === 'online' ? 'Available' : entry.status === 'busy' ? 'Busy' : 'Offline'}
                        color={entry.status === 'online' ? 'success' : entry.status === 'busy' ? 'warning' : 'default'}
                      />
                    </Stack>

                    {(groupedReservations.get(entry.name) ?? []).length > 0 ? (
                      <Stack spacing={1.5}>
                        {(groupedReservations.get(entry.name) ?? []).map((reservation) => {
                          const isOwner = reservation.userId === user?.id;

                          return (
                            <Paper key={reservation.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                              <Stack spacing={1}>
                                <Typography variant="body1" fontWeight={600}>
                                  {new Date(reservation.startTime).toLocaleString()} -{' '}
                                  {new Date(reservation.endTime).toLocaleString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {reservation.project}
                                </Typography>
                                <Typography variant="body2">
                                  {reservation.purpose}
                                </Typography>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Typography variant="caption" color="text.secondary">
                                    Reserved by {reservation.userEmail}
                                  </Typography>
                                  {(isOwner || user?.role === 'ADMIN') && (
                                    <Button size="small" color="error" onClick={() => handleCancel(reservation.id)}>
                                      Cancel
                                    </Button>
                                  )}
                                </Stack>
                              </Stack>
                            </Paper>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No reservations scheduled for this machine.
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              ))}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reservations;
