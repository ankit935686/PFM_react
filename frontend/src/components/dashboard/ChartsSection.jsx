import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '../ui/chart';

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
  const totalExpense = pieData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const topCategory = pieData.length
    ? pieData.reduce((max, item) => (item.value > max.value ? item : max), pieData[0])
    : null;
  const categoryRows = pieData
    .map((item) => ({
      ...item,
      percentage: totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const expenseChartConfig = pieData.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.color };
    return acc;
  }, {});

  const trendLineData = incomeExpenseTrendData.map((item) => ({
    month: monthLabelFromKey(item.monthKey),
    income: Number(item.totalIncome || 0),
    expenses: Number(item.totalExpenses || 0),
    cashflow: Number(item.totalIncome || 0) - Number(item.totalExpenses || 0),
  }));
  const latestTrend = trendLineData[trendLineData.length - 1] || { income: 0, expenses: 0, cashflow: 0 };
  const avgCashflow = trendLineData.length
    ? trendLineData.reduce((sum, item) => sum + Number(item.cashflow || 0), 0) / trendLineData.length
    : 0;

  const chartConfig = {
    income: { label: 'Income', color: '#6EC6E6' },
    expenses: { label: 'Expenses', color: '#F472B6' },
  };

  return (
    <section className="chart-grid dashboard-chart-grid">
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="!font-[Nunito] rounded-xl border border-[#E8EAF6] bg-white p-3 shadow-[0_8px_24px_-20px_rgba(30,30,45,0.2)]"
      >
        <header className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[#1E1E2D]">Expense Breakdown</h2>
          <span className="rounded-md border border-[#E8EAF6] bg-[#F8F9FF] px-2 py-1 text-[10px] font-medium text-[#9CA3AF]">{selectedPeriodLabel || 'Selected Month'}</span>
        </header>
        <div className="chart-body chart-body-expense">
          {loading ? (
            <div className="chart-empty">Loading chart...</div>
          ) : hasCategoryData ? (
            <div className="expense-breakdown-compact expense-breakdown-donut">
              <ChartContainer config={expenseChartConfig} className="expense-donut-chart">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius="80%"
                      strokeWidth={5}
                      paddingAngle={2}
                      animationDuration={900}
                      cornerRadius={10}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="expense-donut-label-total"
                                >
                                  {currencyFormatter(totalExpense)}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 22}
                                  className="expense-donut-label-caption"
                                >
                                  Total
                                </tspan>
                              </text>
                            );
                          }
                          return null;
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>

              <div className="expense-breakdown-legend">
                <ul className="expense-legend-list">
                  {categoryRows.map((item) => (
                    <li key={item.name} title={item.name} className="rounded-md px-1 py-0.5 hover:bg-[#F8F9FF]">
                      <span className="legend-chip-dot" style={{ backgroundColor: item.color }} />
                      <span className="legend-item-name text-[10px] text-[#6B7280]">{item.name}</span>
                      <strong className="legend-item-value text-[10px] text-[#1E1E2D]">{currencyFormatter(item.value)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="chart-empty">No expense categories yet.</div>
          )}
        </div>
      </motion.article>

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="!font-[Nunito] rounded-xl border border-[#E8EAF6] bg-white p-3 shadow-[0_8px_24px_-20px_rgba(30,30,45,0.2)]"
      >
        <header className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[#1E1E2D]">Income vs Expense Overview</h2>
          <span className="rounded-md border border-[#E8EAF6] bg-[#F8F9FF] px-2 py-1 text-[10px] font-medium text-[#9CA3AF]">Up to {selectedPeriodLabel || 'Selected Month'}</span>
        </header>
        <div className="trend-summary-strip mb-2 grid grid-cols-3 gap-2">
          <div className="trend-summary-item rounded-lg border border-[#E8EAF6] bg-[#F8F9FF] p-2">
            <span className="text-[10px] text-[#9CA3AF]">Latest income</span>
            <strong className="block text-[11px] font-semibold text-[#1E1E2D]">{currencyFormatter(latestTrend.income)}</strong>
          </div>
          <div className="trend-summary-item rounded-lg border border-[#E8EAF6] bg-[#F8F9FF] p-2">
            <span className="text-[10px] text-[#9CA3AF]">Latest expense</span>
            <strong className="block text-[11px] font-semibold text-[#1E1E2D]">{currencyFormatter(latestTrend.expenses)}</strong>
          </div>
          <div className="trend-summary-item rounded-lg border border-[#E8EAF6] bg-[#F8F9FF] p-2">
            <span className="text-[10px] text-[#9CA3AF]">Avg cashflow</span>
            <strong className="block text-[11px] font-semibold text-[#1E1E2D]">{currencyFormatter(avgCashflow)}</strong>
          </div>
        </div>
        <div className="chart-body chart-body-trend">
          {loading ? (
            <div className="chart-empty">Loading chart...</div>
          ) : hasTrendData ? (
            <ChartContainer config={chartConfig} className="chart-container">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={trendLineData} barGap={4} barCategoryGap="20%" accessibilityLayer>
                  <CartesianGrid strokeDasharray="2 4" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#9CA3AF"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis stroke="#9CA3AF" tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value, name) => [currencyFormatter(value), name === 'income' ? 'Income' : 'Expenses']}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="income" fill="#6EC6E6" radius={[6, 6, 0, 0]} maxBarSize={16} animationDuration={900} />
                  <Bar dataKey="expenses" fill="#F472B6" radius={[6, 6, 0, 0]} maxBarSize={16} animationDuration={900} />
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
