import { db } from './index';
import { computeEffectiveDate } from '../utils/dateUtils';

export const DEFAULT_CATEGORIES = {
  Income: ['Employment (Net)', 'Side Hustle (Net)', 'Dividends'],
  Expenses: [
    'Housing', 'Utilities', 'Groceries', 'Transportation',
    'Fun & Vacations', 'Clothing', 'Body Care & Medicine', 'Media', 'Insurances',
  ],
  Savings: ['Emergency Fund', 'Retirement Account', 'Stock Portfolio'],
};

const DEFAULT_SETTINGS = {
  id: 'app',
  lateIncomeShift: true,
  lateIncomeStartDay: 20,
  savingsRateCalc: 'allocated',
  theme: 'dark',
};

// Sample/fixture data only — no real financial data, per CLAUDE.md constraints.
const SAMPLE_TRANSACTIONS = [
  // January 2024
  { date: '2024-01-01', type: 'Income', category: 'Employment (Net)', amount: 2800, details: 'Monthly salary' },
  { date: '2024-01-05', type: 'Income', category: 'Side Hustle (Net)', amount: 350, details: 'Freelance design' },
  { date: '2024-01-15', type: 'Income', category: 'Dividends', amount: 60, details: 'ETF dividend payout' },
  { date: '2024-01-02', type: 'Expenses', category: 'Housing', amount: 950, details: 'Rent' },
  { date: '2024-01-03', type: 'Expenses', category: 'Utilities', amount: 110, details: 'Electricity + water' },
  { date: '2024-01-04', type: 'Expenses', category: 'Groceries', amount: 65, details: 'Supermarket run' },
  { date: '2024-01-08', type: 'Expenses', category: 'Groceries', amount: 58, details: 'Supermarket run' },
  { date: '2024-01-10', type: 'Expenses', category: 'Transportation', amount: 45, details: 'Monthly transit pass' },
  { date: '2024-01-12', type: 'Expenses', category: 'Fun & Vacations', amount: 80, details: 'Cinema + dinner' },
  { date: '2024-01-14', type: 'Expenses', category: 'Clothing', amount: 120, details: 'Winter jacket' },
  { date: '2024-01-16', type: 'Expenses', category: 'Body Care & Medicine', amount: 35, details: 'Pharmacy' },
  { date: '2024-01-18', type: 'Expenses', category: 'Media', amount: 25, details: 'Streaming subscriptions' },
  { date: '2024-01-20', type: 'Expenses', category: 'Insurances', amount: 90, details: 'Health insurance' },
  { date: '2024-01-22', type: 'Expenses', category: 'Groceries', amount: 70, details: 'Supermarket run' },
  { date: '2024-01-25', type: 'Expenses', category: 'Fun & Vacations', amount: 150, details: 'Weekend trip' },
  { date: '2024-01-05', type: 'Savings', category: 'Emergency Fund', amount: 300, details: 'Monthly transfer' },
  { date: '2024-01-05', type: 'Savings', category: 'Retirement Account', amount: 250, details: 'Pension contribution' },
  { date: '2024-01-10', type: 'Savings', category: 'Stock Portfolio', amount: 200, details: 'Index fund buy' },

  // February 2024
  { date: '2024-02-01', type: 'Income', category: 'Employment (Net)', amount: 2800, details: 'Monthly salary' },
  { date: '2024-02-07', type: 'Income', category: 'Side Hustle (Net)', amount: 420, details: 'Freelance design' },
  { date: '2024-02-15', type: 'Income', category: 'Dividends', amount: 55, details: 'ETF dividend payout' },
  { date: '2024-02-02', type: 'Expenses', category: 'Housing', amount: 950, details: 'Rent' },
  { date: '2024-02-03', type: 'Expenses', category: 'Utilities', amount: 105, details: 'Electricity + water' },
  { date: '2024-02-05', type: 'Expenses', category: 'Groceries', amount: 62, details: 'Supermarket run' },
  { date: '2024-02-09', type: 'Expenses', category: 'Groceries', amount: 59, details: 'Supermarket run' },
  { date: '2024-02-10', type: 'Expenses', category: 'Transportation', amount: 45, details: 'Monthly transit pass' },
  { date: '2024-02-13', type: 'Expenses', category: 'Fun & Vacations', amount: 95, details: 'Concert tickets' },
  { date: '2024-02-14', type: 'Expenses', category: 'Clothing', amount: 40, details: 'New shoes' },
  { date: '2024-02-16', type: 'Expenses', category: 'Body Care & Medicine', amount: 28, details: 'Pharmacy' },
  { date: '2024-02-18', type: 'Expenses', category: 'Media', amount: 25, details: 'Streaming subscriptions' },
  { date: '2024-02-20', type: 'Expenses', category: 'Insurances', amount: 90, details: 'Health insurance' },
  { date: '2024-02-23', type: 'Expenses', category: 'Groceries', amount: 75, details: 'Supermarket run' },
  { date: '2024-02-27', type: 'Expenses', category: 'Fun & Vacations', amount: 60, details: 'Dinner out' },
  { date: '2024-02-05', type: 'Savings', category: 'Emergency Fund', amount: 300, details: 'Monthly transfer' },
  { date: '2024-02-05', type: 'Savings', category: 'Retirement Account', amount: 250, details: 'Pension contribution' },
  { date: '2024-02-12', type: 'Savings', category: 'Stock Portfolio', amount: 220, details: 'Index fund buy' },

  // March 2024
  { date: '2024-03-01', type: 'Income', category: 'Employment (Net)', amount: 2850, details: 'Monthly salary' },
  { date: '2024-03-06', type: 'Income', category: 'Side Hustle (Net)', amount: 300, details: 'Freelance design' },
  { date: '2024-03-15', type: 'Income', category: 'Dividends', amount: 65, details: 'ETF dividend payout' },
  { date: '2024-03-22', type: 'Income', category: 'Employment (Net)', amount: 150, details: 'Performance bonus' },
  { date: '2024-03-02', type: 'Expenses', category: 'Housing', amount: 950, details: 'Rent' },
  { date: '2024-03-03', type: 'Expenses', category: 'Utilities', amount: 98, details: 'Electricity + water' },
  { date: '2024-03-04', type: 'Expenses', category: 'Groceries', amount: 68, details: 'Supermarket run' },
  { date: '2024-03-08', type: 'Expenses', category: 'Groceries', amount: 61, details: 'Supermarket run' },
  { date: '2024-03-10', type: 'Expenses', category: 'Transportation', amount: 45, details: 'Monthly transit pass' },
  { date: '2024-03-12', type: 'Expenses', category: 'Fun & Vacations', amount: 220, details: 'Weekend getaway' },
  { date: '2024-03-14', type: 'Expenses', category: 'Clothing', amount: 75, details: 'Spring wardrobe' },
  { date: '2024-03-16', type: 'Expenses', category: 'Body Care & Medicine', amount: 40, details: 'Dentist copay' },
  { date: '2024-03-18', type: 'Expenses', category: 'Media', amount: 25, details: 'Streaming subscriptions' },
  { date: '2024-03-20', type: 'Expenses', category: 'Insurances', amount: 90, details: 'Health insurance' },
  { date: '2024-03-23', type: 'Expenses', category: 'Groceries', amount: 72, details: 'Supermarket run' },
  { date: '2024-03-26', type: 'Expenses', category: 'Fun & Vacations', amount: 50, details: 'Dinner out' },
  { date: '2024-03-28', type: 'Expenses', category: 'Transportation', amount: 30, details: 'Car maintenance' },
  { date: '2024-03-05', type: 'Savings', category: 'Emergency Fund', amount: 300, details: 'Monthly transfer' },
  { date: '2024-03-05', type: 'Savings', category: 'Retirement Account', amount: 250, details: 'Pension contribution' },
  { date: '2024-03-12', type: 'Savings', category: 'Stock Portfolio', amount: 240, details: 'Index fund buy' },
  { date: '2024-03-30', type: 'Savings', category: 'Emergency Fund', amount: 100, details: 'Bonus top-up' },
];

