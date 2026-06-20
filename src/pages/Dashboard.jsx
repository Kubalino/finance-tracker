import { useMemo } from 'react';
import FilterBar from '../components/shared/FilterBar';
import KPICard from '../components/dashboard/KPICard';
import BreakdownTable from '../components/dashboard/BreakdownTable';
import DonutChart from '../components/dashboard/DonutChart';
import MonthlyBarChart from '../components/dashboard/MonthlyBarChart';
import { useTransactions } from '../hooks/useTransactions';
import { useSettings } from '../hooks/useSettings';
import { useFilters } from '../hooks/useFilters';
import { aggregateByCategory, trackingBalance, savingsRate, totalByType, monthlyTotals } from '../utils/calculations';
import { periodCompletionPercent, getYear } from '../utils/dateUtils';
import { formatCurrency, formatPercent } from '../utils/formatters';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { transactions, byPeriod, loading } = useTransactions();
  const { settings } = useSettings();
  const { year, month, setYear, setMonth } = useFilters();

  const years = useMemo(() => {
    const set = new Set(transactions.map((tx) => getYear(tx.effectiveDate)));
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [transactions]);

  const periodTransactions = useMemo(() => byPeriod(year, month), [byPeriod, year, month]);
  const yearlyMonthlyTotals = useMemo(() => monthlyTotals(transactions, year), [transactions, year]);

  const completion = month ? periodCompletionPercent(year, month) : 100;
  const balance = trackingBalance(periodTransactions);
  const rate = savingsRate(periodTransactions, settings?.savingsRateCalc);
  const income = totalByType(periodTransactions, 'Income');

  if (loading || !settings) return null;

  return (
    <div>
      <FilterBar year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} years={years} />

      <div className={styles.kpiGrid}>
        <KPICard label="Period Completion" value={formatPercent(completion)} />
        <KPICard label="Tracking Balance" value={formatCurrency(balance)} />
        <KPICard label="Savings Rate" value={formatPercent(rate, 1)} tone="savings" />
        <KPICard label="Total Income" value={formatCurrency(income)} tone="income" />
      </div>

      <div className={styles.breakdownGrid}>
        <BreakdownTable title="Income" tone="income" rows={aggregateByCategory(periodTransactions, 'Income')} />
        <BreakdownTable title="Expenses" tone="expenses" rows={aggregateByCategory(periodTransactions, 'Expenses')} />
        <BreakdownTable title="Savings" tone="savings" rows={aggregateByCategory(periodTransactions, 'Savings')} />
      </div>

      <div className={styles.breakdownGrid}>
        <DonutChart title="Income by Category" data={aggregateByCategory(periodTransactions, 'Income')} />
        <DonutChart title="Expenses by Category" data={aggregateByCategory(periodTransactions, 'Expenses')} />
        <DonutChart title="Savings by Category" data={aggregateByCategory(periodTransactions, 'Savings')} />
      </div>

      <MonthlyBarChart data={yearlyMonthlyTotals} />
    </div>
  );
}
