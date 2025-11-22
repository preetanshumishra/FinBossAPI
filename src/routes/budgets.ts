import express from 'express';
import {
  createBudget,
  getBudgets,
  getBudget,
  updateBudget,
  deleteBudget,
  getBudgetStatus,
} from '../controllers/budgetController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All budget routes require authentication
router.use(authenticate);

// Get all budgets with optional period filter
router.get('/', getBudgets);

// Get budget status overview (with alerts for over/near budget)
router.get('/status/overview', getBudgetStatus);

// Create new budget
router.post('/', createBudget);

// Get single budget details
router.get('/:id', getBudget);

// Update budget
router.put('/:id', updateBudget);

// Delete budget
router.delete('/:id', deleteBudget);

export default router;
