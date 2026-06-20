import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Card from '../shared/Card';
import ChartTooltip from './ChartTooltip';
import { TYPE_COLORS } from '../../utils/chartColors';
import { MONTH_NAMES } from '../../utils/formatters';
import styles from './MonthlyBarChart.module.css';

export default function MonthlyBarChart({ data }) {
  const chartData = data.map((row) => ({ ...row, name: MONTH_NAMES[row.month - 1].slice(0, 3) }));

  return (
    <Card>
      <h3 className={styles.title}>Monthly Totals</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" stroke="var(--textMuted)" fontSize={11} />
          <YAxis stroke="var(--textMuted)" fontSize={11} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: 'var(--textMuted)' }} />
          <Bar dataKey="Income" fill={TYPE_COLORS.Income} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expenses" fill={TYPE_COLORS.Expenses} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Savings" fill={TYPE_COLORS.Savings} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
