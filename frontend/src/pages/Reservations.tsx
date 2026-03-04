import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Grid, Alert } from '@mui/material';

interface Reservation {
  id: string;
  resource: string;
  startTime: string;
  endTime: string;
}

const Reservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [resource, setResource] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/reservations')
      .then(res => res.json())
      .then(data => setReservations(data.reservations));
  }, []);

  const handleCreate = async () => {
    setError('');
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource, startTime, endTime })
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Error creating reservation');
    else setReservations(data.reservations);
  };

  return (
    <Box mt={4}>
      <Typography variant="h4" gutterBottom>Reservations</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField label="Resource" value={resource} onChange={e => setResource(e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField label="Start Time" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField label="End Time" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button variant="contained" color="primary" fullWidth onClick={handleCreate}>Reserve</Button>
          </Grid>
        </Grid>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      <Typography variant="h6">Existing Reservations</Typography>
      {reservations.map(r => (
        <Paper key={r.id} sx={{ p: 2, mb: 1 }}>
          <Typography>{r.resource}: {new Date(r.startTime).toLocaleString()} - {new Date(r.endTime).toLocaleString()}</Typography>
        </Paper>
      ))}
    </Box>
  );
};

export default Reservations;
