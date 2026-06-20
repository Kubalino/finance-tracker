import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Tracking from './pages/Tracking';
import Import from './pages/Import';
import Settings from './pages/Settings';

export default function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

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
