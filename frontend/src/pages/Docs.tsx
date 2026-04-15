import React from 'react';
import { Box, Chip, Grid, Paper, Stack, Typography } from '@mui/material';

const setupSteps = [
  'Position and label each bare-metal node in the lab so the physical layout matches the recorded inventory.',
  'Connect each USRP B210 to the intended host and verify the required RF-chain setup.',
  'Verify management networking, experiment networking, and provisioning connectivity.',
  'Confirm the selected synchronization method, such as PTP, is active across the participating nodes.',
  'Prepare the required node images for gNB, core, sandbox, or custom experiment roles.',
  'Validate that the physical resources appear correctly in the portal before opening them for scheduling.'
];

const schedulingSteps = [
  'Check the dashboard first to confirm the target PC is visible and not offline.',
  'Create a reservation with project name, purpose, start time, and end time.',
  'Queue an image deployment before the reservation if the machine needs a clean build.',
  'Start terminal access only during the active reservation window.',
  'End the session and release the machine after the experiment finishes.'
];

const reservationRules = [
  'Reservations must start in the future.',
  'End time must be after start time.',
  'The same machine cannot have overlapping reservations.',
  'Users can cancel their own reservations, and admins can cancel any reservation.'
];

const deploymentRules = [
  'Only supported PCs can accept image deployments.',
  'A valid image and deployment time are required.',
  'Deployments should be scheduled before the experiment window.',
  'Deployments cannot overlap with an existing reservation on that PC.'
];

const Docs: React.FC = () => {
  return (
    <Box mt={1} mb={6}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Documentation
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                5G MaaS Portal Overview
              </Typography>
              <Typography color="text.secondary">
                This portal is the control plane for the 5G Metal-as-a-Service testbed. The setup
                process begins with physical lab preparation, including node placement, radio pairing,
                synchronization, and image readiness before users schedule experiments.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label="Dashboard" />
                <Chip label="Reservations" />
                <Chip label="Image Deployment" />
                <Chip label="Terminal Access" />
                <Chip label="Role-Based Access" />
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Setup Procedure
            </Typography>
            <Stack spacing={1.5}>
              {setupSteps.map((step, index) => (
                <Typography key={step}>
                  {index + 1}. {step}
                </Typography>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Access Flow
            </Typography>
            <Typography paragraph>
              Use Globus login in production so researchers can access the portal after the testbed has
              been physically prepared and validated. In internal lab conditions, controlled local login
              can be used for staging or validation before production use.
            </Typography>
            <Typography paragraph>
              After login, the recommended order is dashboard first, then reservations, then image
              deployment if needed, and terminal access during the active reservation.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Reservation Scheduling
            </Typography>
            <Stack spacing={1.5} mb={2}>
              {schedulingSteps.map((step, index) => (
                <Typography key={step}>
                  {index + 1}. {step}
                </Typography>
              ))}
            </Stack>
            <Typography variant="subtitle1" gutterBottom fontWeight={700}>
              Reservation Rules
            </Typography>
            <Stack spacing={1}>
              {reservationRules.map((rule) => (
                <Typography key={rule}>{rule}</Typography>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Deployment and Terminal Access
            </Typography>
            <Typography paragraph>
              Queue deployments before the experiment window so the selected PC can boot into the
              correct image after hardware, networking, and synchronization checks are complete.
            </Typography>
            <Typography variant="subtitle1" gutterBottom fontWeight={700}>
              Deployment Rules
            </Typography>
            <Stack spacing={1} mb={2}>
              {deploymentRules.map((rule) => (
                <Typography key={rule}>{rule}</Typography>
              ))}
            </Stack>
            <Typography variant="subtitle1" gutterBottom fontWeight={700}>
              Terminal Access
            </Typography>
            <Typography>
              Researchers need an active reservation before starting a terminal session on a resource.
              Admins can override this when needed for maintenance or support.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Full Guide
            </Typography>
            <Typography color="text.secondary">
              The complete step-by-step guide is available in `docs/ARA_SETUP_GUIDE.md` for testbed
              onboarding, formal project documentation, and lab handoff.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Docs;
