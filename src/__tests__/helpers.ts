import request from 'supertest';
import app from '../index';

export const api = request(app);

export const registerUser = async (overrides: Record<string, string> = {}) => {
  const userData = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    ...overrides,
  };

  const res = await api.post('/api/v1/auth/register').send(userData);
  return res;
};

export const registerAndGetTokens = async (overrides: Record<string, string> = {}) => {
  const res = await registerUser(overrides);
  if (res.status !== 201) {
    throw new Error(
      `Registration failed with status ${res.status}: ${JSON.stringify(res.body)}`
    );
  }
  return {
    accessToken: res.body.data.accessToken as string,
    refreshToken: res.body.data.refreshToken as string,
    userId: res.body.data.userId as string,
  };
};
