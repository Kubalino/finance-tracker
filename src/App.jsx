import { useEffect, useRef, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Tracking from './pages/Tracking';
import Import from './pages/Import';
import Settings from './pages/Settings';
import { supabase, isSupabaseConfigured } from './db/supabase';
import { wipeLocalData } from './db/reset';
import { pullAll, LAST_SYNCED_KEY } from './db/syncEngine';
import { seedDatabase } from './db/seed';

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
  // strictly separate: logging in discards local demo data and pulls the
  // account's cloud data; logging out discards account data and restores demo data.
  const previousUserId = useRef(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUserId = session?.user?.id ?? null;

      if (previousUserId.current === undefined) {
        previousUserId.current = newUserId;
        return;
      }

      if (newUserId && newUserId !== previousUserId.current) {
        await wipeLocalData();
        localStorage.removeItem(LAST_SYNCED_KEY);
        await pullAll(newUserId, null);
        localStorage.setItem(LAST_SYNCED_KEY, new Date().toISOString());
        previousUserId.current = newUserId;
        window.location.reload();
      } else if (!newUserId && previousUserId.current) {
        await wipeLocalData();
        localStorage.removeItem(LAST_SYNCED_KEY);
        await seedDatabase();
        previousUserId.current = null;
        window.location.reload();
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <AppShell theme={theme} onToggleTheme={toggleTheme}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/import" element={<Import />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  );
}
