import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

const TransactionHistoryList = ({
  transactions,
  currencyFormatter,
  loading,
  pagination,
  onPageChange,
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-[#0B0F19] border border-[#1F2937] rounded-lg">
        <p className="text-[#9CA3AF]">No transactions found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-2"
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
            className="p-4 bg-[#111827] border border-[#1F2937] rounded-lg hover:border-[#374151] transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-4 flex-1">
              <div
                className={`p-3 rounded-lg ${
                  isIncome ? 'bg-emerald-500/10' : 'bg-red-500/10'
                }`}
              >
                <Icon
                  size={20}
                  className={isIncome ? 'text-emerald-400' : 'text-red-400'}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#E5E7EB] truncate">{transaction.category}</p>
                <p className="text-sm text-[#9CA3AF]">
                  {new Date(transaction.date).toLocaleDateString()} •{' '}
                  {transaction.paymentMethod}
                </p>
                {transaction.notes && (
                  <p className="text-xs text-[#6B7280] truncate mt-1">{transaction.notes}</p>
                )}
              </div>
            </div>

            <div className="text-right ml-4">
              <p
                className={`font-bold text-lg ${
                  isIncome ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isIncome ? '+' : '-'}{currencyFormatter(transaction.amount)}
              </p>
              <p className="text-xs text-[#9CA3AF] capitalize">{transaction.type}</p>
            </div>
          </motion.div>
        );
      })}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-[#1F2937]">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-2 rounded-lg border border-[#1F2937] text-[#9CA3AF] hover:border-[#374151] disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                  className={`w-8 h-8 rounded-lg font-medium text-sm transition ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'border border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
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
            className="p-2 rounded-lg border border-[#1F2937] text-[#9CA3AF] hover:border-[#374151] disabled:opacity-50 disabled:cursor-not-allowed transition"
            type="button"
          >
            <ChevronRight size={18} />
          </button>

          <span className="ml-4 text-sm text-[#9CA3AF]">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default TransactionHistoryList;
