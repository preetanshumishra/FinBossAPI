import express from 'express';
import { getBudgetVsActual } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/analytics/budget-vs-actual:
 *   get:
 *     summary: Get budget vs actual comparison
 *     description: Returns a comparison of budgeted amounts versus actual spending for each budget category within the specified date range.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date in ISO 8601 format (e.g. 2025-01-01T00:00:00.000Z)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date in ISO 8601 format (e.g. 2025-12-31T23:59:59.999Z)
 *     responses:
 *       200:
 *         description: Budget vs actual comparison data
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
 *                     $ref: '#/components/schemas/BudgetComparison'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/budget-vs-actual', getBudgetVsActual);

export default router;
