import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';

const Docs: React.FC = () => {
  return (
    <Box mt={1} mb={6}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Documentation
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Getting Started
            </Typography>
            <Typography paragraph>
              Use Globus login in production or the demo login locally. Once signed in, start with the
              dashboard to see lab health, then reserve a PC before requesting deployment or terminal
              access.
            </Typography>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Recommended Workflow
            </Typography>
            <Typography paragraph>
              1. Check machine availability on the dashboard.
            </Typography>
            <Typography paragraph>
              2. Reserve a time slot with project and experiment notes.
            </Typography>
            <Typography paragraph>
              3. Queue an image deployment if the target PC needs a fresh build.
            </Typography>
            <Typography paragraph>
              4. Launch the terminal during the active reservation window.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 4, mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Current Portal Modules
            </Typography>
            <Typography paragraph>
              Dashboard for live resource visibility
            </Typography>
            <Typography paragraph>
              Reservation planner with conflict detection and cancellation
            </Typography>
            <Typography paragraph>
              Image deployment queue for supported PCs
            </Typography>
            <Typography paragraph>
              Terminal access gate tied to active reservations
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Docs;
