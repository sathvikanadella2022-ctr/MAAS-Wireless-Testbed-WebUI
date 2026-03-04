import { User as PrismaUser } from '@prisma/client';
declare module 'express-session' {
  interface SessionData {
    passport?: { user: PrismaUser };
  }
}
