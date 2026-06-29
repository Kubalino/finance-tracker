import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Card from '../shared/Card';
import ChartTooltip from './ChartTooltip';
import { colorForIndex } from '../../utils/chartColors';
import styles from './DonutChart.module.css';

export default function DonutChart({ title, data }) {
  // Negative/zero net category totals (e.g. fully reimbursed) can't be drawn as a pie slice.
  const positiveData = data.filter((d) => d.amount > 0);
  const hasData = positiveData.length > 0;

  return (
    <Card>
      <h3 className={styles.title}>{title}</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={positiveData}
              dataKey="amount"
              nameKey="category"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={positiveData.length > 1 ? 2 : 0}
            >
              {positiveData.map((entry, i) => (
                <Cell key={entry.category} fill={colorForIndex(i)} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--textMuted)' }} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className={styles.empty}>No transactions in this period</div>
      )}
    </Card>
  );
}
