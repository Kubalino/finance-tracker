import { useCallback, useEffect, useState } from 'react';
import { db } from '../db';
import { recordTombstone } from '../db/tombstones';

function uuid() {
  return crypto.randomUUID();
}

export function useKeywords() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await db.keywords.toArray();
    setKeywords(all);
    setLoading(false);
    return all;
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const addKeyword = useCallback(async (keyword, type, category) => {
    const row = { id: uuid(), keyword: keyword.trim().toLowerCase(), type, category, updatedAt: new Date().toISOString() };
    await db.keywords.add(row);
    await refresh();
    return row;
  }, [refresh]);

  const updateKeyword = useCallback(async (id, changes) => {
    await db.keywords.update(id, { ...changes, updatedAt: new Date().toISOString() });
    await refresh();
  }, [refresh]);

  const deleteKeyword = useCallback(async (id) => {
    await db.keywords.delete(id);
    await recordTombstone('keywords', id);
    await refresh();
  }, [refresh]);

  return { keywords, loading, refresh, addKeyword, updateKeyword, deleteKeyword };
}
