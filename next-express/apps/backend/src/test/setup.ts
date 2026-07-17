import { prisma, pool } from '../config/postgres';
import { redisClient } from '../config/redis';

afterAll(async () => {
  // Disconnect from Prisma and Redis so Jest can exit cleanly
  await prisma.$disconnect();
  await pool.end();
  
  if (redisClient.status === 'ready' || redisClient.status === 'connecting') {
    await redisClient.quit();
  }
});
