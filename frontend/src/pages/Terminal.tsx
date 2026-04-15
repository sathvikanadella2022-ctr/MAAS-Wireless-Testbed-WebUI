import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../components/AuthContext';
import '@xterm/xterm/css/xterm.css';

interface Reservation {
  id: string;
  resource: string;
  startTime: string;
  endTime: string;
  userId: string;
}

const Terminal: React.FC = () => {
  const { user, loading } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [resource, setResource] = useState('');
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');

  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setReservations([]);
      return;
    }

    fetch('/api/reservations', { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Unable to load reservations.');
        }

        setError('');
        setReservations(data.reservations ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load reservations.'));
  }, [loading, user]);

  const activeReservations = useMemo(() => {
    const now = Date.now();
    return reservations.filter((r) => {
      const start = new Date(r.startTime).getTime();
      const end = new Date(r.endTime).getTime();
      return start <= now && end >= now && (r.userId === user?.id || user?.role === 'ADMIN');
    });
  }, [reservations, user]);

  // Mount xterm.js once a sessionId is available
  useEffect(() => {
    if (!sessionId || !terminalContainerRef.current) return;

    // Tear down any previous instance
    socketRef.current?.disconnect();
    xtermRef.current?.dispose();

    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        selectionBackground: '#264f78'
      }
    });
    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(terminalContainerRef.current);
    fitAddon.fit();
    xtermRef.current = xterm;

    // Connect to the /terminal Socket.IO namespace with the session token
    const socket = io('/terminal', {
      auth: { sessionId },
      path: '/socket.io'
    });
    socketRef.current = socket;

    socket.on('terminal:output', (data: string) => xterm.write(data));
    socket.on('terminal:error', (msg: string) => {
      setError(msg);
      setSessionId('');
    });
    socket.on('terminal:exit', () => {
      xterm.write('\r\n\x1b[33m[Session closed]\x1b[0m\r\n');
    });

    // Send keystrokes to the backend PTY
    xterm.onData((data) => socket.emit('terminal:input', data));

    // Resize PTY when the container is resized
    const observer = new ResizeObserver(() => {
      fitAddon.fit();
      socket.emit('terminal:resize', { cols: xterm.cols, rows: xterm.rows });
    });
    observer.observe(terminalContainerRef.current);

    return () => {
      observer.disconnect();
      socket.disconnect();
      xterm.dispose();
    };
  }, [sessionId]);

  const handleStart = async () => {
    setError('');

    try {
      const response = await fetch('/api/terminal/start', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to start terminal session.');
        return;
      }

      setSessionId(data.sessionId);
    } catch {
      setError('Unable to reach the backend. Make sure both frontend and backend dev servers are running.');
    }
  };

  const handleStop = () => {
    void fetch('/api/terminal/end', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    }).catch(() => {
      // Socket disconnect still tears down the PTY if this request fails.
    });

    socketRef.current?.disconnect();
    xtermRef.current?.dispose();
    xtermRef.current = null;
    setSessionId('');
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
          background: 'linear-gradient(135deg, #0d3b2e 0%, #116466 50%, #1f8a70 100%)'
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h4" fontWeight={700}>
            Remote Terminal
          </Typography>
          <Typography sx={{ maxWidth: 760, color: 'rgba(248,250,252,0.84)' }}>
            Select an active reservation below and launch a live shell session.
          </Typography>
        </Stack>
      </Paper>

      {!loading && !user && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Use the Demo Login button in the top bar before starting a terminal session.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!sessionId && (
        <Paper sx={{ p: 3, borderRadius: 4, mb: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={700}>
              Launch Session
            </Typography>
            <TextField
              select
              label="Reserved Resource"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              fullWidth
              helperText="Only active reservations are eligible for terminal access."
            >
              {activeReservations.map((r) => (
                <MenuItem key={r.id} value={r.resource}>
                  {r.resource}
                </MenuItem>
              ))}
              {activeReservations.length === 0 && (
                <MenuItem value="local" key="local">
                  Local shell (dev / demo)
                </MenuItem>
              )}
            </TextField>
            <Button variant="contained" onClick={handleStart} disabled={!resource || loading || !user}>
              Start SSH Session
            </Button>
          </Stack>
        </Paper>
      )}

      {sessionId && (
        <Paper sx={{ p: 2, borderRadius: 4, bgcolor: '#0d1117' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" sx={{ color: '#58a6ff', fontFamily: 'monospace' }}>
              {resource} — {sessionId.slice(0, 20)}…
            </Typography>
            <Button size="small" color="error" variant="outlined" onClick={handleStop}>
              End Session
            </Button>
          </Stack>
          <Box
            ref={terminalContainerRef}
            sx={{ width: '100%', height: 480, '& .xterm': { height: '100%' } }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default Terminal;
