import { Request, Response, NextFunction } from 'express';
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

export async function auditLog(userId: string | undefined, event: string, details?: string) {
  // Mock audit log (no DB)
  console.log(`Audit: ${event} by ${userId || 'unknown'}: ${details}`);
}

export function auditLogger(req: Request, res: Response, next: NextFunction) {
  // Example: log all auth events, reservation changes, terminal sessions
  // For MVP, just call next()
  next();
}
