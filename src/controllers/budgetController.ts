import { Response } from 'express';
import mongoose from 'mongoose';
import Budget from '../models/Budget';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth';

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
      spent: 0,
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
      message: error instanceof Error ? error.message : 'Failed to create budget',
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

    // Calculate spent amount for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await calculateSpentAmount(
          req.user!.userId,
          budget.category,
          budget.period
        );
        return {
          ...budget.toObject(),
          spent,
          remaining: budget.limit - spent,
          percentageUsed: (spent / budget.limit) * 100,
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: budgetsWithSpent,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch budgets',
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
      message: error instanceof Error ? error.message : 'Failed to fetch budget',
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
      message: error instanceof Error ? error.message : 'Failed to update budget',
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
      message: error instanceof Error ? error.message : 'Failed to delete budget',
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

    const budgetStatus = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await calculateSpentAmount(
          req.user!.userId,
          budget.category,
          budget.period
        );
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
      })
    );

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
      message: error instanceof Error ? error.message : 'Failed to fetch budget status',
    });
  }
};

// Helper function to calculate spent amount for a category within period
const calculateSpentAmount = async (
  userId: string,
  category: string,
  period: string
): Promise<number> => {
  const now = new Date();
  let startDate: Date;

  if (period === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    // yearly
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  const expenses = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        category,
        type: 'expense',
        date: { $gte: startDate },
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
