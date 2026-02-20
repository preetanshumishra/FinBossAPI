import express, { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refreshToken, logout, getProfile, updateProfile, changePassword, deleteAccount, savePreferences, getPreferences } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Stricter rate limiting for auth routes: 10 requests per 15 minutes per IP (disabled in test)
const authLimiter: RequestHandler =
  process.env.NODE_ENV === 'test'
    ? (_req, _res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: {
          status: 'error',
          message: 'Too many authentication attempts, please try again later',
        },
      });

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refreshToken);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);
router.delete('/account', authenticate, deleteAccount);
router.get('/preferences', authenticate, getPreferences);
router.post('/preferences', authenticate, savePreferences);

export default router;
