import { db } from './index';

export async function recordTombstone(table, id) {
  await db.tombstones.put({ id, table, deletedAt: new Date().toISOString() });
}
