import { useCallback, useEffect, useState } from 'react';
import { db } from '../db';

function uuid() {
  return crypto.randomUUID();
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await db.categories.orderBy('order').toArray();
    setCategories(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const byType = useCallback(
    (type) => categories.filter((c) => c.type === type).sort((a, b) => a.order - b.order),
    [categories]
  );

  const addCategory = useCallback(async (type, name) => {
    const maxOrder = categories.filter((c) => c.type === type).reduce((max, c) => Math.max(max, c.order), -1);
    const row = { id: uuid(), type, name, order: maxOrder + 1 };
    await db.categories.add(row);
    await refresh();
    return row;
  }, [categories, refresh]);

  const renameCategory = useCallback(async (id, name) => {
    await db.categories.update(id, { name });
    await refresh();
  }, [refresh]);

  const reorderCategory = useCallback(async (id, order) => {
    await db.categories.update(id, { order });
    await refresh();
  }, [refresh]);

  const deleteCategory = useCallback(async (id) => {
    await db.categories.delete(id);
    await refresh();
  }, [refresh]);

  return { categories, loading, refresh, byType, addCategory, renameCategory, reorderCategory, deleteCategory };
}
