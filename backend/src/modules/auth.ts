import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();

// Globus OAuth2 strategy (stub for MVP)
export const globusStrategy = new OAuth2Strategy({
  authorizationURL: process.env.GLOBUS_AUTH_URL || 'https://auth.globus.org/v2/oauth2/authorize',
  tokenURL: 'https://auth.globus.org/v2/oauth2/token',
  clientID: process.env.GLOBUS_CLIENT_ID || '',
  clientSecret: process.env.GLOBUS_CLIENT_SECRET || '',
  callbackURL: process.env.GLOBUS_REDIRECT_URI || 'http://localhost:3001/auth/callback'
}, (accessToken, refreshToken, profile, cb) => {
  // TODO: Lookup/create user in DB
  cb(null, { id: 'stub-user', email: 'stub@uconn.edu', role: 'RESEARCHER' });
});

passport.use('globus', globusStrategy);

passport.serializeUser((user: any, done) => {
  done(null, user);
});
passport.deserializeUser((obj: any, done) => {
  done(null, obj);
});

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

export function ensureRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === role) return next();
    res.status(403).json({ error: 'Forbidden' });
  };
}
