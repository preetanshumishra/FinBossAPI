import { Response } from 'express';
import Category from '../models/Category';
import { AuthRequest } from '../middleware/auth';
import { isValidObjectId } from '../utils/validateObjectId';
import { getErrorMessage } from '../utils/errorResponse';

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.query;

    const filter: Record<string, unknown> = {};

    if (type && ['income', 'expense'].includes(type as string)) {
      filter.type = type;
    }

    if (req.user) {
      filter.$or = [
        { isDefault: true },
        { userId: req.user.userId },
      ];
    } else {
      filter.isDefault = true;
    }

    const categories = await Category.find(filter).sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to fetch categories'),
    });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const { name, type, icon, color } = req.body;

    // Validation
    if (!name || !type || !icon || !color) {
      res.status(400).json({
        status: 'error',
        message: 'Name, type, icon, and color are required',
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

    // Validate hex color
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    if (!hexColorRegex.test(color)) {
      res.status(400).json({
        status: 'error',
        message: 'Color must be a valid hex code (e.g., #FF5733)',
      });
      return;
    }

    const userId = req.user.userId;

    // Check if category already exists for this user or as a default
    const existingCategory = await Category.findOne({
      name: name.toLowerCase(),
      $or: [{ userId }, { isDefault: true }],
    });

    if (existingCategory) {
      res.status(409).json({
        status: 'error',
        message: 'Category already exists',
      });
      return;
    }

    const category = new Category({
      name: name.toLowerCase(),
      type,
      icon,
      color,
      isDefault: false,
      userId,
    });

    await category.save();

    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to create category'),
    });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!isValidObjectId(id, res)) return;

    const { name, icon, color } = req.body;
    const userId = req.user.userId;

    // Only find categories owned by this user
    const category = await Category.findOne({ _id: id, userId });
    if (!category) {
      res.status(404).json({
        status: 'error',
        message: 'Category not found',
      });
      return;
    }

    if (category.isDefault) {
      res.status(403).json({
        status: 'error',
        message: 'Cannot modify default categories',
      });
      return;
    }

    // Validate hex color if provided
    if (color) {
      const hexColorRegex = /^#[0-9A-F]{6}$/i;
      if (!hexColorRegex.test(color)) {
        res.status(400).json({
          status: 'error',
          message: 'Color must be a valid hex code (e.g., #FF5733)',
        });
        return;
      }
      category.color = color;
    }

    // Update name if provided
    if (name) {
      // Check if new name conflicts with user's own or default categories
      const existingCategory = await Category.findOne({
        name: name.toLowerCase(),
        _id: { $ne: id },
        $or: [{ userId }, { isDefault: true }],
      });

      if (existingCategory) {
        res.status(409).json({
          status: 'error',
          message: 'Category name already exists',
        });
        return;
      }
      category.name = name.toLowerCase();
    }

    // Update icon if provided
    if (icon) {
      category.icon = icon;
    }

    await category.save();

    res.status(200).json({
      status: 'success',
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to update category'),
    });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!isValidObjectId(id, res)) return;

    const userId = req.user.userId;

    // Only find categories owned by this user
    const category = await Category.findOne({ _id: id, userId });
    if (!category) {
      res.status(404).json({
        status: 'error',
        message: 'Category not found',
      });
      return;
    }

    if (category.isDefault) {
      res.status(403).json({
        status: 'error',
        message: 'Cannot delete default categories',
      });
      return;
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to delete category'),
    });
  }
};
