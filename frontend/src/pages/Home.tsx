import React from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Stack
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, authProviders } = useAuth();
  const authError = searchParams.get('authError');

  const authErrorMessage = authError === 'globus_not_configured'
    ? 'Globus login is not configured on the backend yet.'
    : authError === 'globus_login_failed'
      ? 'Globus login failed. Please try again or verify the callback URL and client credentials.'
      : '';

  return (
    <Box mt={4}>
      <Card
        sx={{
          mb: 3,
          borderRadius: 5,
          color: '#fff',
          background: 'linear-gradient(135deg, #0f2744 0%, #13456b 45%, #1d6a8f 100%)'
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Stack spacing={2.5}>
            <Typography variant="h3" fontWeight={800}>
              Sign In
            </Typography>
            <Typography variant="h6" sx={{ maxWidth: 840, color: 'rgba(255,255,255,0.84)' }}>
              Access the 5G Testbed Portal to manage reservations, deployments, and terminal
              sessions.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {user ? (
                <Button variant="contained" color="info" onClick={() => navigate('/dashboard')}>
                  Open Dashboard
                </Button>
              ) : (
                <>
                  {authProviders.globusEnabled && (
                    <Button variant="contained" color="info" href="/auth/login">
                      Sign in with Globus
                    </Button>
                  )}
                  {authProviders.devLoginEnabled && (
                    <Button variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} href="/auth/dev-login">
                      Continue as Demo User
                    </Button>
                  )}
                </>
              )}
              <Button variant="text" sx={{ color: '#fff' }} onClick={() => navigate('/docs')}>
                View Documentation
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {authErrorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {authErrorMessage}
        </Alert>
      )}

      {!user && !authProviders.globusEnabled && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Globus login is unavailable until the backend has `GLOBUS_CLIENT_ID`,
          `GLOBUS_CLIENT_SECRET`, and `GLOBUS_REDIRECT_URI` configured.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight={700}>
                Portal Access
              </Typography>
              <Typography variant="body2" gutterBottom>
                Sign in before opening operational modules. Unauthenticated users are limited to this
                page and the documentation section.
              </Typography>
              <Button fullWidth variant="contained" color="primary" onClick={() => navigate(user ? '/dashboard' : '/')}>
                {user ? 'Go to Dashboard' : 'Stay on Login'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight={700}>
                Documentation
              </Typography>
              <Typography variant="body2" gutterBottom>
                Review the onboarding steps, reservation rules, and deployment workflow before using
                the testbed.
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
