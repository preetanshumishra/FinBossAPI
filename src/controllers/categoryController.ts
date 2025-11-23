import { Response } from 'express';
import Category from '../models/Category';
import { AuthRequest } from '../middleware/auth';

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.query;

    const filter: any = {};

    if (type && ['income', 'expense'].includes(type as string)) {
      filter.type = type;
    }

    const categories = await Category.find(filter).sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch categories',
    });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, icon, color } = req.body;

    // Validation
    if (!name || !icon || !color) {
      res.status(400).json({
        status: 'error',
        message: 'Name, icon, and color are required',
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

    // Check if category already exists
    const existingCategory = await Category.findOne({
      name: name.toLowerCase(),
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
      icon,
      color,
      isDefault: false,
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
      message: error instanceof Error ? error.message : 'Failed to create category',
    });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, icon, color } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({
        status: 'error',
        message: 'Category not found',
      });
      return;
    }

    // Cannot update default categories
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
      // Check if new name already exists
      const existingCategory = await Category.findOne({
        name: name.toLowerCase(),
        _id: { $ne: id },
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
      message: error instanceof Error ? error.message : 'Failed to update category',
    });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({
        status: 'error',
        message: 'Category not found',
      });
      return;
    }

    // Cannot delete default categories
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
      message: error instanceof Error ? error.message : 'Failed to delete category',
    });
  }
};
