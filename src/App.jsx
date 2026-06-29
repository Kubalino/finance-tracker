import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import PageLoader from './components/shared/PageLoader';
import { supabase, isSupabaseConfigured } from './db/supabase';
import { wipeLocalData } from './db/reset';
import { pullAll, LAST_SYNCED_KEY } from './db/syncEngine';
import { backupDemoData, restoreDemoData } from './db/demoBackup';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tracking = lazy(() => import('./pages/Tracking'));
const Import = lazy(() => import('./pages/Import'));
const Settings = lazy(() => import('./pages/Settings'));

export default function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  );
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // Demo data (logged out) and a real account's data (logged in) are kept
  // strictly separate. Logging in snapshots local demo data, then discards it
  // and pulls the account's cloud data. Logging out (after AuthPanel has
  // already pushed pending changes, while the session was still valid) wipes
  // account data and restores the demo snapshot.
  const previousUserId = useRef(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id ?? null;

      if (previousUserId.current === undefined) {
        previousUserId.current = newUserId;
        return;
      }

      // Supabase warns against awaiting other Supabase calls directly inside
      // this callback — it can deadlock on the auth client's internal lock.
      // Deferring with setTimeout lets the triggering call finish first.
      if (newUserId && newUserId !== previousUserId.current) {
        previousUserId.current = newUserId;
        setTimeout(async () => {
          await backupDemoData();
          await wipeLocalData();
          localStorage.removeItem(LAST_SYNCED_KEY);
          await pullAll(newUserId, null);
          localStorage.setItem(LAST_SYNCED_KEY, new Date().toISOString());
          window.location.reload();
        }, 0);
      } else if (!newUserId && previousUserId.current) {
        previousUserId.current = null;
        setTimeout(async () => {
          await wipeLocalData();
          localStorage.removeItem(LAST_SYNCED_KEY);
          await restoreDemoData();
          window.location.reload();
        }, 0);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <AppShell theme={theme} onToggleTheme={toggleTheme}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/import" element={<Import />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
