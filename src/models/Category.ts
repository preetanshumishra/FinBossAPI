import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    icon: {
      type: String,
      required: [true, 'Category icon is required'],
    },
    color: {
      type: String,
      required: [true, 'Category color is required'],
      match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color code'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
  }
);

export default mongoose.model<ICategory>('Category', categorySchema);
