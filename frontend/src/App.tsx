import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Terminal from './pages/Terminal';
import Docs from './pages/Docs';
import Deployments from './pages/Deployments';
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  CssBaseline,
  Stack,
  Toolbar,
  Typography
} from '@mui/material';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Link as RouterLink } from 'react-router-dom';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box mt={6} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppShell: React.FC = () => {
  const { user, authProviders, loading } = useAuth();
  const location = useLocation();
  const docsMode = location.pathname === '/docs';

  return (
    <>
      <CssBaseline />
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#0f2744', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            5G Testbed Portal
          </Typography>
          <Button color="inherit" component={RouterLink} to="/">
            Login
          </Button>
          <Button color="inherit" component={RouterLink} to="/docs">
            Docs
          </Button>
          {user && (
            <>
              <Button color="inherit" component={RouterLink} to="/dashboard">
                Dashboard
              </Button>
              <Button color="inherit" component={RouterLink} to="/reservations">
                Reservations
              </Button>
              <Button color="inherit" component={RouterLink} to="/deployments">
                Image Deployment
              </Button>
              <Button color="inherit" component={RouterLink} to="/terminal">
                Terminal
              </Button>
            </>
          )}
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : user ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.82)' }}>
                {user.email}
              </Typography>
              <Button color="inherit" href="/auth/logout">
                Logout
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1}>
              {authProviders.globusEnabled && (
                <Button color="inherit" href="/auth/login">
                  Globus Login
                </Button>
              )}
              {authProviders.devLoginEnabled && (
                <Button color="inherit" href="/auth/dev-login">
                  Demo Login
                </Button>
              )}
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Container
        maxWidth={docsMode ? false : 'lg'}
        sx={{
          py: 4,
          px: docsMode ? { xs: 2, md: 4, lg: 6 } : undefined
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/reservations" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
          <Route path="/deployments" element={<ProtectedRoute><Deployments /></ProtectedRoute>} />
          <Route path="/terminal" element={<ProtectedRoute><Terminal /></ProtectedRoute>} />
          <Route path="/docs" element={<Docs />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Container>
    </>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #eef4fb 0%, #f7f9fc 32%, #ffffff 100%)' }}>
      <AppShell />
    </Box>
  </AuthProvider>
);

export default App;
