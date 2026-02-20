process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.NODE_ENV = 'test';

import { connectTestDb, clearTestDb, disconnectTestDb } from '../setup';
import { api, registerAndGetTokens } from '../helpers';

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe('Auth Controller', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const res = await api.post('/api/v1/auth/register').send({
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.email).toBe('newuser@example.com');
    });

    it('should reject duplicate email', async () => {
      await registerAndGetTokens({ email: 'dup@example.com' });

      const res = await api.post('/api/v1/auth/register').send({
        email: 'dup@example.com',
        password: 'password123',
        firstName: 'Dup',
        lastName: 'User',
      });

      expect(res.status).toBe(409);
    });

    it('should reject missing fields', async () => {
      const res = await api.post('/api/v1/auth/register').send({
        email: 'missing@example.com',
      });

      expect(res.status).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await api.post('/api/v1/auth/register').send({
        email: 'short@example.com',
        password: 'short',
        firstName: 'Short',
        lastName: 'Pass',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with correct credentials', async () => {
      await registerAndGetTokens({ email: 'login@example.com' });

      const res = await api.post('/api/v1/auth/login').send({
        email: 'login@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject wrong password', async () => {
      await registerAndGetTokens({ email: 'wrong@example.com' });

      const res = await api.post('/api/v1/auth/login').send({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await api.post('/api/v1/auth/login').send({
        email: 'noone@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should rotate refresh token and return new pair', async () => {
      const { refreshToken } = await registerAndGetTokens({
        email: 'refresh@example.com',
      });

      const res = await api.post('/api/v1/auth/refresh').send({
        refreshToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      // New refresh token should differ from old
      expect(res.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('should reject reuse of an already-rotated refresh token (theft detection)', async () => {
      const { refreshToken } = await registerAndGetTokens({
        email: 'reuse@example.com',
      });

      // First refresh — should succeed
      const first = await api.post('/api/v1/auth/refresh').send({
        refreshToken,
      });
      expect(first.status).toBe(200);

      // Second refresh with same old token — should fail (token was rotated)
      const second = await api.post('/api/v1/auth/refresh').send({
        refreshToken,
      });
      expect(second.status).toBe(401);
    });

    it('should reject missing refresh token', async () => {
      const res = await api.post('/api/v1/auth/refresh').send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should invalidate the refresh token', async () => {
      const { accessToken, refreshToken } = await registerAndGetTokens({
        email: 'logout@example.com',
      });

      // Logout
      const logoutRes = await api
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(logoutRes.status).toBe(200);

      // Try to use the invalidated refresh token
      const refreshRes = await api
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
    });

    it('should require authentication', async () => {
      const res = await api
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'some-token' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('should invalidate all refresh tokens after password change', async () => {
      const { accessToken, refreshToken } = await registerAndGetTokens({
        email: 'pwchange@example.com',
      });

      // Change password
      const changeRes = await api
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456',
        });

      expect(changeRes.status).toBe(200);

      // Old refresh token should now be invalid
      const refreshRes = await api
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should return profile for authenticated user', async () => {
      const { accessToken } = await registerAndGetTokens({
        email: 'profile@example.com',
      });

      const res = await api
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('profile@example.com');
    });

    it('should reject unauthenticated request', async () => {
      const res = await api.get('/api/v1/auth/profile');

      expect(res.status).toBe(401);
    });
  });
});
