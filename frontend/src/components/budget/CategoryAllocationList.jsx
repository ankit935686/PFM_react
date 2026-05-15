import { motion } from 'framer-motion';
import { Percent, AlertCircle, ChevronRight } from 'lucide-react';

const CategoryAllocationList = ({
  categoryBudgets,
  overallBudget,
  currencyFormatter,
  onEditCategory,
  loading,
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!categoryBudgets || categoryBudgets.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-[#0B0F19] border border-[#1F2937] rounded-lg">
        <p className="text-[#9CA3AF]">No categories allocated yet. Start by setting the overall budget.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-2"
    >
      {categoryBudgets.map((category, index) => {
        const isOver = Number(category.amount) > Number(overallBudget);
        const percentOfOverall = category.percentageOfOverall || 0;

        return (
          <motion.div
            key={category._id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onEditCategory(category)}
            className={`p-4 rounded-lg border transition cursor-pointer group ${
              isOver
                ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                : 'bg-[#111827] border-[#1F2937] hover:border-[#374151]'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-[#E5E7EB] group-hover:text-blue-400 transition">
                  {category.category}
                </h4>
                <p className="text-sm text-[#9CA3AF] mt-1">
                  {currencyFormatter(category.amount)} • {percentOfOverall}% of overall
                </p>
              </div>
              <ChevronRight size={20} className="text-[#6B7280] group-hover:text-blue-400 transition" />
            </div>

            {/* Allocation Bar */}
            <div className="w-full h-1.5 bg-[#0B0F19] rounded-full overflow-hidden">
              <div
                className={`h-full transition ${
                  isOver ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (category.amount / overallBudget) * 100)}%` }}
              />
            </div>

            {/* Warning */}
            {isOver && (
              <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
                <AlertCircle size={14} />
                <span>Exceeds overall budget by {currencyFormatter(Number(category.amount) - overallBudget)}</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default CategoryAllocationList;
