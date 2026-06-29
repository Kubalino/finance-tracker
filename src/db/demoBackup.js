import { db } from './index';
import { seedDatabase } from './seed';

const DEMO_BACKUP_KEY = 'financeTracker.demoBackup';

/** Snapshots the current local tables (demo mode state) to localStorage. */
export async function backupDemoData() {
  const [transactions, categories, keywords, settings] = await Promise.all([
    db.transactions.toArray(),
    db.categories.toArray(),
    db.keywords.toArray(),
    db.settings.toArray(),
  ]);

  localStorage.setItem(DEMO_BACKUP_KEY, JSON.stringify({ transactions, categories, keywords, settings }));
}

/** Restores the last demo snapshot, or falls back to fresh fixture data if none exists yet. */
export async function restoreDemoData() {
  const raw = localStorage.getItem(DEMO_BACKUP_KEY);
  if (!raw) {
    await seedDatabase();
    return;
  }

  const { transactions, categories, keywords, settings } = JSON.parse(raw);
  await db.transaction('rw', db.transactions, db.categories, db.keywords, db.settings, async () => {
    await db.transactions.bulkAdd(transactions);
    await db.categories.bulkAdd(categories);
    await db.keywords.bulkAdd(keywords);
    await db.settings.bulkAdd(settings);
  });
}
