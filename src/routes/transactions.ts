import express from 'express';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
  getTransactionsByCategory,
} from '../controllers/transactionController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All transaction routes require authentication
router.use(authenticate);

// Specific routes must come before parameterized routes
// Get transaction summary (total income, expense, balance)
router.get('/summary', getTransactionSummary);

// Get transactions breakdown by category
router.get('/analytics/category', getTransactionsByCategory);

// List transactions with filters and pagination
router.get('/', getTransactions);

// Create new transaction
router.post('/', createTransaction);

// Parameterized routes come last
// Get single transaction
router.get('/:id', getTransaction);

// Update transaction
router.put('/:id', updateTransaction);

// Delete transaction
router.delete('/:id', deleteTransaction);

export default router;
