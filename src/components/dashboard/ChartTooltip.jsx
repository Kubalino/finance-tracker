import { formatCurrency } from '../../utils/formatters';
import styles from './ChartTooltip.module.css';

export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.tooltip}>
      {label && <div className={styles.label}>{label}</div>}
      {payload.map((entry) => (
        <div key={entry.name} className={styles.row}>
          <span className={styles.dot} style={{ background: entry.color || entry.payload?.fill }} />
          <span className={styles.name}>{entry.name}</span>
          <span className="monospace">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}
