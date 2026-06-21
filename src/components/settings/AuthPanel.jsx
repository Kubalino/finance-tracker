import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Card from '../shared/Card';
import { useAuth } from '../../hooks/useAuth';
import { useSync } from '../../hooks/useSync';
import { useToast } from '../../hooks/useToast';
import { isSupabaseConfigured } from '../../db/supabase';
import { formatDate } from '../../utils/formatters';
import styles from './AuthPanel.module.css';

export default function AuthPanel({ onDataChanged }) {
  const { user, loading, sendMagicLink, signOut } = useAuth();
  const { sync, syncing, lastSyncedAt, error: syncError } = useSync();
  const showToast = useToast();

  const [email, setEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [authError, setAuthError] = useState('');

  if (!isSupabaseConfigured) {
    return (
      <Card>
        <h3 className={styles.title}>Cloud Sync</h3>
        <p className={styles.hint}>Cloud sync isn't configured yet. All data stays local to this browser.</p>
      </Card>
    );
  }

  if (loading) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await sendMagicLink(email);
      setLinkSent(true);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleSync = async () => {
    try {
      await sync(user.id);
      showToast('Sync complete');
      onDataChanged();
    } catch {
      showToast(syncError || 'Sync failed', 'error');
    }
  };

  if (!user) {
    return (
      <Card>
        <h3 className={styles.title}>Cloud Sync</h3>
        <p className={styles.hint}>Sign in with your email to back up your data to the cloud and sync across devices.</p>
        {linkSent ? (
          <p className={styles.sentMessage}>Check <strong>{email}</strong> for a sign-in link.</p>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
            {authError && <span className={styles.error}>{authError}</span>}
            <button type="submit" className={styles.primaryBtn}>Send Magic Link</button>
          </form>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <h3 className={styles.title}>Cloud Sync</h3>
      <div className={styles.statusRow}>
        <div>
          <div className={styles.label}>{user.email}</div>
          <div className={styles.hint}>
            {lastSyncedAt ? `Last synced ${formatDate(lastSyncedAt.slice(0, 10))}` : 'Never synced'}
          </div>
        </div>
        <button className={styles.signOutBtn} onClick={signOut}>Sign Out</button>
      </div>
      <button className={styles.syncBtn} onClick={handleSync} disabled={syncing}>
        <RefreshCw size={15} className={syncing ? styles.spinning : ''} />
        {syncing ? 'Syncing…' : 'Sync Now'}
      </button>
    </Card>
  );
}
