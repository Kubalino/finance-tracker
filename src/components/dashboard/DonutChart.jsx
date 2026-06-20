import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Card from '../shared/Card';
import ChartTooltip from './ChartTooltip';
import { colorForIndex } from '../../utils/chartColors';
import styles from './DonutChart.module.css';

export default function DonutChart({ title, data }) {
  const hasData = data.length > 0;

  return (
    <Card>
      <h3 className={styles.title}>{title}</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
            >
              {data.map((entry, i) => (
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
