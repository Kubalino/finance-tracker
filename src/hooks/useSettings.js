import { useCallback, useEffect, useState } from 'react';
import { db } from '../db';

const SETTINGS_ID = 'app';

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const row = await db.settings.get(SETTINGS_ID);
    setSettings(row);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const updateSettings = useCallback(async (changes) => {
    await db.settings.update(SETTINGS_ID, { ...changes, updatedAt: new Date().toISOString() });
    await refresh();
  }, [refresh]);

  return { settings, loading, refresh, updateSettings };
}
