import mongoose from 'mongoose';
import { Response } from 'express';

export const isValidObjectId = (id: string, res: Response): boolean => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ status: 'error', message: 'Invalid ID format' });
    return false;
  }
  return true;
};
