import request from 'supertest';
import { Express } from 'express';

export interface CrudIntegrationTestOptions {
  skip?: ('GET_ALL' | 'GET_BY_ID' | 'CREATE' | 'UPDATE' | 'DELETE' | 'DELETE_ALL')[];
  mockData?: any; // the initial data payload for create test
  updateData?: any; // the payload for update test
  testId?: string; // id to use for getById, update, delete if not dynamically generated from create
}

/**
 * A factory for generating standard CRUD integration tests for any endpoint.
 * This adheres to DRY and ensures standard routes are tested without repeating boilerplate.
 * By using the `skip` array, you can omit specific endpoints that have been overwritten 
 * with custom logic, allowing you to test them separately.
 */
export function createCrudTests(
  app: Express,
  endpoint: string, // e.g., '/api/todos'
  options: CrudIntegrationTestOptions = {}
) {
  describe(`CRUD Integration Tests for ${endpoint}`, () => {
    const { skip = [], mockData = { name: 'Test' }, updateData = { name: 'Updated' } } = options;
    let createdId: string = options.testId || '';

    if (!skip.includes('CREATE')) {
      it(`POST ${endpoint} - should create a new record`, async () => {
        const res = await request(app).post(endpoint).send(mockData);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBeDefined();
        
        // Save ID for subsequent tests
        createdId = res.body.data.id;
      });
    }

    if (!skip.includes('GET_ALL')) {
      it(`GET ${endpoint} - should return all records`, async () => {
        const res = await request(app).get(endpoint);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    }

    if (!skip.includes('GET_BY_ID')) {
      it(`GET ${endpoint}/:id - should return record by id`, async () => {
        // Skip if we didn't create a record and no testId was provided
        if (!createdId) {
          console.warn(`Skipping GET_BY_ID test for ${endpoint} because no testId was available`);
          return;
        }

        const res = await request(app).get(`${endpoint}/${createdId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(createdId);
      });
    }

    if (!skip.includes('UPDATE')) {
      it(`PUT ${endpoint}/:id - should update the record`, async () => {
        if (!createdId) return;

        const res = await request(app).put(`${endpoint}/${createdId}`).send(updateData);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    }

    if (!skip.includes('DELETE')) {
      it(`DELETE ${endpoint}/:id - should delete the record`, async () => {
        if (!createdId) return;

        const res = await request(app).delete(`${endpoint}/${createdId}`);
        expect(res.status).toBe(204);
      });
    }

    if (!skip.includes('DELETE_ALL')) {
      it(`DELETE ${endpoint} - should delete all records`, async () => {
        const res = await request(app).delete(endpoint);
        expect(res.status).toBe(204);
      });
    }
  });
}
