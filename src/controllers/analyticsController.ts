import { Response } from 'express';
import mongoose from 'mongoose';
import Budget from '../models/Budget';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth';
import { getErrorMessage } from '../utils/errorResponse';

export const getBudgetVsActual = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { startDate, endDate } = req.query;

    // Build date filter for transactions
    const dateFilter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(req.user.userId) };

    if (startDate || endDate) {
      const dateRange: Record<string, Date> = {};
      if (startDate) {
        if (isNaN(new Date(startDate as string).getTime())) {
          res.status(400).json({ status: 'error', message: 'Invalid startDate format' });
          return;
        }
        dateRange.$gte = new Date(startDate as string);
      }
      if (endDate) {
        if (isNaN(new Date(endDate as string).getTime())) {
          res.status(400).json({ status: 'error', message: 'Invalid endDate format' });
          return;
        }
        dateRange.$lte = new Date(endDate as string);
      }
      dateFilter.date = dateRange;
    }

    // Get all budgets for user
    const budgets = await Budget.find({ userId: req.user.userId });

    // Get actual spending by category
    const actualSpending = await Transaction.aggregate([
      { $match: { ...dateFilter, type: 'expense' } },
      {
        $group: {
          _id: '$category',
          actual: { $sum: '$amount' },
        },
      },
    ]);

    // Create a map for quick lookup
    const actualMap = new Map(actualSpending.map((item: { _id: string; actual: number }) => [item._id, item.actual]));

    // Combine budgets with actual spending
    const comparison = budgets.map((budget) => {
      const actual = actualMap.get(budget.category) || 0;
      const budgeted = budget.limit;
      const variance = budgeted - actual;
      const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;

      return {
        category: budget.category,
        budgeted: Math.round(budgeted * 100) / 100,
        actual: Math.round(actual * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        variancePercent: Math.round(variancePercent * 100) / 100,
        period: budget.period,
      };
    });

    // Sort by variance (descending - most over budget first)
    comparison.sort((a, b) => a.variance - b.variance);

    res.status(200).json({
      status: 'success',
      data: comparison,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to fetch budget vs actual data'),
    });
  }
};
