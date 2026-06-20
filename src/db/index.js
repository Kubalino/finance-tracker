import Dexie from 'dexie';

export const db = new Dexie('financeTrackerDB');

db.version(1).stores({
  transactions: 'id, hash, date, effectiveDate, type, category, source, importBatch',
  categories: 'id, type, name, order',
  keywords: 'id, keyword, type, category',
  settings: 'id',
});
