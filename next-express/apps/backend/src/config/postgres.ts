import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';
import { env } from './env';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configure database connection via driver adapter (Required for Prisma v7)
export const pool = new Pool({ connectionString: env.DATABASE_URL, min: 2, max: 10 });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
