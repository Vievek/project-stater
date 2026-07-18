import request from 'supertest';
import * as fc from 'fast-check';
import { app } from '../../../../app';
import { db } from '../../../../infrastructure/db';
import { buildRegisterPayload, buildLoginPayload } from '../factories/auth.factory';

describe('Auth Module Integration Tests', () => {

  beforeAll(async () => {
    // Clear out users before testing
    await db.user.deleteMany({});
  });

  afterAll(async () => {
    // Cleanup
    await db.user.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return SafeUser + token', async () => {
      const payload = buildRegisterPayload();
      const res = await request(app)
        .post('/api/auth/register')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(payload.email);
      expect(res.body.data.user.password).toBeUndefined(); // Should be a SafeUser
    });

    it('should return 409 Conflict if email already exists', async () => {
      const payload = buildRegisterPayload();
      
      // First registration
      await request(app).post('/api/auth/register').send(payload);
      
      // Second registration with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 Bad Request on invalid payload (missing password)', async () => {
      const payload = buildRegisterPayload();
      delete (payload as any).password;
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const payload = buildRegisterPayload();
      await request(app).post('/api/auth/register').send(payload);

      const loginPayload = {
        email: payload.email,
        password: payload.password
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(payload.email);
    });

    it('should return 401 on wrong password', async () => {
      const payload = buildRegisterPayload();
      await request(app).post('/api/auth/register').send(payload);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: payload.email,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Auth Middleware & RBAC (via /api/todos)', () => {
    let userToken: string;
    let adminToken: string;

    beforeAll(async () => {
      // Register a USER
      const userPayload = buildRegisterPayload();
      const userRes = await request(app).post('/api/auth/register').send(userPayload);
      userToken = userRes.body.data.token;

      // Register an ADMIN
      const adminPayload = buildRegisterPayload();
      await request(app).post('/api/auth/register').send(adminPayload);
      
      // Upgrade role in DB to ADMIN
      await db.user.update({
        where: { email: adminPayload.email },
        data: { role: 'ADMIN' }
      });

      // Login to get new token with ADMIN role
      const loginRes = await request(app).post('/api/auth/login').send({
        email: adminPayload.email,
        password: adminPayload.password,
      });
      adminToken = loginRes.body.data.token;
    });

    it('should deny DELETE /api/todos (deleteAll) without a token (401)', async () => {
      const res = await request(app).delete('/api/todos');
      expect(res.status).toBe(401);
    });

    it('should deny DELETE /api/todos with a USER token (403)', async () => {
      const res = await request(app)
        .delete('/api/todos')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow DELETE /api/todos with an ADMIN token (204)', async () => {
      const res = await request(app)
        .delete('/api/todos')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });
  });

});
