import mongoose, { Schema, Document } from 'mongoose';
import bcryptjs from 'bcryptjs';
import validator from 'validator';

export interface IPreferences {
  emailNotifications: boolean;
  budgetAlerts: boolean;
  weeklyReport: boolean;
}

export interface IRefreshTokenEntry {
  tokenHash: string;
  createdAt: Date;
}

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  preferences: IPreferences;
  refreshTokens: IRefreshTokenEntry[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    refreshTokens: {
      type: [
        {
          tokenHash: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    preferences: {
      type: {
        emailNotifications: {
          type: Boolean,
          default: true,
        },
        budgetAlerts: {
          type: Boolean,
          default: true,
        },
        weeklyReport: {
          type: Boolean,
          default: false,
        },
      },
      default: () => ({
        emailNotifications: true,
        budgetAlerts: true,
        weeklyReport: false,
      }),
    },
  },
  {
    timestamps: true,
  }
);

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcryptjs.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
