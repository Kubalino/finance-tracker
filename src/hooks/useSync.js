import { useCallback, useState } from 'react';
import { syncAll, LAST_SYNCED_KEY } from '../db/syncEngine';

export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(() => localStorage.getItem(LAST_SYNCED_KEY));
  const [error, setError] = useState(null);

  const sync = useCallback(async (userId) => {
    setSyncing(true);
    setError(null);
    try {
      const since = lastSyncedAt;
      const startedAt = new Date().toISOString();
      await syncAll(userId, since);
      localStorage.setItem(LAST_SYNCED_KEY, startedAt);
      setLastSyncedAt(startedAt);
    } catch (err) {
      setError(err.message || 'Sync failed');
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [lastSyncedAt]);

  return { sync, syncing, lastSyncedAt, error };
}
