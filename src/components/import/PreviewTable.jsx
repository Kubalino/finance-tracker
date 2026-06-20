import Card from '../shared/Card';
import { formatCurrency } from '../../utils/formatters';
import styles from './PreviewTable.module.css';

const TYPES = ['Income', 'Expenses', 'Savings'];

const STATUS_LABEL = {
  new: 'New',
  duplicate: 'Duplicate',
  unmatched: 'Unmatched',
  invalid: 'Invalid',
};

export default function PreviewTable({ rows, onRowChange, byType }) {
  const importableCount = rows.filter((r) => r.status === 'new').length;
  const duplicateCount = rows.filter((r) => r.status === 'duplicate').length;
  const invalidCount = rows.filter((r) => r.status === 'invalid').length;

  return (
    <Card>
      <div className={styles.summary}>
        <span className={styles.summaryItem}><span className={`${styles.dot} ${styles.new}`} />{importableCount} new</span>
        <span className={styles.summaryItem}><span className={`${styles.dot} ${styles.duplicate}`} />{duplicateCount} duplicate</span>
        <span className={styles.summaryItem}><span className={`${styles.dot} ${styles.invalid}`} />{invalidCount} invalid</span>
      </div>

      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Status</th>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={row.status === 'duplicate' || row.status === 'invalid' ? styles.dimmed : ''}>
                <td><span className={`${styles.badge} ${styles[row.status]}`}>{STATUS_LABEL[row.status]}</span></td>
                <td>{row.date || <span className={styles.invalidText}>{row.rawDate}</span>}</td>
                <td className={styles.details}>{row.description}</td>
                <td className="monospace">{Number.isNaN(row.amount) ? row.rawAmount : formatCurrency(row.amount)}</td>
                <td>
                  <select
                    className={styles.select}
                    value={row.type}
                    disabled={row.status === 'invalid' || row.status === 'duplicate'}
                    onChange={(e) => onRowChange(i, { type: e.target.value, category: '' })}
                  >
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td>
                  <select
                    className={styles.select}
                    value={row.category}
                    disabled={row.status === 'invalid' || row.status === 'duplicate'}
                    onChange={(e) => onRowChange(i, { category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {byType(row.type).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
