import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Landmark, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';

const cardIcon = {
  balance: Landmark,
  income: TrendingUp,
  expenses: TrendingDown,
  savings: PiggyBank,
};

const StatCard = ({ card, currencyFormatter }) => {
  const Icon = cardIcon[card.key] || Landmark;
  const positive = card.trendDirection === 'up';

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-[#1F2937] bg-[#111827] p-4 shadow-lg shadow-black/20"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-400">{card.title}</p>
        <span className="rounded-lg border border-[#1F2937] bg-[#0B0F19] p-2 text-slate-300">
          <Icon size={16} />
        </span>
      </div>

      <p className="text-2xl font-semibold text-[#E5E7EB]">{currencyFormatter(card.value)}</p>

      <div className="mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset">
        {positive ? (
          <>
            <ArrowUpRight size={14} className="text-emerald-400" />
            <span className="text-emerald-400">{card.trend}</span>
          </>
        ) : (
          <>
            <ArrowDownRight size={14} className="text-amber-400" />
            <span className="text-amber-400">{card.trend}</span>
          </>
        )}
      </div>
    </motion.article>
  );
};

export default StatCard;
