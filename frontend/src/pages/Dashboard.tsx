import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import io from 'socket.io-client';

interface ResourceStatus {
  id: string;
  type: 'PC' | 'USRP';
  name: string;
  status: 'online' | 'offline' | 'busy';
}

const Dashboard: React.FC = () => {
  const [resources, setResources] = useState<ResourceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        setResources(data.resources);
        setLoading(false);
      });
    const socket = io({ path: '/socket.io' });
    socket.on('statusUpdate', (data: ResourceStatus[]) => {
      setResources(data);
    });
    return () => { socket.disconnect(); };
  }, []);

  return (
    <Box mt={4}>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      {loading ? <CircularProgress /> : (
        <Grid container spacing={2}>
          {resources.map(r => (
            <Grid item xs={12} sm={6} md={4} key={r.id}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6">{r.name} ({r.type})</Typography>
                <Typography color={r.status === 'online' ? 'green' : r.status === 'busy' ? 'orange' : 'red'}>
                  {r.status}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;
