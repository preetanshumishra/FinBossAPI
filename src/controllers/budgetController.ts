import { Response } from 'express';
import mongoose from 'mongoose';
import Budget from '../models/Budget';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth';
import { isValidObjectId } from '../utils/validateObjectId';
import { getErrorMessage } from '../utils/errorResponse';

interface BudgetFilter {
  userId?: mongoose.Types.ObjectId;
  category?: string;
  period?: 'monthly' | 'yearly';
}

export const createBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { category, limit, period } = req.body;

    // Validation
    if (!category || !limit) {
      res.status(400).json({
        status: 'error',
        message: 'Category and limit are required',
      });
      return;
    }

    if (limit <= 0) {
      res.status(400).json({
        status: 'error',
        message: 'Budget limit must be greater than 0',
      });
      return;
    }

    if (period && !['monthly', 'yearly'].includes(period)) {
      res.status(400).json({
        status: 'error',
        message: 'Period must be either "monthly" or "yearly"',
      });
      return;
    }

    // Check if budget already exists for this category and period
    const existingBudget = await Budget.findOne({
      userId: req.user.userId,
      category,
      period: period || 'monthly',
    });

    if (existingBudget) {
      res.status(409).json({
        status: 'error',
        message: `Budget already exists for ${category} in ${period || 'monthly'} period`,
      });
      return;
    }

    const budget = new Budget({
      userId: req.user.userId,
      category,
      limit,
      period: period || 'monthly',
    });

    await budget.save();

    res.status(201).json({
      status: 'success',
      message: 'Budget created successfully',
      data: budget,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to create budget'),
    });
  }
};

export const getBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { period } = req.query;

    const filter: BudgetFilter = { userId: new mongoose.Types.ObjectId(req.user.userId) };

    if (period && typeof period === 'string' && ['monthly', 'yearly'].includes(period)) {
      filter.period = period as 'monthly' | 'yearly';
    }

    const budgets = await Budget.find(filter).sort({ category: 1 });

    // Single aggregate to get all spent amounts instead of N+1 queries
    const spentByCategory = await getSpentByCategory(req.user!.userId, budgets);

    const budgetsWithSpent = budgets.map((budget) => {
      const spent = spentByCategory.get(budgetSpentKey(budget.category, budget.period)) || 0;
      return {
        ...budget.toObject(),
        spent,
        remaining: budget.limit - spent,
        percentageUsed: (spent / budget.limit) * 100,
      };
    });

    res.status(200).json({
      status: 'success',
      data: budgetsWithSpent,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to fetch budgets'),
    });
  }
};

export const getBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { id } = req.params;
    if (!isValidObjectId(id, res)) return;

    const budget = await Budget.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!budget) {
      res.status(404).json({
        status: 'error',
        message: 'Budget not found',
      });
      return;
    }

    const spent = await calculateSpentAmount(
      req.user.userId,
      budget.category,
      budget.period
    );

    res.status(200).json({
      status: 'success',
      data: {
        ...budget.toObject(),
        spent,
        remaining: budget.limit - spent,
        percentageUsed: (spent / budget.limit) * 100,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to fetch budget'),
    });
  }
};

export const updateBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { id } = req.params;
    if (!isValidObjectId(id, res)) return;

    const { limit, period } = req.body;

    const budget = await Budget.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!budget) {
      res.status(404).json({
        status: 'error',
        message: 'Budget not found',
      });
      return;
    }

    if (limit !== undefined) {
      if (limit <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Budget limit must be greater than 0',
        });
        return;
      }
      budget.limit = limit;
    }

    if (period !== undefined) {
      if (!['monthly', 'yearly'].includes(period)) {
        res.status(400).json({
          status: 'error',
          message: 'Period must be either "monthly" or "yearly"',
        });
        return;
      }
      budget.period = period;
    }

    await budget.save();

    const spent = await calculateSpentAmount(
      req.user.userId,
      budget.category,
      budget.period
    );

    res.status(200).json({
      status: 'success',
      message: 'Budget updated successfully',
      data: {
        ...budget.toObject(),
        spent,
        remaining: budget.limit - spent,
        percentageUsed: (spent / budget.limit) * 100,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to update budget'),
    });
  }
};

export const deleteBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { id } = req.params;
    if (!isValidObjectId(id, res)) return;

    const budget = await Budget.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!budget) {
      res.status(404).json({
        status: 'error',
        message: 'Budget not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Budget deleted successfully',
      data: budget,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to delete budget'),
    });
  }
};

export const getBudgetStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const budgets = await Budget.find({ userId: req.user.userId });

    // Single aggregate to get all spent amounts instead of N+1 queries
    const spentByCategory = await getSpentByCategory(req.user!.userId, budgets);

    const budgetStatus = budgets.map((budget) => {
      const spent = spentByCategory.get(budgetSpentKey(budget.category, budget.period)) || 0;
      const isOverBudget = spent > budget.limit;
      const isNearBudget = spent > budget.limit * 0.8; // 80% or more

      return {
        category: budget.category,
        limit: budget.limit,
        spent,
        remaining: budget.limit - spent,
        percentageUsed: (spent / budget.limit) * 100,
        period: budget.period,
        isOverBudget,
        isNearBudget,
        status: isOverBudget ? 'over' : isNearBudget ? 'warning' : 'ok',
      };
    });

    // Sort by status: over > warning > ok
    const statusOrder = { over: 0, warning: 1, ok: 2 };
    budgetStatus.sort((a, b) => statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]);

    res.status(200).json({
      status: 'success',
      data: budgetStatus,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to fetch budget status'),
    });
  }
};

const getPeriodStart = (period: string): Date => {
  const now = new Date();
  if (period === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(now.getFullYear(), 0, 1);
};

const budgetSpentKey = (category: string, period: string): string => `${category}::${period}`;

// Batch query: get spent amounts for all budgets in at most 2 aggregates (monthly + yearly)
const getSpentByCategory = async (
  userId: string,
  budgets: { category: string; period: string }[]
): Promise<Map<string, number>> => {
  const result = new Map<string, number>();
  const periods = [...new Set(budgets.map((b) => b.period))];

  const aggregates = periods.map(async (period) => {
    const periodStart = getPeriodStart(period);
    const categories = budgets.filter((b) => b.period === period).map((b) => b.category);

    const expenses = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          category: { $in: categories },
          type: 'expense',
          date: { $gte: periodStart },
        },
      },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);

    for (const row of expenses) {
      result.set(budgetSpentKey(row._id, period), row.total);
    }
  });

  await Promise.all(aggregates);
  return result;
};

// Helper function to calculate spent amount for a single budget (used by getBudget/updateBudget)
const calculateSpentAmount = async (
  userId: string,
  category: string,
  period: string
): Promise<number> => {
  const periodStart = getPeriodStart(period);

  const expenses = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        category,
        type: 'expense',
        date: { $gte: periodStart },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  return expenses[0]?.total || 0;
};
