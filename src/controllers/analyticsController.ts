import { Response } from 'express';
import Budget from '../models/Budget';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth';

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
    const dateFilter: any = { userId: req.user.userId };

    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) {
        dateFilter.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        dateFilter.date.$lte = new Date(endDate as string);
      }
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
    const actualMap = new Map(actualSpending.map((item: any) => [item._id, item.actual]));

    // Combine budgets with actual spending
    const comparison = budgets.map((budget: any) => {
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
    comparison.sort((a: any, b: any) => a.variance - b.variance);

    res.status(200).json({
      status: 'success',
      data: comparison,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch budget vs actual data',
    });
  }
};
