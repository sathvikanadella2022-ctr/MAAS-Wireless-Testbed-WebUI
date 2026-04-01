import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Request, Response, NextFunction } from 'express';
import { VerifyCallback } from 'passport-oauth2';
import dotenv from 'dotenv';
dotenv.config();

type AuthUser = {
  id: string;
  email: string;
  role: 'RESEARCHER' | 'ADMIN';
};

// Globus OAuth2 strategy (stub for MVP)
export const globusStrategy = new OAuth2Strategy({
  authorizationURL: process.env.GLOBUS_AUTH_URL || 'https://auth.globus.org/v2/oauth2/authorize',
  tokenURL: 'https://auth.globus.org/v2/oauth2/token',
  clientID: process.env.GLOBUS_CLIENT_ID || '',
  clientSecret: process.env.GLOBUS_CLIENT_SECRET || '',
  callbackURL: process.env.GLOBUS_REDIRECT_URI || 'http://localhost:5173/auth/callback'
}, async (_accessToken: string, _refreshToken: string, _params: any, _profile: any, cb: VerifyCallback) => {
  // Stub user for MVP (no DB required)
  const user: AuthUser = { id: 'stub-user', email: 'user@globus.org', role: 'RESEARCHER' };
  cb(null, user);
});

passport.use('globus', globusStrategy);

passport.serializeUser((user: any, done) => {
  done(null, user);
});
passport.deserializeUser((obj: any, done) => {
  done(null, obj);
});

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  const devAuthEnabled = process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH !== 'false';

  if (devAuthEnabled && req.user) {
    return next();
  }

  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

export function ensureRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser | undefined;
    if (user && user.role === role) return next();
    res.status(403).json({ error: 'Forbidden' });
  };
}
