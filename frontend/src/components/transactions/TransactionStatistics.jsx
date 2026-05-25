import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, DollarSign, Hash } from 'lucide-react';

const TransactionStatistics = ({ statistics, currencyFormatter, loading }) => {
  if (loading || !statistics) {
    return (
      <div className="mx-6 mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-xl border border-gray-100 bg-white"
          />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Income',
      value: currencyFormatter(statistics.totalIncome),
      icon: TrendingUp,
      textColor: 'text-[#15803D]',
      iconColor: 'text-[#15803D]',
      note: 'All income in selected range',
    },
    {
      label: 'Total Expense',
      value: currencyFormatter(statistics.totalExpense),
      icon: TrendingDown,
      textColor: 'text-[#DC2626]',
      iconColor: 'text-[#DC2626]',
      note: 'All expense in selected range',
    },
    {
      label: 'Net Balance',
      value: currencyFormatter(statistics.netAmount),
      icon: DollarSign,
      textColor: statistics.netAmount >= 0 ? 'text-[#15803D]' : 'text-[#DC2626]',
      iconColor: statistics.netAmount >= 0 ? 'text-[#15803D]' : 'text-[#DC2626]',
      note: 'Income minus expense',
    },
    {
      label: 'Transactions',
      value: statistics.transactionCount,
      icon: Hash,
      textColor: 'text-[#5B5BD6]',
      iconColor: 'text-[#5B5BD6]',
      note: `${statistics.incomeCount} income, ${statistics.expenseCount} expense`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-6 mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl border border-gray-100 bg-white p-5"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-gray-400">{stat.label}</p>
                <p className={`text-2xl font-semibold ${stat.textColor}`}>{stat.value}</p>
              </div>
              <Icon size={20} className={stat.iconColor} />
            </div>
            <p className="text-xs text-gray-400">{stat.note}</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default TransactionStatistics;