const SAMPLE_KEYWORDS = [
  { keyword: 'rent', type: 'Expenses', category: 'Housing' },
  { keyword: 'supermarket', type: 'Expenses', category: 'Groceries' },
  { keyword: 'electric', type: 'Expenses', category: 'Utilities' },
  { keyword: 'transit', type: 'Expenses', category: 'Transportation' },
  { keyword: 'salary', type: 'Income', category: 'Employment (Net)' },
  { keyword: 'dividend', type: 'Income', category: 'Dividends' },
];

function uuid() {
  return crypto.randomUUID();
}

export async function seedDatabase() {
  await db.transaction('rw', db.categories, db.settings, db.transactions, db.keywords, async () => {
    const [categoryCount, settingsCount, txCount, keywordCount] = await Promise.all([
      db.categories.count(),
      db.settings.count(),
      db.transactions.count(),
      db.keywords.count(),
    ]);

    const now = new Date().toISOString();

    if (categoryCount === 0) {
      const categoryRows = Object.entries(DEFAULT_CATEGORIES).flatMap(([type, names]) =>
        names.map((name, order) => ({ id: uuid(), type, name, order, updatedAt: now }))
      );
      await db.categories.bulkAdd(categoryRows);
    }

    if (settingsCount === 0) {
      await db.settings.add({ ...DEFAULT_SETTINGS, updatedAt: now });
    }

    if (txCount === 0) {
      const settings = DEFAULT_SETTINGS;
      const rows = SAMPLE_TRANSACTIONS.map((tx) => ({
        id: uuid(),
        hash: null,
        date: tx.date,
        effectiveDate: computeEffectiveDate(tx.date, tx.type, settings),
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        details: tx.details,
        source: 'manual',
        importBatch: null,
        createdAt: now,
        updatedAt: now,
      }));
      await db.transactions.bulkAdd(rows);
    }

    if (keywordCount === 0) {
      await db.keywords.bulkAdd(SAMPLE_KEYWORDS.map((k) => ({ id: uuid(), ...k, updatedAt: now })));
    }
  });
}
