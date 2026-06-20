import { useCallback, useState } from 'react';
import { db } from '../db';
import { supabase } from '../db/supabase';
import {
  transactionToRemote, transactionFromRemote,
  categoryToRemote, categoryFromRemote,
  keywordToRemote, keywordFromRemote,
  settingsToRemote, settingsFromRemote,
} from '../utils/syncMapping';

const LAST_SYNCED_KEY = 'financeTracker.lastSyncedAt';

const TABLES = [
  { local: 'transactions', remote: 'transactions', toRemote: transactionToRemote, fromRemote: transactionFromRemote },
  { local: 'categories', remote: 'categories', toRemote: categoryToRemote, fromRemote: categoryFromRemote },
  { local: 'keywords', remote: 'keywords', toRemote: keywordToRemote, fromRemote: keywordFromRemote },
  { local: 'settings', remote: 'settings', toRemote: settingsToRemote, fromRemote: settingsFromRemote },
];

export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(() => localStorage.getItem(LAST_SYNCED_KEY));
  const [error, setError] = useState(null);

  const push = useCallback(async (userId, since) => {
    for (const { local, remote, toRemote } of TABLES) {
      let collection = db[local].toCollection();
      if (since) collection = db[local].filter((row) => row.updatedAt > since);
      const rows = await collection.toArray();
      if (rows.length === 0) continue;

      const { error: upsertError } = await supabase.from(remote).upsert(rows.map((r) => toRemote(r, userId)));
      if (upsertError) throw upsertError;
    }

    let tombstoneQuery = db.tombstones.toCollection();
    if (since) tombstoneQuery = db.tombstones.filter((t) => t.deletedAt > since);
    const tombstones = await tombstoneQuery.toArray();

    for (const tomb of tombstones) {
      const remoteTable = TABLES.find((t) => t.local === tomb.table)?.remote;
      if (!remoteTable) continue;
      await supabase.from(remoteTable).delete().eq('id', tomb.id);
      await supabase.from('tombstones').upsert({ id: tomb.id, user_id: userId, table_name: tomb.table, deleted_at: tomb.deletedAt });
    }
  }, []);

  const pull = useCallback(async (userId, since) => {
    for (const { local, remote, fromRemote } of TABLES) {
      let query = supabase.from(remote).select('*').eq('user_id', userId);
      if (since) query = query.gt('updated_at', since);
      const { data, error: selectError } = await query;
      if (selectError) throw selectError;

      for (const remoteRow of data) {
        const mapped = fromRemote(remoteRow);
        const existing = await db[local].get(mapped.id);
        if (!existing || mapped.updatedAt > existing.updatedAt) {
          await db[local].put(mapped);
        }
      }
    }

    let tombstoneQuery = supabase.from('tombstones').select('*').eq('user_id', userId);
    if (since) tombstoneQuery = tombstoneQuery.gt('deleted_at', since);
    const { data: tombstones, error: tombError } = await tombstoneQuery;
    if (tombError) throw tombError;

    for (const tomb of tombstones) {
      await db[tomb.table_name].delete(tomb.id);
      await db.tombstones.put({ id: tomb.id, table: tomb.table_name, deletedAt: tomb.deleted_at });
    }
  }, []);

  const sync = useCallback(async (userId) => {
    setSyncing(true);
    setError(null);
    try {
      const since = lastSyncedAt;
      const startedAt = new Date().toISOString();
      await push(userId, since);
      await pull(userId, since);
      localStorage.setItem(LAST_SYNCED_KEY, startedAt);
      setLastSyncedAt(startedAt);
    } catch (err) {
      setError(err.message || 'Sync failed');
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [lastSyncedAt, push, pull]);

  return { sync, syncing, lastSyncedAt, error };
}
