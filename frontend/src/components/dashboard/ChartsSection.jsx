import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '../ui/chart';

const monthLabelFromKey = (monthKey) => {
  if (!monthKey || !String(monthKey).includes('-')) {
    return monthKey || '';
  }

  const [year, month] = String(monthKey).split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString('en-US', { month: 'short' });
};

const ChartsSection = ({
  expenseCategoryData,
  incomeExpenseTrendData,
  currencyFormatter,
  loading,
  selectedPeriodLabel,
}) => {
  const hasCategoryData = Array.isArray(expenseCategoryData) && expenseCategoryData.length > 0;
  const hasTrendData = Array.isArray(incomeExpenseTrendData) && incomeExpenseTrendData.length > 0;

  const pieData = expenseCategoryData.map((item) => ({
    name: item.category,
    value: Number(item.total || 0),
    color: item.color,
  }));

  const trendLineData = incomeExpenseTrendData.map((item) => ({
    month: monthLabelFromKey(item.monthKey),
    income: Number(item.totalIncome || 0),
    expenses: Number(item.totalExpenses || 0),
  }));

  const chartConfig = {
    income: {
      label: 'Income',
      color: 'var(--color-chart-2)',
    },
    expenses: {
      label: 'Expenses',
      color: 'var(--color-chart-5)',
    },
  };

  return (
    <section className="chart-grid">
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="chart-card"
      >
        <header className="chart-card-header">
          <h2>Expense Breakdown</h2>
          <span>{selectedPeriodLabel || 'Selected Month'}</span>
        </header>
        <div className="chart-body">
          {loading ? (
            <div className="chart-empty">Loading chart...</div>
          ) : hasCategoryData ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={68}
                  outerRadius={95}
                  paddingAngle={2}
                  animationDuration={900}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                  }}
                  labelStyle={{ color: 'var(--color-foreground)' }}
                  formatter={(value) => [currencyFormatter(value), 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No expense categories yet.</div>
          )}
        </div>

        {hasCategoryData && !loading && (
          <ul className="chart-legend">
            {pieData.map((item) => (
              <li key={item.name}>
                <span className="legend-label">
                  <span className="legend-dot" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span>{currencyFormatter(item.value)}</span>
              </li>
            ))}
          </ul>
        )}
      </motion.article>

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="chart-card"
      >
        <header className="chart-card-header">
          <h2>Income vs Expense Overview</h2>
          <span>Up to {selectedPeriodLabel || 'Selected Month'}</span>
        </header>
        <div className="chart-body">
          {loading ? (
            <div className="chart-empty">Loading chart...</div>
          ) : hasTrendData ? (
            <ChartContainer config={chartConfig} className="chart-container">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={trendLineData} barSize={18} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="var(--color-muted-foreground)"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value, name) => [currencyFormatter(value), name === 'income' ? 'Income' : 'Expenses']}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="income" fill="var(--color-income)" radius={4} animationDuration={900} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} animationDuration={900} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="chart-empty">No trend data yet.</div>
          )}
        </div>
      </motion.article>
    </section>
  );
};

export default ChartsSection;
