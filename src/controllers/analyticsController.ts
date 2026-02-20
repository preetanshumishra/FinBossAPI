import { Response } from 'express';
import mongoose from 'mongoose';
import Budget from '../models/Budget';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth';
import { getErrorMessage } from '../utils/errorResponse';

// Strict ISO 8601 date validation (YYYY-MM-DD or full ISO datetime)
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const isValidDate = (value: string): boolean => {
  if (!ISO_DATE_REGEX.test(value)) return false;
  return !isNaN(new Date(value).getTime());
};

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
        if (!isValidDate(startDate as string)) {
          res.status(400).json({ status: 'error', message: 'Invalid startDate format. Use ISO 8601 (YYYY-MM-DD)' });
          return;
        }
        dateRange.$gte = new Date(startDate as string);
      }
      if (endDate) {
        if (!isValidDate(endDate as string)) {
          res.status(400).json({ status: 'error', message: 'Invalid endDate format. Use ISO 8601 (YYYY-MM-DD)' });
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
