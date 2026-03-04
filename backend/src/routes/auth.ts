import { Router } from 'express';
import passport from 'passport';
import { auditLog } from '../modules/audit';

const router = Router();

// Globus login
router.get('/login', passport.authenticate('globus', { scope: 'openid email profile' }));

// Globus callback (stub for MVP)
router.get('/callback', (req, res) => {
  // TODO: Implement real callback logic
  // For now, just simulate login success
  // In production, use passport.authenticate('globus', ...)
  res.redirect('/dashboard');
});

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    auditLog(req.user?.id, 'logout', 'User logged out');
    res.redirect('/');
  });
});

export default router;
