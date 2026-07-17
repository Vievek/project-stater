import request from 'supertest';

// Mock config modules to avoid Prisma/Redis init in test environment
jest.mock('./config/postgres', () => ({ 
  prisma: new Proxy({}, { 
    get: (target, prop) => (prop === '$transaction' ? jest.fn() : {}) 
  }) 
}));
jest.mock('./config/redis', () => ({
  redisClient: { on: jest.fn(), get: jest.fn(), set: jest.fn() }
}));

import { app } from './app';

describe('Health Check', () => {
  it('should return status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
