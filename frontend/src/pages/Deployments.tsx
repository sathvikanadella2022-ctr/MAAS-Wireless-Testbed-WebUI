import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from '../components/AuthContext';

interface Resource {
  id: string;
  name: string;
  type: 'PC' | 'USRP';
  status: 'online' | 'offline' | 'busy';
  supportsImaging: boolean;
  notes: string;
}

interface ImageOption {
  id: string;
  name: string;
  version: string;
  os: string;
  stack: string;
  description: string;
}

interface Deployment {
  id: string;
  resource: string;
  imageId: string;
  imageName: string;
  requestedBy: string;
  scheduledAt: string;
  notes: string;
  status: 'queued' | 'deploying' | 'ready' | 'failed';
  createdAt: string;
}

const toLocalInputValue = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60 * 1000);
  return adjusted.toISOString().slice(0, 16);
};

const statusColorMap: Record<Deployment['status'], 'warning' | 'info' | 'success' | 'error'> = {
  queued: 'warning',
  deploying: 'info',
  ready: 'success',
  failed: 'error'
};

const Deployments: React.FC = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [images, setImages] = useState<ImageOption[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [resource, setResource] = useState('');
  const [imageId, setImageId] = useState('');
  const [scheduledAt, setScheduledAt] = useState(
    toLocalInputValue(new Date(Date.now() + 3 * 60 * 60 * 1000))
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDeploymentData = async () => {
    const [statusRes, imagesRes, deploymentsRes] = await Promise.all([
      fetch('/api/status', { credentials: 'include' }),
      fetch('/api/images', { credentials: 'include' }),
      fetch('/api/deployments', { credentials: 'include' })
    ]);

    const statusData = await statusRes.json();
    const imagesData = await imagesRes.json();
    const deploymentData = await deploymentsRes.json();

    if (!statusRes.ok || !imagesRes.ok || !deploymentsRes.ok) {
      throw new Error(imagesData.error || deploymentData.error || 'Unable to load deployment data.');
    }

    setResources(statusData.resources ?? []);
    setImages(imagesData.images ?? []);
    setDeployments(deploymentData.deployments ?? []);
  };

  useEffect(() => {
    loadDeploymentData().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load deployment data.');
    });
  }, []);

  const handleCreate = async () => {
    setError('');
    setSuccess('');

    const res = await fetch('/api/deployments', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource, imageId, scheduledAt, notes })
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Unable to queue deployment.');
      return;
    }

    setDeployments(data.deployments);
    setNotes('');
    setSuccess(`Deployment queued for ${resource}.`);
  };

  return (
    <Box mt={1} mb={6}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 3,
          borderRadius: 4,
          color: '#f8fafc',
          background: 'linear-gradient(135deg, #4a2930 0%, #8a4b22 48%, #bd7a22 100%)'
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h4" fontWeight={700}>
            Image Deployment
          </Typography>
          <Typography sx={{ maxWidth: 760, color: 'rgba(248,250,252,0.84)' }}>
            Queue clean lab images for supported PCs so researchers can switch between OAI builds
            without doing manual re-install work every time.
          </Typography>
        </Stack>
      </Paper>

      {!user && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Use the Demo Login button in the top bar before queueing image deployments.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Queue New Deployment
              </Typography>
              <TextField
                select
                label="Target PC"
                value={resource}
                onChange={(event) => setResource(event.target.value)}
                fullWidth
              >
                {resources
                  .filter((entry) => entry.supportsImaging)
                  .map((entry) => (
                    <MenuItem key={entry.id} value={entry.name}>
                      {entry.name} ({entry.status})
                    </MenuItem>
                  ))}
              </TextField>
              <TextField
                select
                label="Image"
                value={imageId}
                onChange={(event) => setImageId(event.target.value)}
                fullWidth
              >
                {images.map((entry) => (
                  <MenuItem key={entry.id} value={entry.id}>
                    {entry.name} v{entry.version}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Deployment Time"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                multiline
                minRows={3}
                fullWidth
                placeholder="Optional handoff notes for the lab team"
              />
              <Button variant="contained" size="large" onClick={handleCreate}>
                Queue Deployment
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Stack spacing={2.5}>
            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Available Images
              </Typography>
              <Grid container spacing={2}>
                {images.map((image) => (
                  <Grid item xs={12} md={6} key={image.id}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: '100%' }}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {image.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          v{image.version} • {image.os}
                        </Typography>
                        <Chip label={image.stack} sx={{ width: 'fit-content' }} />
                        <Typography variant="body2">
                          {image.description}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Deployment Queue
              </Typography>
              <Stack spacing={1.5}>
                {deployments.map((deployment) => (
                  <Paper key={deployment.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {deployment.resource} → {deployment.imageName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Scheduled for {new Date(deployment.scheduledAt).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Requested by {deployment.requestedBy}
                        </Typography>
                        {deployment.notes && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {deployment.notes}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={deployment.status}
                        color={statusColorMap[deployment.status]}
                        sx={{ textTransform: 'capitalize', alignSelf: 'flex-start' }}
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Deployments;
