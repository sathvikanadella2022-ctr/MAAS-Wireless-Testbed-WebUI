import React from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';

const sections = [
  { label: 'Guides', content: 'How to use the 5G testbed portal.' },
  { label: 'Architecture', content: 'System architecture overview.' },
  { label: 'FAQ', content: 'Frequently asked questions.' },
  { label: 'Troubleshooting', content: 'Common issues and solutions.' }
];

const Docs: React.FC = () => {
  const [tab, setTab] = React.useState(0);
  return (
    <Box mt={4}>
      <Typography variant="h4" gutterBottom>Documentation</Typography>
      <Paper sx={{ p: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          {sections.map((s, i) => <Tab key={i} label={s.label} />)}
        </Tabs>
        <Box mt={2}>
          <Typography>{sections[tab].content}</Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Docs;
