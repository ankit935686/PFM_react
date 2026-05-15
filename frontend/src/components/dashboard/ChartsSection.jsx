import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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
  monthlyExpenseData,
  incomeExpenseTrendData,
  currencyFormatter,
  loading,
}) => {
  const hasCategoryData = Array.isArray(expenseCategoryData) && expenseCategoryData.length > 0;
  const hasMonthlyExpenseData = Array.isArray(monthlyExpenseData) && monthlyExpenseData.length > 0;
  const hasTrendData = Array.isArray(incomeExpenseTrendData) && incomeExpenseTrendData.length > 0;

  const pieData = expenseCategoryData.map((item) => ({
    name: item.category,
    value: Number(item.total || 0),
    color: item.color,
  }));

  const monthlyBarData = monthlyExpenseData.map((item) => ({
    month: monthLabelFromKey(item.monthKey),
    totalExpenses: Number(item.totalExpenses || 0),
  }));

  const trendLineData = incomeExpenseTrendData.map((item) => ({
    month: monthLabelFromKey(item.monthKey),
    income: Number(item.totalIncome || 0),
    expenses: Number(item.totalExpenses || 0),
  }));

  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-2">
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="min-w-0 rounded-2xl border border-[#1F2937] bg-[#111827] p-4"
      >
        <h2 className="mb-4 text-base font-semibold text-[#E5E7EB]">Expense Distribution (Pie)</h2>
        <div className="h-72 min-h-64 min-w-0">
          {loading ? (
            <div className="grid h-full place-items-center rounded-xl border border-dashed border-[#1F2937] text-sm text-slate-400">
              Loading chart...
            </div>
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
                    background: '#0B0F19',
                    border: '1px solid #1F2937',
                    borderRadius: '10px',
                  }}
                  labelStyle={{ color: '#E5E7EB' }}
                  formatter={(value) => [currencyFormatter(value), 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center rounded-xl border border-dashed border-[#1F2937] text-sm text-slate-400">
              No expense categories yet.
            </div>
          )}
        </div>

        {hasCategoryData && !loading && (
          <ul className="mt-2 space-y-2">
            {pieData.map((item) => (
              <li key={item.name} className="flex items-center justify-between text-sm text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
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
        className="min-w-0 rounded-2xl border border-[#1F2937] bg-[#111827] p-4"
      >
        <h2 className="mb-4 text-base font-semibold text-[#E5E7EB]">Monthly Expenses (Bar)</h2>
        <div className="h-72 min-h-64 min-w-0">
          {loading ? (
            <div className="grid h-full place-items-center rounded-xl border border-dashed border-[#1F2937] text-sm text-slate-400">
              Loading chart...
            </div>
          ) : hasMonthlyExpenseData ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={monthlyBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="month" stroke="#9CA3AF" tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(59,130,246,0.08)' }}
                  contentStyle={{
                    background: '#0B0F19',
                    border: '1px solid #1F2937',
                    borderRadius: '10px',
                  }}
                  labelStyle={{ color: '#E5E7EB' }}
                  formatter={(value) => [currencyFormatter(value), 'Expenses']}
                />
                <Bar dataKey="totalExpenses" radius={[8, 8, 0, 0]} fill="#EF4444" animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center rounded-xl border border-dashed border-[#1F2937] text-sm text-slate-400">
              No monthly expenses yet.
            </div>
          )}
        </div>
      </motion.article>

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="min-w-0 rounded-2xl border border-[#1F2937] bg-[#111827] p-4 xl:col-span-2"
      >
        <h2 className="mb-4 text-base font-semibold text-[#E5E7EB]">Income vs Expenses Trend (Line)</h2>
        <div className="h-80 min-h-72 min-w-0">
          {loading ? (
            <div className="grid h-full place-items-center rounded-xl border border-dashed border-[#1F2937] text-sm text-slate-400">
              Loading chart...
            </div>
          ) : hasTrendData ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart data={trendLineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="month" stroke="#9CA3AF" tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#0B0F19',
                    border: '1px solid #1F2937',
                    borderRadius: '10px',
                  }}
                  labelStyle={{ color: '#E5E7EB' }}
                  formatter={(value, name) => [currencyFormatter(value), name === 'income' ? 'Income' : 'Expenses']}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center rounded-xl border border-dashed border-[#1F2937] text-sm text-slate-400">
              No trend data yet.
            </div>
          )}
        </div>
      </motion.article>
    </section>
  );
};

export default ChartsSection;
