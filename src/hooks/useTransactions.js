import { useCallback, useEffect, useState } from 'react';
import { db } from '../db';
import { computeEffectiveDate } from '../utils/dateUtils';

function uuid() {
  return crypto.randomUUID();
}

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await db.transactions.orderBy('date').toArray();
    setTransactions(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const addTransaction = useCallback(async (tx, settings) => {
    const row = {
      id: uuid(),
      hash: null,
      source: 'manual',
      importBatch: null,
      createdAt: new Date().toISOString(),
      ...tx,
      effectiveDate: tx.effectiveDate ?? computeEffectiveDate(tx.date, tx.type, settings),
    };
    await db.transactions.add(row);
    await refresh();
    return row;
  }, [refresh]);

  const updateTransaction = useCallback(async (id, changes) => {
    await db.transactions.update(id, changes);
    await refresh();
  }, [refresh]);

  const deleteTransaction = useCallback(async (id) => {
    await db.transactions.delete(id);
    await refresh();
  }, [refresh]);

  const byPeriod = useCallback((year, month) => {
    return transactions.filter((tx) => {
      const d = tx.effectiveDate;
      const txYear = Number(d.slice(0, 4));
      const txMonth = Number(d.slice(5, 7));
      return txYear === year && (month === null || txMonth === month);
    });
  }, [transactions]);

  const byType = useCallback((list, type) => list.filter((tx) => tx.type === type), []);

  return {
    transactions,
    loading,
    refresh,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    byPeriod,
    byType,
  };
}
