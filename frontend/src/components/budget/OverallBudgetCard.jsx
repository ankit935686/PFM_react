import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertCircle } from 'lucide-react';

const OverallBudgetCard = ({
  overallBudget,
  totalAllocated,
  unallocated,
  currencyFormatter,
  onEdit,
  loading,
}) => {
  if (loading) {
    return (
      <div className="h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl animate-pulse" />
    );
  }

  const allocationPercent = overallBudget > 0 ? Math.round((totalAllocated / overallBudget) * 100) : 0;
  const isWarning = allocationPercent >= 90;
  const isOver = allocationPercent > 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-xl border-2 transition ${
        isOver
          ? 'bg-red-500/5 border-red-500/30'
          : isWarning
          ? 'bg-amber-500/5 border-amber-500/30'
          : 'bg-emerald-500/5 border-emerald-500/30'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-[#9CA3AF] mb-1">Monthly Overall Budget</p>
          <p className="text-3xl font-bold text-[#E5E7EB]">{currencyFormatter(overallBudget)}</p>
        </div>
        <div className="flex gap-2">
          <div className="p-3 rounded-lg bg-[#111827]">
            <Target size={24} className="text-blue-400" />
          </div>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-500/20 text-blue-300 text-sm font-medium rounded-lg hover:bg-blue-500/30 transition"
            type="button"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Allocation Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#D1D5DB]">Category Allocation</span>
            <span className="text-sm font-semibold text-[#E5E7EB]">{allocationPercent}%</span>
          </div>
          <div className="w-full h-2 bg-[#1F2937] rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                isOver
                  ? 'bg-red-500'
                  : isWarning
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, allocationPercent)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="p-3 rounded-lg bg-[#0B0F19]">
            <p className="text-xs text-[#9CA3AF] mb-1">Allocated</p>
            <p className="font-semibold text-emerald-400">{currencyFormatter(totalAllocated)}</p>
          </div>
          <div className="p-3 rounded-lg bg-[#0B0F19]">
            <p className="text-xs text-[#9CA3AF] mb-1">Unallocated</p>
            <p className={`font-semibold ${unallocated >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {currencyFormatter(unallocated)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#0B0F19]">
            <p className="text-xs text-[#9CA3AF] mb-1">Categories</p>
            <p className="font-semibold text-[#E5E7EB]">{allocationPercent}% used</p>
          </div>
        </div>

        {/* Warning Message */}
        {unallocated < 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-300">
              Category allocation exceeds overall budget by {currencyFormatter(Math.abs(unallocated))}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default OverallBudgetCard;
