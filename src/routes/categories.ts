import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Optional auth - returns defaults for unauthenticated, defaults + user's own for authenticated
router.get('/', optionalAuth, getCategories);

// Protected routes
router.use(authenticate);

// Create new category
router.post('/', createCategory);

// Update category
router.put('/:id', updateCategory);

// Delete category
router.delete('/:id', deleteCategory);

export default router;
