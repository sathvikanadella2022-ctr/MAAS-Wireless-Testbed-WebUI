import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

const Terminal: React.FC = () => {
  // Placeholder for web SSH terminal
  return (
    <Box mt={4}>
      <Typography variant="h4" gutterBottom>Web SSH Terminal</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography>Terminal session placeholder.</Typography>
        <Button variant="contained" color="primary" sx={{ mt: 2 }} disabled>
          Start SSH Session (Coming Soon)
        </Button>
      </Paper>
    </Box>
  );
};

export default Terminal;
