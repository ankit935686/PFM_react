import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const ChartsSection = ({ monthlySpending, categoryDistribution }) => {
  return (
    <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="rounded-2xl border border-[#1F2937] bg-[#111827] p-4"
      >
        <h2 className="mb-4 text-base font-semibold text-[#E5E7EB]">Monthly Spending</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySpending}>
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
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} fill="#3B82F6" animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.article>

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="rounded-2xl border border-[#1F2937] bg-[#111827] p-4"
      >
        <h2 className="mb-4 text-base font-semibold text-[#E5E7EB]">Category Distribution</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={68}
                outerRadius={95}
                paddingAngle={2}
                animationDuration={900}
              >
                {categoryDistribution.map((entry) => (
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
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="mt-2 space-y-2">
          {categoryDistribution.map((item) => (
            <li key={item.name} className="flex items-center justify-between text-sm text-slate-300">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span>{item.value}%</span>
            </li>
          ))}
        </ul>
      </motion.article>
    </section>
  );
};

export default ChartsSection;
