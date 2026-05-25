import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

const TransactionHistoryList = ({
  transactions,
  currencyFormatter,
  loading,
  pagination,
  onPageChange,
}) => {
  if (loading) {
    return (
      <div className="mx-6 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="mx-6 rounded-xl border border-gray-100 bg-white px-4 py-12 text-center">
        <p className="text-gray-500">No transactions found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-6 overflow-hidden rounded-xl border border-gray-100 bg-white"
    >
      {transactions.map((transaction, index) => {
        const isIncome = transaction.type === 'Income';
        const Icon = isIncome ? ArrowUpRight : ArrowDownLeft;

        return (
          <motion.div
            key={transaction._id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 border-b border-gray-50 px-5 py-4 transition last:border-none hover:bg-[#F8F9FF]"
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isIncome ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#DC2626]'
                }`}
              >
                <Icon size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{transaction.category}</p>
                <p className="text-xs text-gray-400">
                  {new Date(transaction.date).toLocaleDateString()} • {transaction.paymentMethod}
                </p>
                {transaction.notes && (
                  <p className="mt-1 max-w-[420px] truncate text-xs italic text-gray-300">{transaction.notes}</p>
                )}
              </div>
            </div>

            <div className="ml-4 text-right">
              <p className={`text-base font-semibold ${isIncome ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
                {isIncome ? '+' : '-'}{currencyFormatter(transaction.amount)}
              </p>
              <p className="text-xs text-gray-400 capitalize">{transaction.type}</p>
            </div>
          </motion.div>
        );
      })}

      {pagination && pagination.pages > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2 border-t border-gray-100 px-5 py-4">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-[#5B5BD6] hover:text-[#5B5BD6] disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: pagination.pages }).map((_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === pagination.page;

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#5B5BD6] text-white'
                      : 'border border-gray-200 text-gray-500 hover:border-[#5B5BD6] hover:text-[#5B5BD6]'
                  }`}
                  type="button"
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-[#5B5BD6] hover:text-[#5B5BD6] disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
          >
            <ChevronRight size={18} />
          </button>

          <span className="ml-4 text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default TransactionHistoryList;
