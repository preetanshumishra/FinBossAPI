// Set env vars before importing jwt module
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.NODE_ENV = 'test';

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../utils/jwt';

describe('JWT Utilities', () => {
  const userId = '507f1f77bcf86cd799439011';
  const email = 'test@example.com';

  describe('generateAccessToken / verifyAccessToken', () => {
    it('should generate and verify an access token', () => {
      const token = generateAccessToken(userId, email);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(userId);
      expect(decoded.email).toBe(email);
      expect(decoded.type).toBe('access');
    });

    it('should reject an invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow(
        'Invalid or expired access token'
      );
    });
  });

  describe('generateRefreshToken / verifyRefreshToken', () => {
    it('should generate and verify a refresh token', () => {
      const token = generateRefreshToken(userId, email);
      const decoded = verifyRefreshToken(token);

      expect(decoded.userId).toBe(userId);
      expect(decoded.email).toBe(email);
      expect(decoded.type).toBe('refresh');
    });

    it('should reject an invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow(
        'Invalid or expired refresh token'
      );
    });
  });

  describe('cross-type rejection', () => {
    it('should reject a refresh token used as access token', () => {
      const refreshToken = generateRefreshToken(userId, email);
      expect(() => verifyAccessToken(refreshToken)).toThrow();
    });

    it('should reject an access token used as refresh token', () => {
      const accessToken = generateAccessToken(userId, email);
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });
  });
});
