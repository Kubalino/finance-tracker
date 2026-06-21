import { db } from './index';

/** Wipes every local table. Used when switching between demo mode and an authenticated account. */
export async function wipeLocalData() {
  await db.transaction('rw', db.transactions, db.categories, db.keywords, db.settings, db.tombstones, async () => {
    await db.transactions.clear();
    await db.categories.clear();
    await db.keywords.clear();
    await db.settings.clear();
    await db.tombstones.clear();
  });
}
