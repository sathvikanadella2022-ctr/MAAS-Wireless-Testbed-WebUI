import { Router } from 'express';
import passport from 'passport';
import { auditLog } from '../modules/audit';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const devAuthEnabled = process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH !== 'false';

// Globus login
router.get('/login', passport.authenticate('globus', { scope: 'openid email profile' }));

router.get('/dev-login', (req, res, next) => {
  if (!devAuthEnabled) {
    return res.status(404).json({ error: 'Development login is disabled.' });
  }

  req.login(
    { id: 'stub-user', email: 'user@globus.org', role: 'RESEARCHER' },
    (error) => {
      if (error) {
        return next(error);
      }

      return res.redirect(`${frontendUrl}/dashboard`);
    }
  );
});

// Globus callback (real)
router.get('/callback',
  passport.authenticate('globus', { failureRedirect: `${frontendUrl}/` }),
  (_req, res) => {
    res.redirect(`${frontendUrl}/dashboard`);
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    const userId = (req.user as { id?: string } | undefined)?.id;
    auditLog(userId, 'logout', 'User logged out');
    res.redirect(`${frontendUrl}/`);
  });
});

export default router;
