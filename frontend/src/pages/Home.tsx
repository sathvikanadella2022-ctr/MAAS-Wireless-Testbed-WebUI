import React from 'react';
import { Box, Card, CardContent, Typography, Button, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box mt={8}>
      <Typography variant="h3" align="center" gutterBottom>
        5G Testbed Portal
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} sm={6} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Documentation
              </Typography>
              <Typography variant="body2" gutterBottom>
                Guides, architecture, FAQ, troubleshooting.
              </Typography>
              <Button fullWidth variant="contained" color="primary" onClick={() => navigate('/docs')}>
                Go to Docs
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Login
              </Typography>
              <Typography variant="body2" gutterBottom>
                Access dashboard, reservations, and terminal.
              </Typography>
              <Button fullWidth variant="contained" color="secondary" href="/auth/login">
                Login with Globus
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
