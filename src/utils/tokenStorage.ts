import User from '../models/User';
import { sha256 } from './hash';

const MAX_SESSIONS = 5;

export const storeRefreshToken = async (userId: string, rawToken: string): Promise<void> => {
  const tokenHash = sha256(rawToken);
  const user = await User.findById(userId).select('+refreshTokens');
  if (!user) return;

  user.refreshTokens.push({ tokenHash, createdAt: new Date() });

  // Evict oldest if over the session cap
  if (user.refreshTokens.length > MAX_SESSIONS) {
    user.refreshTokens = user.refreshTokens
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, MAX_SESSIONS);
  }

  await user.save();
};

export const verifyStoredRefreshToken = async (userId: string, rawToken: string): Promise<boolean> => {
  const tokenHash = sha256(rawToken);
  const user = await User.findById(userId).select('+refreshTokens');
  if (!user) return false;
  return user.refreshTokens.some((entry) => entry.tokenHash === tokenHash);
};

export const removeRefreshToken = async (userId: string, rawToken: string): Promise<void> => {
  const tokenHash = sha256(rawToken);
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: { tokenHash } },
  });
};

export const removeAllRefreshTokens = async (userId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    $set: { refreshTokens: [] },
  });
};
