import { Response } from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth';

interface TransactionFilter {
  userId: mongoose.Types.ObjectId;
  type?: 'income' | 'expense';
  category?: string;
  date?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { type, amount, category, description, date } = req.body;

    // Validation
    if (!type || !amount || !category) {
      res.status(400).json({
        status: 'error',
        message: 'Type, amount, and category are required',
      });
      return;
    }

    if (!['income', 'expense'].includes(type)) {
      res.status(400).json({
        status: 'error',
        message: 'Type must be either "income" or "expense"',
      });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({
        status: 'error',
        message: 'Amount must be greater than 0',
      });
      return;
    }

    const transaction = new Transaction({
      userId: req.user.userId,
      type,
      amount,
      category,
      description,
      date: date ? new Date(date) : new Date(),
    });

    await transaction.save();

    res.status(201).json({
      status: 'success',
      message: 'Transaction created successfully',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to create transaction',
    });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { type, category, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Build filter
    const filter: TransactionFilter = { userId: new mongoose.Types.ObjectId(req.user.userId) };

    if (type && typeof type === 'string' && ['income', 'expense'].includes(type)) {
      filter.type = type as 'income' | 'expense';
    }

    if (category && typeof category === 'string') {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate as string);
      }
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ date: -1 }).skip(skip).limit(limitNum),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        transactions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch transactions',
    });
  }
};

export const getTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { id } = req.params;

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!transaction) {
      res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch transaction',
    });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { id } = req.params;
    const { type, amount, category, description, date } = req.body;

    // Find transaction first
    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!transaction) {
      res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
      return;
    }

    // Update fields
    if (type) {
      if (!['income', 'expense'].includes(type)) {
        res.status(400).json({
          status: 'error',
          message: 'Type must be either "income" or "expense"',
        });
        return;
      }
      transaction.type = type;
    }

    if (amount !== undefined) {
      if (amount <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Amount must be greater than 0',
        });
        return;
      }
      transaction.amount = amount;
    }

    if (category) {
      transaction.category = category;
    }

    if (description !== undefined) {
      transaction.description = description;
    }

    if (date) {
      transaction.date = new Date(date);
    }

    await transaction.save();

    res.status(200).json({
      status: 'success',
      message: 'Transaction updated successfully',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update transaction',
    });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { id } = req.params;

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!transaction) {
      res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Transaction deleted successfully',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to delete transaction',
    });
  }
};

export const getTransactionSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { startDate, endDate } = req.query;

    const filter: any = { userId: req.user.userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate as string);
      }
    }

    const [income, expense] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...filter, type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { ...filter, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalIncome = income[0]?.total || 0;
    const totalExpense = expense[0]?.total || 0;
    const balance = totalIncome - totalExpense;

    res.status(200).json({
      status: 'success',
      data: {
        income: totalIncome,
        expense: totalExpense,
        balance,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch summary',
    });
  }
};

export const getTransactionsByCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { startDate, endDate } = req.query;

    const filter: any = { userId: req.user.userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate as string);
      }
    }

    const byCategory = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          type: { $first: '$type' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({
      status: 'success',
      data: byCategory,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch category breakdown',
    });
  }
};
