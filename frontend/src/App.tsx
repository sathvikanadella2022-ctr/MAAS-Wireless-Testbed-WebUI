import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Terminal from './pages/Terminal';
import Docs from './pages/Docs';
import { CssBaseline, Container } from '@mui/material';
import { AuthProvider } from './components/AuthContext';

const App: React.FC = () => (
  <AuthProvider>
    <CssBaseline />
    <Container maxWidth="md">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/terminal" element={<Terminal />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Container>
  </AuthProvider>
);

export default App;
