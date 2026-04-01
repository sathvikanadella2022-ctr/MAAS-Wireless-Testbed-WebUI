import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from '../components/AuthContext';

interface Reservation {
  id: string;
  resource: string;
  startTime: string;
  endTime: string;
  userId: string;
}

const Terminal: React.FC = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [resource, setResource] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    fetch('/api/reservations', { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Unable to load reservations.');
        }

        setReservations(data.reservations ?? []);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load reservations.');
      });
  }, []);

  const activeReservations = useMemo(() => {
    const now = Date.now();

    return reservations.filter((reservation) => {
      const start = new Date(reservation.startTime).getTime();
      const end = new Date(reservation.endTime).getTime();
      const isActive = start <= now && end >= now;
      const isOwnedByUser = reservation.userId === user?.id || user?.role === 'ADMIN';
      return isActive && isOwnedByUser;
    });
  }, [reservations, user]);

  const handleStart = async () => {
    setError('');
    setMessage('');

    const response = await fetch('/api/terminal/start', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource })
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Unable to start terminal.');
      return;
    }

    setSessionId(data.sessionId);
    setMessage(data.message);
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
          background: 'linear-gradient(135deg, #0d3b2e 0%, #116466 50%, #1f8a70 100%)'
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h4" fontWeight={700}>
            Remote Terminal
          </Typography>
          <Typography sx={{ maxWidth: 760, color: 'rgba(248,250,252,0.84)' }}>
            This is still a scaffold, but it now respects active reservations so the SSH flow matches
            the portal rules.
          </Typography>
        </Stack>
      </Paper>

      {!user && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Use the Demo Login button in the top bar before starting a terminal session.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}

      <Paper sx={{ p: 3, borderRadius: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>
            Launch Session
          </Typography>
          <TextField
            select
            label="Reserved Resource"
            value={resource}
            onChange={(event) => setResource(event.target.value)}
            fullWidth
            helperText="Only active reservations are eligible for terminal access."
          >
            {activeReservations.map((reservation) => (
              <MenuItem key={reservation.id} value={reservation.resource}>
                {reservation.resource}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={handleStart} disabled={!resource}>
            Start SSH Session
          </Button>
          <Typography variant="body2" color="text.secondary">
            Terminal rendering is still mocked, but the backend now returns a session token and checks
            for an active reservation first.
          </Typography>
          {sessionId && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#081421', color: '#d4e4f7' }}>
              <Typography variant="body2">Session: {sessionId}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                SSH terminal canvas can plug in here next.
              </Typography>
            </Paper>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default Terminal;
