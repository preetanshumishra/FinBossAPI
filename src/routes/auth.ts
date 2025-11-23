import express from 'express';
import { register, login, refreshToken, getProfile, updateProfile, changePassword, deleteAccount, savePreferences, getPreferences } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);
router.delete('/account', authenticate, deleteAccount);
router.get('/preferences', authenticate, getPreferences);
router.post('/preferences', authenticate, savePreferences);

export default router;
