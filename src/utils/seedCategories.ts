import Category from '../models/Category';

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B', isDefault: true },
  { name: 'Transportation', icon: '🚗', color: '#4ECDC4', isDefault: true },
  { name: 'Entertainment', icon: '🎬', color: '#FFE66D', isDefault: true },
  { name: 'Shopping', icon: '🛍️', color: '#FF69B4', isDefault: true },
  { name: 'Utilities', icon: '💡', color: '#95E1D3', isDefault: true },
  { name: 'Healthcare', icon: '🏥', color: '#FF6F91', isDefault: true },
  { name: 'Education', icon: '📚', color: '#A8E6CF', isDefault: true },
  { name: 'Travel', icon: '✈️', color: '#FFD3B6', isDefault: true },
  { name: 'Subscriptions', icon: '📱', color: '#FFAAA5', isDefault: true },
  { name: 'Salary', icon: '💰', color: '#6BCB77', isDefault: true },
  { name: 'Freelance', icon: '💻', color: '#4D96FF', isDefault: true },
  { name: 'Investment Returns', icon: '📈', color: '#FFD93D', isDefault: true },
  { name: 'Other', icon: '📌', color: '#999999', isDefault: true },
];

export const seedCategories = async (): Promise<void> => {
  try {
    // Check if categories already exist
    const existingCount = await Category.countDocuments();

    if (existingCount > 0) {
      console.log('✓ Categories already seeded, skipping...');
      return;
    }

    // Insert default categories
    await Category.insertMany(DEFAULT_CATEGORIES);
    console.log(`✓ Successfully seeded ${DEFAULT_CATEGORIES.length} default categories`);
  } catch (error) {
    console.error('Failed to seed categories:', error instanceof Error ? error.message : error);
    throw error;
  }
};
