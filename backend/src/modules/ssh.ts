import os from 'node:os';
import * as pty from 'node-pty';

interface PendingSession {
  userId: string;
  resource: string;
  expiresAt: number;
}

interface ActiveSession {
  process: pty.IPty;
  userId: string;
  resource: string;
}

interface ResourceTarget {
  type: 'local' | 'ssh';
  host?: string;
  username?: string;
  port?: number;
  privateKeyPath?: string;
}

// Sessions authorised by the REST endpoint, waiting for Socket.IO to claim them
const pendingSessions = new Map<string, PendingSession>();

// Sessions with a live PTY process attached
const activeSessions = new Map<string, ActiveSession>();

const terminalCwd = process.env.TERMINAL_CWD || os.homedir();

const resolveShellCommand = () => {
  if (process.env.TERMINAL_SHELL) {
    return process.env.TERMINAL_SHELL;
  }

  return os.platform() === 'win32' ? 'powershell.exe' : (process.env.SHELL ?? 'bash');
};

const buildTerminalEnv = (userId: string, resource: string): Record<string, string> => {
  const entries = Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string');

  return {
    ...Object.fromEntries(entries),
    TERM: 'xterm-256color',
    PORTAL_RESOURCE: resource,
    PORTAL_USER_ID: userId
  };
};

const toResourceEnvKey = (resource: string) => resource.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

const parsePort = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const loadJsonTargets = (): Record<string, ResourceTarget> => {
  const raw = process.env.TERMINAL_RESOURCE_HOSTS;

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, Omit<ResourceTarget, 'type'> & { type?: 'local' | 'ssh' }>;

    return Object.fromEntries(
      Object.entries(parsed).map(([resource, target]) => [
        resource,
        {
          type: target.type ?? (target.host ? 'ssh' : 'local'),
          host: target.host,
          username: target.username,
          port: target.port,
          privateKeyPath: target.privateKeyPath
        }
      ])
    );
  } catch {
    return {};
  }
};

export function resolveTerminalTarget(resource: string): ResourceTarget {
  if (resource === 'local') {
    return { type: 'local' };
  }

  const jsonTarget = loadJsonTargets()[resource];
  if (jsonTarget) {
    return jsonTarget;
  }

  const envKey = toResourceEnvKey(resource);
  const host = process.env[`TERMINAL_HOST_${envKey}`];

  if (!host) {
    return { type: 'local' };
  }

  return {
    type: 'ssh',
    host,
    username: process.env[`TERMINAL_USER_${envKey}`] || process.env.TERMINAL_SSH_USER,
    port: parsePort(process.env[`TERMINAL_PORT_${envKey}`] || process.env.TERMINAL_SSH_PORT),
    privateKeyPath: process.env[`TERMINAL_KEY_${envKey}`] || process.env.TERMINAL_SSH_KEY
  };
}

export function canStartTerminal(resource: string): { ok: boolean; error?: string } {
  const target = resolveTerminalTarget(resource);

  if (resource === 'local') {
    return { ok: true };
  }

  if (target.type === 'local') {
    return {
      ok: false,
      error: `No SSH target is configured for ${resource}. Set TERMINAL_HOST_${toResourceEnvKey(resource)} or TERMINAL_RESOURCE_HOSTS in backend/.env.`
    };
  }

  if (!target.host) {
    return {
      ok: false,
      error: `SSH target for ${resource} is missing a host value.`
    };
  }

  return { ok: true };
}

const buildSshLaunch = (resource: string, userId: string): { command: string; args: string[]; cwd: string; env: Record<string, string> } => {
  const target = resolveTerminalTarget(resource);

  if (target.type === 'local' || !target.host) {
    return {
      command: resolveShellCommand(),
      args: [],
      cwd: terminalCwd,
      env: buildTerminalEnv(userId, resource)
    };
  }

  const destination = target.username ? `${target.username}@${target.host}` : target.host;
  const args = [
    destination,
    '-tt',
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=30'
  ];

  if (target.port) {
    args.push('-p', String(target.port));
  }

  if (target.privateKeyPath) {
    args.push('-i', target.privateKeyPath);
  }

  return {
    command: 'ssh',
    args,
    cwd: terminalCwd,
    env: buildTerminalEnv(userId, resource)
  };
};

export function registerPendingSession(sessionId: string, userId: string, resource: string): void {
  pendingSessions.set(sessionId, {
    userId,
    resource,
    expiresAt: Date.now() + 30_000 // 30-second claim window
  });
}

export function claimPendingSession(sessionId: string): PendingSession | null {
  const pending = pendingSessions.get(sessionId);
  if (!pending) return null;
  if (Date.now() > pending.expiresAt) {
    pendingSessions.delete(sessionId);
    return null;
  }
  pendingSessions.delete(sessionId);
  return pending;
}

export function spawnPtySession(sessionId: string, userId: string, resource: string): pty.IPty {
  const launch = buildSshLaunch(resource, userId);
  const ptyProcess = pty.spawn(launch.command, launch.args, {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: launch.cwd,
    env: launch.env
  });
  activeSessions.set(sessionId, { process: ptyProcess, userId, resource });
  return ptyProcess;
}

export function destroySession(sessionId: string): void {
  const session = activeSessions.get(sessionId);
  if (session) {
    try { session.process.kill(); } catch { /* already dead */ }
    activeSessions.delete(sessionId);
  }
}
