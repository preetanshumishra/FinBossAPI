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
  const tokens = await registerAndGetTokens({ email: 'txn@example.com' });
  accessToken = tokens.accessToken;
});

afterAll(async () => {
  await disconnectTestDb();
});

const authHeader = () => ({ Authorization: `Bearer ${accessToken}` });

const createTxn = (overrides = {}) =>
  api
    .post('/api/v1/transactions')
    .set(authHeader())
    .send({
      type: 'expense',
      amount: 50,
      category: 'food & dining',
      description: 'Test transaction',
      date: '2025-06-15',
      ...overrides,
    });

describe('Transaction Controller', () => {
  describe('POST /api/v1/transactions', () => {
    it('should create a transaction', async () => {
      const res = await createTxn();
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.amount).toBe(50);
      expect(res.body.data.type).toBe('expense');
    });

    it('should reject missing required fields', async () => {
      const res = await api
        .post('/api/v1/transactions')
        .set(authHeader())
        .send({ type: 'expense' });
      expect(res.status).toBe(400);
    });

    it('should reject invalid type', async () => {
      const res = await createTxn({ type: 'transfer' });
      expect(res.status).toBe(400);
    });

    it('should reject amount <= 0', async () => {
      const res = await createTxn({ amount: 0 });
      expect(res.status).toBe(400);
    });

    it('should reject non-ISO date', async () => {
      const res = await createTxn({ date: 'January 1' });
      expect(res.status).toBe(400);
    });

    it('should accept valid ISO datetime', async () => {
      const res = await createTxn({ date: '2025-06-15T10:30:00Z' });
      expect(res.status).toBe(201);
    });

    it('should reject unauthenticated request', async () => {
      const res = await api
        .post('/api/v1/transactions')
        .send({ type: 'expense', amount: 50, category: 'food' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/transactions', () => {
    it('should list transactions with pagination', async () => {
      await createTxn();
      await createTxn({ amount: 100 });

      const res = await api.get('/api/v1/transactions').set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data.transactions).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(2);
    });

    it('should filter by type', async () => {
      await createTxn({ type: 'expense' });
      await createTxn({ type: 'income', category: 'salary' });

      const res = await api
        .get('/api/v1/transactions?type=income')
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data.transactions).toHaveLength(1);
      expect(res.body.data.transactions[0].type).toBe('income');
    });

    it('should filter by date range', async () => {
      await createTxn({ date: '2025-01-15' });
      await createTxn({ date: '2025-06-15' });

      const res = await api
        .get('/api/v1/transactions?startDate=2025-06-01&endDate=2025-06-30')
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data.transactions).toHaveLength(1);
    });

    it('should reject invalid startDate', async () => {
      const res = await api
        .get('/api/v1/transactions?startDate=bad-date')
        .set(authHeader());
      expect(res.status).toBe(400);
    });

    it('should respect pagination limits', async () => {
      for (let i = 0; i < 5; i++) {
        await createTxn({ amount: i + 1 });
      }

      const res = await api
        .get('/api/v1/transactions?page=1&limit=2')
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data.transactions).toHaveLength(2);
      expect(res.body.data.pagination.pages).toBe(3);
    });
  });

  describe('GET /api/v1/transactions/:id', () => {
    it('should get a single transaction', async () => {
      const created = await createTxn();
      const id = created.body.data._id;

      const res = await api
        .get(`/api/v1/transactions/${id}`)
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(id);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await api
        .get('/api/v1/transactions/6921e345bd11e0565579e349')
        .set(authHeader());
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid ObjectId', async () => {
      const res = await api
        .get('/api/v1/transactions/invalid-id')
        .set(authHeader());
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/v1/transactions/:id', () => {
    it('should update a transaction', async () => {
      const created = await createTxn();
      const id = created.body.data._id;

      const res = await api
        .put(`/api/v1/transactions/${id}`)
        .set(authHeader())
        .send({ amount: 75, description: 'Updated' });
      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(75);
      expect(res.body.data.description).toBe('Updated');
    });

    it('should reject invalid type on update', async () => {
      const created = await createTxn();
      const id = created.body.data._id;

      const res = await api
        .put(`/api/v1/transactions/${id}`)
        .set(authHeader())
        .send({ type: 'transfer' });
      expect(res.status).toBe(400);
    });

    it('should reject non-ISO date on update', async () => {
      const created = await createTxn();
      const id = created.body.data._id;

      const res = await api
        .put(`/api/v1/transactions/${id}`)
        .set(authHeader())
        .send({ date: 'next Tuesday' });
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await api
        .put('/api/v1/transactions/6921e345bd11e0565579e349')
        .set(authHeader())
        .send({ amount: 100 });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/transactions/:id', () => {
    it('should delete a transaction', async () => {
      const created = await createTxn();
      const id = created.body.data._id;

      const res = await api
        .delete(`/api/v1/transactions/${id}`)
        .set(authHeader());
      expect(res.status).toBe(200);

      const check = await api
        .get(`/api/v1/transactions/${id}`)
        .set(authHeader());
      expect(check.status).toBe(404);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await api
        .delete('/api/v1/transactions/6921e345bd11e0565579e349')
        .set(authHeader());
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/transactions/summary', () => {
    it('should return income, expense, and balance', async () => {
      await createTxn({ type: 'income', amount: 1000, category: 'salary' });
      await createTxn({ type: 'expense', amount: 300 });
      await createTxn({ type: 'expense', amount: 200 });

      const res = await api
        .get('/api/v1/transactions/summary')
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data.income).toBe(1000);
      expect(res.body.data.expense).toBe(500);
      expect(res.body.data.balance).toBe(500);
    });

    it('should return zeros when no transactions', async () => {
      const res = await api
        .get('/api/v1/transactions/summary')
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data.income).toBe(0);
      expect(res.body.data.expense).toBe(0);
      expect(res.body.data.balance).toBe(0);
    });
  });

  describe('GET /api/v1/transactions/analytics/category', () => {
    it('should return spending grouped by category', async () => {
      await createTxn({ category: 'food & dining', amount: 50 });
      await createTxn({ category: 'food & dining', amount: 30 });
      await createTxn({ category: 'transportation', amount: 20 });

      const res = await api
        .get('/api/v1/transactions/analytics/category')
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      const food = res.body.data.find(
        (c: { _id: string }) => c._id === 'food & dining'
      );
      expect(food.total).toBe(80);
      expect(food.count).toBe(2);
    });
  });

  describe('GET /api/v1/transactions/trends', () => {
    it('should return daily trends', async () => {
      await createTxn({ date: '2025-06-15', amount: 50 });
      await createTxn({ date: '2025-06-16', amount: 30 });

      const res = await api
        .get(
          '/api/v1/transactions/trends?startDate=2025-06-01&endDate=2025-06-30&groupBy=day'
        )
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should require startDate and endDate', async () => {
      const res = await api
        .get('/api/v1/transactions/trends')
        .set(authHeader());
      expect(res.status).toBe(400);
    });

    it('should reject invalid groupBy', async () => {
      const res = await api
        .get(
          '/api/v1/transactions/trends?startDate=2025-06-01&endDate=2025-06-30&groupBy=quarter'
        )
        .set(authHeader());
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/transactions/forecast', () => {
    it('should return forecast with zero data', async () => {
      const res = await api
        .get('/api/v1/transactions/forecast')
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data.confidence).toBe(0);
      expect(res.body.data.projected_spending).toBe(0);
    });

    it('should return forecast based on historical data', async () => {
      // Create expense transactions within the last 3 months
      const now = new Date();
      for (let i = 0; i < 3; i++) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        d.setDate(i + 1);
        await createTxn({
          date: d.toISOString().split('T')[0],
          amount: 100,
        });
      }

      const res = await api
        .get('/api/v1/transactions/forecast?months=2')
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data.months).toBe(2);
      expect(res.body.data.projected_spending).toBeGreaterThan(0);
    });
  });
});
