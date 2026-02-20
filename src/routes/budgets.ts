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

/**
 * @swagger
 * /api/v1/budgets:
 *   get:
 *     summary: List all budgets
 *     description: Returns all budgets for the authenticated user with computed spent, remaining, and percentageUsed fields. Optionally filter by period.
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [monthly, yearly]
 *         description: Filter budgets by period
 *     responses:
 *       200:
 *         description: Budgets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Budget'
 *                       - type: object
 *                         properties:
 *                           spent:
 *                             type: number
 *                             description: Total spent in this budget's category for the current period
 *                             example: 350.00
 *                           remaining:
 *                             type: number
 *                             description: Remaining amount (limit - spent)
 *                             example: 150.00
 *                           percentageUsed:
 *                             type: number
 *                             description: Percentage of budget used
 *                             example: 70.0
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getBudgets);

/**
 * @swagger
 * /api/v1/budgets/status/overview:
 *   get:
 *     summary: Get budget status overview
 *     description: Returns a status overview for all budgets with alerts for over-budget and near-budget conditions. Results are sorted by status (over > warning > ok).
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Budget status overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                         description: Budget category name
 *                         example: Food & Dining
 *                       limit:
 *                         type: number
 *                         description: Budget limit amount
 *                         example: 500.00
 *                       spent:
 *                         type: number
 *                         description: Total spent in this category for the current period
 *                         example: 450.00
 *                       remaining:
 *                         type: number
 *                         description: Remaining amount (limit - spent)
 *                         example: 50.00
 *                       percentageUsed:
 *                         type: number
 *                         description: Percentage of budget used
 *                         example: 90.0
 *                       period:
 *                         type: string
 *                         enum: [monthly, yearly]
 *                         description: Budget period
 *                         example: monthly
 *                       isOverBudget:
 *                         type: boolean
 *                         description: Whether spending exceeds the budget limit
 *                         example: false
 *                       isNearBudget:
 *                         type: boolean
 *                         description: Whether spending is at or above 80% of the budget limit
 *                         example: true
 *                       status:
 *                         type: string
 *                         enum: [over, warning, ok]
 *                         description: Budget health status
 *                         example: warning
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/status/overview', getBudgetStatus);

/**
 * @swagger
 * /api/v1/budgets:
 *   post:
 *     summary: Create a new budget
 *     description: Creates a new budget for the authenticated user. Only one budget is allowed per category and period combination.
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - limit
 *             properties:
 *               category:
 *                 type: string
 *                 description: Category name for the budget
 *                 example: Food & Dining
 *               limit:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Budget limit amount (must be greater than 0)
 *                 example: 500.00
 *               period:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 default: monthly
 *                 description: Budget period (defaults to monthly)
 *                 example: monthly
 *     responses:
 *       201:
 *         description: Budget created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Budget created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Budget'
 *       400:
 *         description: Bad request - validation error (missing fields or invalid limit)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Budget already exists for this category and period
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createBudget);

/**
 * @swagger
 * /api/v1/budgets/{id}:
 *   get:
 *     summary: Get a single budget
 *     description: Returns a single budget by ID for the authenticated user with computed spent, remaining, and percentageUsed fields.
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Budget ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Budget retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Budget'
 *                     - type: object
 *                       properties:
 *                         spent:
 *                           type: number
 *                           description: Total spent in this budget's category for the current period
 *                           example: 350.00
 *                         remaining:
 *                           type: number
 *                           description: Remaining amount (limit - spent)
 *                           example: 150.00
 *                         percentageUsed:
 *                           type: number
 *                           description: Percentage of budget used
 *                           example: 70.0
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Budget not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getBudget);

/**
 * @swagger
 * /api/v1/budgets/{id}:
 *   put:
 *     summary: Update a budget
 *     description: Updates an existing budget by ID for the authenticated user. Returns the updated budget with computed spent, remaining, and percentageUsed fields.
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Budget ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: number
 *                 minimum: 0.01
 *                 description: New budget limit (must be greater than 0)
 *                 example: 600.00
 *               period:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 description: New budget period
 *                 example: monthly
 *     responses:
 *       200:
 *         description: Budget updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Budget updated successfully
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Budget'
 *                     - type: object
 *                       properties:
 *                         spent:
 *                           type: number
 *                           description: Total spent in this budget's category for the current period
 *                           example: 350.00
 *                         remaining:
 *                           type: number
 *                           description: Remaining amount (limit - spent)
 *                           example: 250.00
 *                         percentageUsed:
 *                           type: number
 *                           description: Percentage of budget used
 *                           example: 58.33
 *       400:
 *         description: Bad request - validation error (invalid limit or period)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Budget not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', updateBudget);

/**
 * @swagger
 * /api/v1/budgets/{id}:
 *   delete:
 *     summary: Delete a budget
 *     description: Deletes a budget by ID for the authenticated user and returns the deleted budget.
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Budget ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Budget deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Budget deleted successfully
 *                 data:
 *                   $ref: '#/components/schemas/Budget'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Budget not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteBudget);

export default router;
