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
  const { user, loading, signUp, signIn, signOut } = useAuth();
  const { sync, syncing, lastSyncedAt, error: syncError } = useSync();
  const showToast = useToast();

  const [mode, setMode] = useState('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      if (mode === 'signUp') {
        await signUp(email, password);
        showToast('Account created — check your email to confirm, then sign in');
      } else {
        await signIn(email, password);
        showToast('Signed in');
      }
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
        <p className={styles.hint}>Sign in to back up your data to the cloud and sync across devices.</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
            minLength={6}
          />
          {authError && <span className={styles.error}>{authError}</span>}
          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryBtn}>
              {mode === 'signUp' ? 'Create Account' : 'Sign In'}
            </button>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => setMode((m) => (m === 'signUp' ? 'signIn' : 'signUp'))}
            >
              {mode === 'signUp' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
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
