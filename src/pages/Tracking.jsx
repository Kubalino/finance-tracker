import { useMemo, useState } from 'react';
import KPICard from '../components/dashboard/KPICard';
import TrackingFilters from '../components/tracking/TrackingFilters';
import TransactionTable from '../components/tracking/TransactionTable';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { trackingBalance } from '../utils/calculations';
import { formatCurrency, formatDate } from '../utils/formatters';
import styles from './Tracking.module.css';

export default function Tracking() {
  const { transactions, loading } = useTransactions();
  const { byType } = useCategories();

  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleTypeChange = (value) => {
    setType(value);
    setCategory('');
  };

  const categoryOptions = useMemo(
    () => (type ? byType(type).map((c) => c.name) : []),
    [type, byType]
  );

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (type && tx.type !== type) return false;
      if (category && tx.category !== category) return false;
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo && tx.date > dateTo) return false;
      return true;
    });
  }, [transactions, type, category, dateFrom, dateTo]);

  const currentYear = new Date().getFullYear();
  const entriesThisYear = transactions.filter((tx) => tx.date.slice(0, 4) === String(currentYear)).length;
  const lastEntryDate = transactions.length
    ? transactions.reduce((latest, tx) => (tx.date > latest ? tx.date : latest), transactions[0].date)
    : null;
  const balance = trackingBalance(transactions);

  if (loading) return null;

  return (
    <div>
      <div className={styles.kpiGrid}>
        <KPICard label="Last Entry" value={lastEntryDate ? formatDate(lastEntryDate) : '—'} />
        <KPICard label="Total Entries" value={`${transactions.length} (${entriesThisYear} this year)`} />
        <KPICard label="Running Balance" value={formatCurrency(balance)} />
      </div>

      <TrackingFilters
        type={type}
        onTypeChange={handleTypeChange}
        category={category}
        onCategoryChange={setCategory}
        categoryOptions={categoryOptions}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      <TransactionTable transactions={filtered} />
    </div>
  );
}
