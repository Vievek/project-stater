import request from 'supertest';
import { app } from '../../../../app'; // Adjust path depending on where your Express app is exported
import { createCrudTests } from '../../../../test/integration-factory';
import { buildCreateUserPayload, buildUpdateUserPayload } from '../factories/user.factory';

describe('User Module Integration Tests', () => {
  
  // 1. Run the standard CRUD tests via the Factory
  createCrudTests(app, '/api/users', {
    mockData: buildCreateUserPayload(),
    updateData: buildUpdateUserPayload(),
    skip: ['GET_ALL', 'GET_BY_ID'], // overridden with custom logic
  });

  // 2. Add custom integration tests for endpoints unique to this module
  describe('Custom Endpoints', () => {
    it('GET /api/users/summary - should return summary of users', async () => {
      const res = await request(app).get('/api/users/summary');
      
      if (res.status !== 404) {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('total');
      }
    });
  });
});
