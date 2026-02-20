import Category from '../models/Category';

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', type: 'expense', icon: '🍽️', color: '#FF6B6B', isDefault: true },
  { name: 'Transportation', type: 'expense', icon: '🚗', color: '#4ECDC4', isDefault: true },
  { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#FFE66D', isDefault: true },
  { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#FF69B4', isDefault: true },
  { name: 'Utilities', type: 'expense', icon: '💡', color: '#95E1D3', isDefault: true },
  { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#FF6F91', isDefault: true },
  { name: 'Education', type: 'expense', icon: '📚', color: '#A8E6CF', isDefault: true },
  { name: 'Travel', type: 'expense', icon: '✈️', color: '#FFD3B6', isDefault: true },
  { name: 'Subscriptions', type: 'expense', icon: '📱', color: '#FFAAA5', isDefault: true },
  { name: 'Salary', type: 'income', icon: '💰', color: '#6BCB77', isDefault: true },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#4D96FF', isDefault: true },
  { name: 'Investment Returns', type: 'income', icon: '📈', color: '#FFD93D', isDefault: true },
  { name: 'Other', type: 'expense', icon: '📌', color: '#999999', isDefault: true },
];

export const seedCategories = async (): Promise<void> => {
  try {
    const ops = DEFAULT_CATEGORIES.map((cat) => ({
      updateOne: {
        filter: { name: cat.name.toLowerCase(), isDefault: true },
        update: { $setOnInsert: { ...cat, name: cat.name.toLowerCase(), userId: null } },
        upsert: true,
      },
    }));

    const result = await Category.bulkWrite(ops);

    if (result.upsertedCount > 0) {
      console.log(`✓ Seeded ${result.upsertedCount} default categories`);
    } else {
      console.log('✓ All default categories already exist');
    }
  } catch (error) {
    console.error('Failed to seed categories:', error instanceof Error ? error.message : error);
    throw error;
  }
};
