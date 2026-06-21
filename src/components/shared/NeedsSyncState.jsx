import { Link } from 'react-router-dom';
import { CloudOff } from 'lucide-react';
import Card from './Card';
import styles from './NeedsSyncState.module.css';

export default function NeedsSyncState() {
  return (
    <Card className={styles.card}>
      <CloudOff size={28} className={styles.icon} />
      <p className={styles.text}>No local data yet. If you're signed in, sync your account to pull your data.</p>
      <Link to="/settings" className={styles.link}>Go to Settings</Link>
    </Card>
  );
}
