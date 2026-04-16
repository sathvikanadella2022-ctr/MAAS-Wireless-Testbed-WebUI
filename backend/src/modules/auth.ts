import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Request, Response, NextFunction } from 'express';
import { VerifyCallback } from 'passport-oauth2';
import dotenv from 'dotenv';
dotenv.config();

export type AuthUser = {
  id: string;
  email: string;
  role: 'RESEARCHER' | 'ADMIN';
};

type GlobusProfile = {
  sub: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  identity_set?: Array<{ sub?: string; email?: string; username?: string; name?: string }>;
};

const authBaseUrl = process.env.GLOBUS_AUTH_URL || 'https://auth.globus.org/v2/oauth2';
const userInfoUrl = process.env.GLOBUS_USERINFO_URL || `${authBaseUrl}/userinfo`;
const callbackUrl = process.env.GLOBUS_REDIRECT_URI || 'http://localhost:3002/auth/callback';

const requiredGlobusEnv = ['GLOBUS_CLIENT_ID', 'GLOBUS_CLIENT_SECRET', 'GLOBUS_REDIRECT_URI'] as const;
type RequiredGlobusEnv = (typeof requiredGlobusEnv)[number];

const getMissingGlobusConfig = (): RequiredGlobusEnv[] =>
  requiredGlobusEnv.filter((key) => !process.env[key]?.trim());

export const isGlobusConfigured = () => getMissingGlobusConfig().length === 0;
export const isDevAuthEnabled = () =>
  process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH === 'true';

export const getAuthProviders = () => ({
  globusEnabled: isGlobusConfigured(),
  devLoginEnabled: isDevAuthEnabled(),
  missingGlobusConfig: getMissingGlobusConfig()
});

const adminEmails = new Set(
  (process.env.GLOBUS_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

class GlobusOAuth2Strategy extends OAuth2Strategy {
  userProfile(accessToken: string, done: (error?: Error | null, profile?: GlobusProfile) => void): void {
    this._oauth2.useAuthorizationHeaderforGET(true);
    this._oauth2.get(userInfoUrl, accessToken, (error, body) => {
      if (error) {
        const oauthError = error instanceof Error
          ? error
          : new Error(`Globus userinfo request failed with status ${error.statusCode ?? 'unknown'}.`);
        return done(oauthError);
      }

      try {
        const raw = typeof body === 'string' ? body : body?.toString('utf8');
        if (!raw) {
          throw new Error('Globus userinfo response was empty.');
        }
        const profile = JSON.parse(raw) as GlobusProfile;
        return done(null, profile);
      } catch (parseError) {
        return done(parseError as Error);
      }
    });
  }
}

const mapGlobusProfileToUser = (profile: GlobusProfile): AuthUser => {
  const primaryIdentity = profile.identity_set?.find((identity) => identity.email) || profile.identity_set?.[0];
  const email = profile.email || primaryIdentity?.email || profile.preferred_username || primaryIdentity?.username;

  if (!profile.sub || !email) {
    throw new Error('Globus profile is missing required identity fields.');
  }

  return {
    id: profile.sub,
    email,
    role: adminEmails.has(email.toLowerCase()) ? 'ADMIN' : 'RESEARCHER'
  };
};

export const globusStrategy = new GlobusOAuth2Strategy({
  authorizationURL: `${authBaseUrl}/authorize`,
  tokenURL: `${authBaseUrl}/token`,
  clientID: process.env.GLOBUS_CLIENT_ID || '',
  clientSecret: process.env.GLOBUS_CLIENT_SECRET || '',
  callbackURL: callbackUrl
}, async (_accessToken: string, _refreshToken: string, _params: any, profile: GlobusProfile, cb: VerifyCallback) => {
  try {
    const user = mapGlobusProfileToUser(profile);
    cb(null, user);
  } catch (error) {
    cb(error as Error);
  }
});

passport.use('globus', globusStrategy);

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj as Express.User);
});

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    return next();
  }

  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({ error: 'Not authenticated' });
}

export function ensureRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser | undefined;
    if (user && user.role === role) return next();
    res.status(403).json({ error: 'Forbidden' });
  };
}
