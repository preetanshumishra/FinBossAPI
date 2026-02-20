import { Response } from 'express';
import bcryptjs from 'bcryptjs';
import validator from 'validator';
import User from '../models/User';
import Transaction from '../models/Transaction';
import Budget from '../models/Budget';
import Category from '../models/Category';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { getErrorMessage } from '../utils/errorResponse';
import { storeRefreshToken, verifyStoredRefreshToken, removeRefreshToken, removeAllRefreshTokens } from '../utils/tokenStorage';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        status: 'error',
        message: 'Email, password, first name, and last name are required',
      });
      return;
    }

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst || !trimmedLast) {
      res.status(400).json({
        status: 'error',
        message: 'First name and last name cannot be blank',
      });
      return;
    }

    if (trimmedFirst.length > 50 || trimmedLast.length > 50) {
      res.status(400).json({
        status: 'error',
        message: 'First name and last name cannot exceed 50 characters',
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters',
      });
      return;
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid email format',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        status: 'error',
        message: 'Email already registered',
      });
      return;
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: trimmedFirst,
      lastName: trimmedLast,
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.email);
    const refreshToken = generateRefreshToken(user._id.toString(), user.email);

    // Store refresh token hash
    await storeRefreshToken(user._id.toString(), refreshToken);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Registration failed'),
    });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
      return;
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.email);
    const refreshToken = generateRefreshToken(user._id.toString(), user.email);

    // Store refresh token hash
    await storeRefreshToken(user._id.toString(), refreshToken);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Login failed'),
    });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({
        status: 'error',
        message: 'Refresh token is required',
      });
      return;
    }

    // Verify refresh token signature
    const decoded = verifyRefreshToken(token);

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Verify the token hash exists in the DB (not already used/revoked)
    const isStored = await verifyStoredRefreshToken(user._id.toString(), token);
    if (!isStored) {
      // Possible token theft — revoke all sessions for this user
      await removeAllRefreshTokens(user._id.toString());
      res.status(401).json({
        status: 'error',
        message: 'Refresh token has been revoked',
      });
      return;
    }

    // Rotate: remove old token, issue new pair, store new
    await removeRefreshToken(user._id.toString(), token);

    const accessToken = generateAccessToken(user._id.toString(), user.email);
    const newRefreshToken = generateRefreshToken(user._id.toString(), user.email);

    await storeRefreshToken(user._id.toString(), newRefreshToken);

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: getErrorMessage(error, 'Token refresh failed'),
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to fetch profile'),
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { firstName, lastName, email } = req.body;

    // Find user
    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Validate email if being updated
    if (email && email !== user.email) {
      if (!validator.isEmail(email)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid email format',
        });
        return;
      }

      // Check if email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({
          status: 'error',
          message: 'Email already in use',
        });
        return;
      }

      user.email = email.toLowerCase();
    }

    // Update fields
    if (firstName) {
      const trimmed = firstName.trim();
      if (!trimmed || trimmed.length > 50) {
        res.status(400).json({
          status: 'error',
          message: 'First name must be 1-50 characters',
        });
        return;
      }
      user.firstName = trimmed;
    }
    if (lastName) {
      const trimmed = lastName.trim();
      if (!trimmed || trimmed.length > 50) {
        res.status(400).json({
          status: 'error',
          message: 'Last name must be 1-50 characters',
        });
        return;
      }
      user.lastName = trimmed;
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to update profile'),
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required',
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        status: 'error',
        message: 'New password must be at least 8 characters',
      });
      return;
    }

    // Find user and include password
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect',
      });
      return;
    }

    // Hash new password
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(newPassword, salt);

    await user.save();

    // Invalidate all refresh tokens (force re-login on all devices)
    await removeAllRefreshTokens(user._id.toString());

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to change password'),
    });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const userId = req.user.userId;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Invalidate all refresh tokens
    await removeAllRefreshTokens(userId);

    // Delete all user's transactions, budgets, and custom categories (cascade delete)
    await Transaction.deleteMany({ userId });
    await Budget.deleteMany({ userId });
    await Category.deleteMany({ userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      status: 'success',
      message: 'Account deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to delete account'),
    });
  }
};

export const savePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { emailNotifications, budgetAlerts, weeklyReport } = req.body;

    // Validation
    if (emailNotifications === undefined && budgetAlerts === undefined && weeklyReport === undefined) {
      res.status(400).json({
        status: 'error',
        message: 'At least one preference must be provided',
      });
      return;
    }

    // Find user
    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Update preferences
    if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;
    if (budgetAlerts !== undefined) user.preferences.budgetAlerts = budgetAlerts;
    if (weeklyReport !== undefined) user.preferences.weeklyReport = weeklyReport;

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Preferences saved successfully',
      data: {
        emailNotifications: user.preferences.emailNotifications,
        budgetAlerts: user.preferences.budgetAlerts,
        weeklyReport: user.preferences.weeklyReport,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to save preferences'),
    });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({
        status: 'error',
        message: 'Refresh token is required',
      });
      return;
    }

    // Remove the specific refresh token
    await removeRefreshToken(req.user.userId, token);

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Logout failed'),
    });
  }
};

export const getPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    // Find user
    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        emailNotifications: user.preferences.emailNotifications,
        budgetAlerts: user.preferences.budgetAlerts,
        weeklyReport: user.preferences.weeklyReport,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error, 'Failed to fetch preferences'),
    });
  }
};
