import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
  Button,
  Grid,
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box mt={4}>
      <Card
        sx={{
          mb: 4,
          borderRadius: 5,
          color: '#fff',
          background: 'linear-gradient(135deg, #0f2744 0%, #13456b 45%, #1d6a8f 100%)'
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Stack spacing={2.5}>
            <Chip
              label="Open-source 5G research operations"
              sx={{ width: 'fit-content', bgcolor: 'rgba(255,255,255,0.14)', color: '#fff' }}
            />
            <Typography variant="h3" fontWeight={800}>
              5G Testbed Portal
            </Typography>
            <Typography variant="h6" sx={{ maxWidth: 840, color: 'rgba(255,255,255,0.84)' }}>
              Manage reservations, deploy lab images, monitor PC and USRP health, and launch remote
              access workflows from one place.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" color="info" onClick={() => navigate('/dashboard')}>
                Open Dashboard
              </Button>
              <Button variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} onClick={() => navigate('/reservations')}>
                Plan Reservations
              </Button>
              {!user && (
                <Button variant="text" sx={{ color: '#fff' }} href="/auth/dev-login">
                  Continue as Demo User
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight={700}>
                Smarter Scheduling
              </Typography>
              <Typography variant="body2" gutterBottom>
                Choose a resource, review upcoming bookings, and create cleaner reservation windows
                with project context.
              </Typography>
              <Button fullWidth variant="contained" color="primary" onClick={() => navigate('/reservations')}>
                Open Reservations
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight={700}>
                Image Deployment
              </Typography>
              <Typography variant="body2" gutterBottom>
                Queue baseline images for supported PCs so the lab can switch between OAI setups
                faster.
              </Typography>
              <Button fullWidth variant="contained" color="secondary" onClick={() => navigate('/deployments')}>
                Open Deployments
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight={700}>
                Documentation
              </Typography>
              <Typography variant="body2" gutterBottom>
                Explain the workflow for students and researchers with clear onboarding and support
                information.
              </Typography>
              <Button fullWidth variant="outlined" onClick={() => navigate('/docs')}>
                Go to Docs
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
