import Dexie from 'dexie';

export const db = new Dexie('financeTrackerDB');

db.version(1).stores({
  transactions: 'id, hash, date, effectiveDate, type, category, source, importBatch',
  categories: 'id, type, name, order',
  keywords: 'id, keyword, type, category',
  settings: 'id',
});

// v2: add updatedAt to every table for last-write-wins sync conflict resolution.
db.version(2).stores({
  transactions: 'id, hash, date, effectiveDate, type, category, source, importBatch, updatedAt',
  categories: 'id, type, name, order, updatedAt',
  keywords: 'id, keyword, type, category, updatedAt',
  settings: 'id, updatedAt',
}).upgrade(async (tx) => {
  const now = new Date().toISOString();
  await Promise.all([
    tx.table('transactions').toCollection().modify((row) => { row.updatedAt = row.updatedAt || row.createdAt || now; }),
    tx.table('categories').toCollection().modify((row) => { row.updatedAt = row.updatedAt || now; }),
    tx.table('keywords').toCollection().modify((row) => { row.updatedAt = row.updatedAt || now; }),
    tx.table('settings').toCollection().modify((row) => { row.updatedAt = row.updatedAt || now; }),
  ]);
});

// v3: tombstones track deletions so they propagate across devices on sync.
db.version(3).stores({
  tombstones: 'id, table, deletedAt',
});
