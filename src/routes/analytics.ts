import express from 'express';
import { getBudgetVsActual } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

// Budget vs actual comparison
router.get('/budget-vs-actual', getBudgetVsActual);

export default router;
