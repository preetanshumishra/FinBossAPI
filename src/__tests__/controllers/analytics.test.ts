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
  const tokens = await registerAndGetTokens({ email: 'analytics@example.com' });
  accessToken = tokens.accessToken;
});

afterAll(async () => {
  await disconnectTestDb();
});

const authHeader = () => ({ Authorization: `Bearer ${accessToken}` });

const createBudget = (category: string, limit: number) =>
  api
    .post('/api/v1/budgets')
    .set(authHeader())
    .send({ category, limit, period: 'monthly' });

const createTransaction = (category: string, amount: number, date: string) =>
  api
    .post('/api/v1/transactions')
    .set(authHeader())
    .send({ type: 'expense', amount, category, date });

describe('Analytics Controller', () => {
  describe('GET /api/v1/analytics/budget-vs-actual', () => {
    it('should return budget vs actual comparison', async () => {
      await createBudget('food & dining', 500);
      await createBudget('transportation', 200);

      await createTransaction('food & dining', 100, '2025-06-10');
      await createTransaction('food & dining', 150, '2025-06-15');
      await createTransaction('transportation', 50, '2025-06-12');

      const res = await api
        .get(
          '/api/v1/analytics/budget-vs-actual?startDate=2025-06-01&endDate=2025-06-30'
        )
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);

      const food = res.body.data.find(
        (b: { category: string }) => b.category === 'food & dining'
      );
      expect(food.budgeted).toBe(500);
      expect(food.actual).toBe(250);
      expect(food.variance).toBe(250);
    });

    it('should return zero actual when no transactions in range', async () => {
      await createBudget('food & dining', 500);

      const res = await api
        .get(
          '/api/v1/analytics/budget-vs-actual?startDate=2025-06-01&endDate=2025-06-30'
        )
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data[0].actual).toBe(0);
      expect(res.body.data[0].variance).toBe(500);
    });

    it('should work without date filters', async () => {
      await createBudget('food & dining', 500);

      const res = await api
        .get('/api/v1/analytics/budget-vs-actual')
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should reject invalid startDate', async () => {
      const res = await api
        .get('/api/v1/analytics/budget-vs-actual?startDate=not-a-date')
        .set(authHeader());
      expect(res.status).toBe(400);
    });

    it('should reject invalid endDate', async () => {
      const res = await api
        .get('/api/v1/analytics/budget-vs-actual?endDate=bad')
        .set(authHeader());
      expect(res.status).toBe(400);
    });

    it('should return empty when no budgets', async () => {
      const res = await api
        .get('/api/v1/analytics/budget-vs-actual')
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should reject unauthenticated request', async () => {
      const res = await api.get('/api/v1/analytics/budget-vs-actual');
      expect(res.status).toBe(401);
    });
  });
});
