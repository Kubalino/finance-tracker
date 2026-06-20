import styles from './TrackingFilters.module.css';

const TYPES = ['Income', 'Expenses', 'Savings'];

export default function TrackingFilters({ type, onTypeChange, category, onCategoryChange, categoryOptions, dateFrom, dateTo, onDateFromChange, onDateToChange }) {
  return (
    <div className={styles.bar}>
      <select className={styles.select} value={type} onChange={(e) => onTypeChange(e.target.value)}>
        <option value="">All Types</option>
        {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <select className={styles.select} value={category} onChange={(e) => onCategoryChange(e.target.value)} disabled={!categoryOptions.length}>
        <option value="">All Categories</option>
        {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <input
        type="date"
        className={styles.select}
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        aria-label="From date"
      />
      <input
        type="date"
        className={styles.select}
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        aria-label="To date"
      />
    </div>
  );
}
