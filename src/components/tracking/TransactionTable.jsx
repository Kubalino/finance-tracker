import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Card from '../shared/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { computeRunningBalances } from '../../utils/calculations';
import styles from './TransactionTable.module.css';

const PAGE_SIZE = 15;

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'type', label: 'Type' },
  { key: 'category', label: 'Category' },
  { key: 'amount', label: 'Amount' },
  { key: 'details', label: 'Details' },
  { key: 'effectiveDate', label: 'Effective Date' },
];

export default function TransactionTable({ transactions }) {
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);

  const runningBalances = useMemo(() => computeRunningBalances(transactions), [transactions]);

  const sorted = useMemo(() => {
    const list = [...transactions];
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [transactions, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  };

  return (
    <Card>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key} onClick={() => toggleSort(col.key)}>
                  <span className={styles.th}>
                    {col.label}
                    {sortKey === col.key && (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                  </span>
                </th>
              ))}
              <th className={styles.balanceCol}>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className={styles.empty}>No transactions match the current filters</td>
              </tr>
            )}
            {pageRows.map((tx) => (
              <tr key={tx.id}>
                <td>{formatDate(tx.date)}</td>
                <td><span className={`${styles.badge} ${styles[tx.type.toLowerCase()]}`}>{tx.type}</span></td>
                <td>{tx.category}</td>
                <td className="monospace">{formatCurrency(tx.amount)}</td>
                <td className={styles.details}>{tx.details || '—'}</td>
                <td>{formatDate(tx.effectiveDate)}</td>
                <td className="monospace">{formatCurrency(runningBalances.get(tx.id))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className={styles.pagination}>
          <button disabled={currentPage === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {currentPage + 1} of {pageCount}</span>
          <button disabled={currentPage === pageCount - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </Card>
  );
}
