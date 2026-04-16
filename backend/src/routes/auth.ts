import { Response, Router } from 'express';
import passport from 'passport';
import { auditLog } from '../modules/audit';
import { getAuthProviders, isDevAuthEnabled, isGlobusConfigured } from '../modules/auth';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const redirectWithAuthError = (res: Response, errorCode: string) => {
  const url = new URL(frontendUrl);
  url.searchParams.set('authError', errorCode);
  return res.redirect(url.toString());
};

// Globus login
router.get('/login', (req, res, next) => {
  if (!isGlobusConfigured()) {
    return redirectWithAuthError(res, 'globus_not_configured');
  }

  return passport.authenticate('globus', {
    scope: ['openid', 'profile', 'email']
  })(req, res, next);
});

router.get('/dev-login', (req, res, next) => {
  if (!isDevAuthEnabled()) {
    return res.status(404).json({ error: 'Development login is disabled.' });
  }

  req.login(
    { id: 'stub-user', email: 'user@globus.org', role: 'RESEARCHER' } as Express.User,
    (error) => {
      if (error) {
        return next(error);
      }

      return res.redirect(`${frontendUrl}/dashboard`);
    }
  );
});

// Globus callback
router.get('/callback',
  (req, res, next) => {
    if (!isGlobusConfigured()) {
      return redirectWithAuthError(res, 'globus_not_configured');
    }

    return passport.authenticate('globus', {
      failureRedirect: `${frontendUrl}/?authError=globus_login_failed`
    })(req, res, next);
  },
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

router.get('/providers', (_req, res) => {
  res.json(getAuthProviders());
});

export default router;
