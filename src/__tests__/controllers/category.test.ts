process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.NODE_ENV = 'test';

import { connectTestDb, clearTestDb, disconnectTestDb } from '../setup';
import { api, registerAndGetTokens } from '../helpers';
import { seedCategories } from '../../utils/seedCategories';

let accessToken: string;

beforeAll(async () => {
  await connectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  await seedCategories();
  const tokens = await registerAndGetTokens({ email: 'cat@example.com' });
  accessToken = tokens.accessToken;
});

afterAll(async () => {
  await disconnectTestDb();
});

const authHeader = () => ({ Authorization: `Bearer ${accessToken}` });

describe('Category Controller', () => {
  describe('GET /api/v1/categories', () => {
    it('should return default categories without auth', async () => {
      const res = await api.get('/api/v1/categories');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(13);
      expect(res.body.data.every((c: { isDefault: boolean }) => c.isDefault)).toBe(true);
    });

    it('should return defaults + user categories with auth', async () => {
      // Create a custom category
      await api
        .post('/api/v1/categories')
        .set(authHeader())
        .send({ name: 'Pets', type: 'expense', icon: 'P', color: '#123456' });

      const res = await api
        .get('/api/v1/categories')
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(14);
    });

    it('should filter by type', async () => {
      const res = await api.get('/api/v1/categories?type=income');
      expect(res.status).toBe(200);
      expect(
        res.body.data.every((c: { type: string }) => c.type === 'income')
      ).toBe(true);
    });

    it('should reject tampered token on optional auth', async () => {
      const res = await api
        .get('/api/v1/categories')
        .set({ Authorization: 'Bearer tampered.invalid.token' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/categories', () => {
    it('should create a custom category', async () => {
      const res = await api
        .post('/api/v1/categories')
        .set(authHeader())
        .send({ name: 'Gym', type: 'expense', icon: 'G', color: '#AABBCC' });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('gym');
      expect(res.body.data.isDefault).toBe(false);
    });

    it('should reject missing fields', async () => {
      const res = await api
        .post('/api/v1/categories')
        .set(authHeader())
        .send({ name: 'Gym' });
      expect(res.status).toBe(400);
    });

    it('should reject invalid type', async () => {
      const res = await api
        .post('/api/v1/categories')
        .set(authHeader())
        .send({ name: 'Test', type: 'transfer', icon: 'T', color: '#123456' });
      expect(res.status).toBe(400);
    });

    it('should reject invalid hex color', async () => {
      const res = await api
        .post('/api/v1/categories')
        .set(authHeader())
        .send({ name: 'Test', type: 'expense', icon: 'T', color: 'red' });
      expect(res.status).toBe(400);
    });

    it('should reject duplicate category name', async () => {
      await api
        .post('/api/v1/categories')
        .set(authHeader())
        .send({ name: 'Custom', type: 'expense', icon: 'C', color: '#111111' });

      const res = await api
        .post('/api/v1/categories')
        .set(authHeader())
        .send({ name: 'Custom', type: 'expense', icon: 'C', color: '#222222' });
      expect(res.status).toBe(409);
    });

    it('should reject duplicate with default category name', async () => {
      const res = await api
        .post('/api/v1/categories')
        .set(authHeader())
        .send({
          name: 'Food & Dining',
          type: 'expense',
          icon: 'F',
          color: '#333333',
        });
      expect(res.status).toBe(409);
    });

    it('should reject unauthenticated request', async () => {
      const res = await api
        .post('/api/v1/categories')
        .send({ name: 'Test', type: 'expense', icon: 'T', color: '#123456' });
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/v1/categories/:id', () => {
    let customCategoryId: string;

    beforeEach(async () => {
      const created = await api
        .post('/api/v1/categories')
        .set(authHeader())
        .send({ name: 'Editable', type: 'expense', icon: 'E', color: '#AAAAAA' });
      customCategoryId = created.body.data._id;
    });

    it('should update a custom category', async () => {
      const res = await api
        .put(`/api/v1/categories/${customCategoryId}`)
        .set(authHeader())
        .send({ name: 'Updated', icon: 'U', color: '#BBBBBB' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('updated');
      expect(res.body.data.color).toBe('#BBBBBB');
    });

    it('should reject invalid hex color', async () => {
      const res = await api
        .put(`/api/v1/categories/${customCategoryId}`)
        .set(authHeader())
        .send({ color: 'not-hex' });
      expect(res.status).toBe(400);
    });

    it('should reject name conflict with existing category', async () => {
      await api
        .post('/api/v1/categories')
        .set(authHeader())
        .send({ name: 'Other Custom', type: 'expense', icon: 'O', color: '#CCCCCC' });

      const res = await api
        .put(`/api/v1/categories/${customCategoryId}`)
        .set(authHeader())
        .send({ name: 'Other Custom' });
      expect(res.status).toBe(409);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await api
        .put('/api/v1/categories/6921e345bd11e0565579e349')
        .set(authHeader())
        .send({ name: 'Nope' });
      expect(res.status).toBe(404);
    });

    it('should forbid modifying default categories', async () => {
      // Get a default category
      const cats = await api.get('/api/v1/categories');
      const defaultCat = cats.body.data.find(
        (c: { isDefault: boolean }) => c.isDefault
      );

      const res = await api
        .put(`/api/v1/categories/${defaultCat._id}`)
        .set(authHeader())
        .send({ name: 'Renamed' });
      // Default categories owned by null won't be found for this user → 404
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('should delete a custom category', async () => {
      const created = await api
        .post('/api/v1/categories')
        .set(authHeader())
        .send({ name: 'Deletable', type: 'expense', icon: 'D', color: '#DDDDDD' });
      const id = created.body.data._id;

      const res = await api
        .delete(`/api/v1/categories/${id}`)
        .set(authHeader());
      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await api
        .delete('/api/v1/categories/6921e345bd11e0565579e349')
        .set(authHeader());
      expect(res.status).toBe(404);
    });

    it('should forbid deleting default categories', async () => {
      const cats = await api.get('/api/v1/categories');
      const defaultCat = cats.body.data.find(
        (c: { isDefault: boolean }) => c.isDefault
      );

      const res = await api
        .delete(`/api/v1/categories/${defaultCat._id}`)
        .set(authHeader());
      // Default categories owned by null won't be found for this user → 404
      expect(res.status).toBe(404);
    });

    it('should reject unauthenticated request', async () => {
      const res = await api.delete('/api/v1/categories/6921e345bd11e0565579e349');
      expect(res.status).toBe(401);
    });
  });
});
