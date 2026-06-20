import { useEffect } from 'react';
import Card from '../components/shared/Card';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useSettings } from '../hooks/useSettings';
import { useFilters } from '../hooks/useFilters';

export default function Dashboard() {
  const { transactions, loading: txLoading } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  const { settings, loading: settingsLoading } = useSettings();
  const filters = useFilters();

  useEffect(() => {
    if (!txLoading && !catLoading && !settingsLoading) {
      console.log('[useTransactions] sample data:', transactions);
      console.log('[useCategories] sample data:', categories);
      console.log('[useSettings] sample data:', settings);
      console.log('[useFilters] current period:', filters.year, filters.month);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txLoading, catLoading, settingsLoading]);

  return (
    <Card>
      <h2>Dashboard</h2>
      <p>KPIs, breakdowns, and charts will live here.</p>
      <p className="monospace">{transactions.length} sample transactions loaded — check the console.</p>
    </Card>
  );
}
