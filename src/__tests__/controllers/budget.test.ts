process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.NODE_ENV = 'test';

import { connectTestDb, clearTestDb, disconnectTestDb } from '../setup';
import { api, registerAndGetTokens } from '../helpers';

let accessToken: string;

beforeAll(async () => {
  await connectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  const tokens = await registerAndGetTokens({ email: 'budget@example.com' });
  accessToken = tokens.accessToken;
});

afterAll(async () => {
  await disconnectTestDb();
});

const authHeader = () => ({ Authorization: `Bearer ${accessToken}` });

const createBudget = (overrides = {}) =>
  api
    .post('/api/v1/budgets')
    .set(authHeader())
    .send({
      category: 'food & dining',
      limit: 500,
      period: 'monthly',
      ...overrides,
    });

describe('Budget Controller', () => {
  describe('POST /api/v1/budgets', () => {
    it('should create a budget', async () => {
      const res = await createBudget();
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.category).toBe('food & dining');
      expect(res.body.data.limit).toBe(500);
      expect(res.body.data.period).toBe('monthly');
    });

    it('should reject missing required fields', async () => {
      const res = await api
        .post('/api/v1/budgets')
        .set(authHeader())
        .send({ category: 'food' });
      expect(res.status).toBe(400);
    });

    it('should reject limit <= 0', async () => {
      const res = await createBudget({ limit: 0 });
      expect(res.status).toBe(400);
    });

    it('should reject invalid period', async () => {
      const res = await createBudget({ period: 'weekly' });
      expect(res.status).toBe(400);
    });

    it('should reject duplicate budget for same category and period', async () => {
      await createBudget();
      const res = await createBudget();
      expect(res.status).toBe(409);
    });

    it('should default period to monthly', async () => {
      const res = await api
        .post('/api/v1/budgets')
        .set(authHeader())
        .send({ category: 'transport', limit: 200 });
      expect(res.status).toBe(201);
      expect(res.body.data.period).toBe('monthly');
    });

    it('should reject unauthenticated request', async () => {
      const res = await api
        .post('/api/v1/budgets')
        .send({ category: 'food', limit: 500 });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/budgets', () => {
    it('should list all budgets with computed fields', async () => {
      await createBudget();
      await createBudget({ category: 'transportation', limit: 200 });

      const res = await api.get('/api/v1/budgets').set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('spent');
      expect(res.body.data[0]).toHaveProperty('remaining');
      expect(res.body.data[0]).toHaveProperty('percentageUsed');
    });

    it('should filter by period', async () => {
      await createBudget({ period: 'monthly' });
      await createBudget({ category: 'travel', limit: 1000, period: 'yearly' });

      const res = await api
        .get('/api/v1/budgets?period=yearly')
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].period).toBe('yearly');
    });

    it('should return empty array when no budgets', async () => {
      const res = await api.get('/api/v1/budgets').set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/budgets/:id', () => {
    it('should get a single budget with computed fields', async () => {
      const created = await createBudget();
      const id = created.body.data._id;

      const res = await api
        .get(`/api/v1/budgets/${id}`)
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(id);
      expect(res.body.data).toHaveProperty('spent');
      expect(res.body.data).toHaveProperty('remaining');
    });

    it('should return 404 for non-existent id', async () => {
      const res = await api
        .get('/api/v1/budgets/6921e345bd11e0565579e349')
        .set(authHeader());
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid ObjectId', async () => {
      const res = await api
        .get('/api/v1/budgets/invalid-id')
        .set(authHeader());
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/v1/budgets/:id', () => {
    it('should update budget limit', async () => {
      const created = await createBudget();
      const id = created.body.data._id;

      const res = await api
        .put(`/api/v1/budgets/${id}`)
        .set(authHeader())
        .send({ limit: 750 });
      expect(res.status).toBe(200);
      expect(res.body.data.limit).toBe(750);
    });

    it('should update budget period', async () => {
      const created = await createBudget();
      const id = created.body.data._id;

      const res = await api
        .put(`/api/v1/budgets/${id}`)
        .set(authHeader())
        .send({ period: 'yearly' });
      expect(res.status).toBe(200);
      expect(res.body.data.period).toBe('yearly');
    });

    it('should reject limit <= 0', async () => {
      const created = await createBudget();
      const id = created.body.data._id;

      const res = await api
        .put(`/api/v1/budgets/${id}`)
        .set(authHeader())
        .send({ limit: -10 });
      expect(res.status).toBe(400);
    });

    it('should reject invalid period', async () => {
      const created = await createBudget();
      const id = created.body.data._id;

      const res = await api
        .put(`/api/v1/budgets/${id}`)
        .set(authHeader())
        .send({ period: 'weekly' });
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await api
        .put('/api/v1/budgets/6921e345bd11e0565579e349')
        .set(authHeader())
        .send({ limit: 100 });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/budgets/:id', () => {
    it('should delete a budget', async () => {
      const created = await createBudget();
      const id = created.body.data._id;

      const res = await api
        .delete(`/api/v1/budgets/${id}`)
        .set(authHeader());
      expect(res.status).toBe(200);

      const check = await api
        .get(`/api/v1/budgets/${id}`)
        .set(authHeader());
      expect(check.status).toBe(404);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await api
        .delete('/api/v1/budgets/6921e345bd11e0565579e349')
        .set(authHeader());
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/budgets/status/overview', () => {
    it('should return budget status for all budgets', async () => {
      await createBudget({ category: 'food & dining', limit: 100 });
      await createBudget({ category: 'transportation', limit: 200 });

      const res = await api
        .get('/api/v1/budgets/status/overview')
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('status');
      expect(res.body.data[0]).toHaveProperty('isOverBudget');
      expect(res.body.data[0]).toHaveProperty('isNearBudget');
    });

    it('should show ok status when no spending', async () => {
      await createBudget({ limit: 500 });

      const res = await api
        .get('/api/v1/budgets/status/overview')
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data[0].status).toBe('ok');
      expect(res.body.data[0].spent).toBe(0);
      expect(res.body.data[0].remaining).toBe(500);
    });

    it('should return empty array when no budgets', async () => {
      const res = await api
        .get('/api/v1/budgets/status/overview')
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });
});
