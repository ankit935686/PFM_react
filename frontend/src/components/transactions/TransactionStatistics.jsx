import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, DollarSign, Hash } from 'lucide-react';

const TransactionStatistics = ({ statistics, currencyFormatter, loading }) => {
  if (loading || !statistics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg animate-pulse"
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
      color: 'from-emerald-500/10 to-emerald-600/10',
      textColor: 'text-emerald-400',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Total Expense',
      value: currencyFormatter(statistics.totalExpense),
      icon: TrendingDown,
      color: 'from-red-500/10 to-red-600/10',
      textColor: 'text-red-400',
      iconColor: 'text-red-500',
    },
    {
      label: 'Net Balance',
      value: currencyFormatter(statistics.netAmount),
      icon: DollarSign,
      color: statistics.netAmount >= 0 ? 'from-blue-500/10 to-blue-600/10' : 'from-orange-500/10 to-orange-600/10',
      textColor: statistics.netAmount >= 0 ? 'text-blue-400' : 'text-orange-400',
      iconColor: statistics.netAmount >= 0 ? 'text-blue-500' : 'text-orange-500',
    },
    {
      label: 'Transactions',
      value: statistics.transactionCount,
      icon: Hash,
      color: 'from-purple-500/10 to-purple-600/10',
      textColor: 'text-purple-400',
      iconColor: 'text-purple-500',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg bg-gradient-to-br ${stat.color} border border-gray-700`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
              <Icon size={20} className={stat.iconColor} />
            </div>
            {stat.label === 'Transactions' && statistics.transactionCount > 0 && (
              <p className="text-xs text-gray-400">
                {statistics.incomeCount} income, {statistics.expenseCount} expense
              </p>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default TransactionStatistics;
