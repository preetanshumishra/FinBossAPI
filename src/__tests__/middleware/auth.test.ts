process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.NODE_ENV = 'test';

import { Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';

const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
};

const mockNext: NextFunction = jest.fn();

describe('authenticate middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no authorization header is present', () => {
    const req = { headers: {} } as AuthRequest;
    const res = mockResponse();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'No authorization token provided',
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header does not start with Bearer', () => {
    const req = { headers: { authorization: 'Basic abc123' } } as AuthRequest;
    const res = mockResponse();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 for an invalid token', () => {
    const req = {
      headers: { authorization: 'Bearer invalid-token' },
    } as AuthRequest;
    const res = mockResponse();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should set req.user and call next for a valid access token', () => {
    const userId = '507f1f77bcf86cd799439011';
    const email = 'test@example.com';
    const token = generateAccessToken(userId, email);

    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as AuthRequest;
    const res = mockResponse();

    authenticate(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.userId).toBe(userId);
    expect(req.user!.email).toBe(email);
  });

  it('should return 401 when a refresh token is used as access token', () => {
    const userId = '507f1f77bcf86cd799439011';
    const email = 'test@example.com';
    const token = generateRefreshToken(userId, email);

    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as AuthRequest;
    const res = mockResponse();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
