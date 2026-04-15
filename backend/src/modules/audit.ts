import { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma';

export async function auditLog(userId: string | undefined, event: string, details?: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        event,
        details
      }
    });
  } catch (error) {
    console.error('Failed to persist audit log:', error);
    console.log(`Audit fallback: ${event} by ${userId || 'unknown'}: ${details}`);
  }
}

export function auditLogger(req: Request, res: Response, next: NextFunction) {
  // Example: log all auth events, reservation changes, terminal sessions
  // For MVP, just call next()
  next();
}
