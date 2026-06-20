import Card from '../shared/Card';
import { formatCurrency } from '../../utils/formatters';
import styles from './BreakdownTable.module.css';

export default function BreakdownTable({ title, rows, tone }) {
  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <Card>
      <h3 className={`${styles.title} ${tone ? styles[tone] : ''}`}>{title}</h3>
      <table className={styles.table}>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={2} className={styles.empty}>No transactions in this period</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.category}>
              <td>{row.category}</td>
              <td className="monospace">{formatCurrency(row.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td className="monospace">{formatCurrency(total)}</td>
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}
