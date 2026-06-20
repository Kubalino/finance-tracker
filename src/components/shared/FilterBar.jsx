import { MONTH_NAMES } from '../../utils/formatters';
import styles from './FilterBar.module.css';

export default function FilterBar({ year, month, onYearChange, onMonthChange, years }) {
  return (
    <div className={styles.bar}>
      <select className={styles.select} value={year} onChange={(e) => onYearChange(Number(e.target.value))}>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        className={styles.select}
        value={month ?? 'full'}
        onChange={(e) => onMonthChange(e.target.value === 'full' ? null : Number(e.target.value))}
      >
        <option value="full">Full Year</option>
        {MONTH_NAMES.map((name, i) => (
          <option key={name} value={i + 1}>{name}</option>
        ))}
      </select>
    </div>
  );
}
