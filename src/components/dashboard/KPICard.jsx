import Card from '../shared/Card';
import styles from './KPICard.module.css';

export default function KPICard({ label, value, tone }) {
  return (
    <Card className={styles.card}>
      <div className={styles.label}>{label}</div>
      <div className={`${styles.value} monospace ${tone ? styles[tone] : ''}`}>{value}</div>
    </Card>
  );
}
