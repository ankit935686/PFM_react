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
      className="stat-card flex flex-col gap-2 rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-3 shadow-[var(--dash-shadow)] md:p-4"
    >
      <div className="stat-card-head flex items-center justify-between gap-3">
        <p className="stat-card-label text-xs font-semibold text-[color:var(--dash-muted)]">
          {card.title}
        </p>
        <span className="stat-card-icon flex h-7 w-7 items-center justify-center rounded-lg bg-[#f1f5f9] text-[color:var(--dash-text)]">
          <Icon size={14} />
        </span>
      </div>

      <p className="stat-card-value text-lg font-semibold text-[color:var(--dash-text)]">
        {currencyFormatter(card.value)}
      </p>

      <div
        className={`stat-card-trend inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.65rem] font-semibold ${
          positive
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-rose-200 bg-rose-50 text-rose-700'
        }`}
      >
        {positive ? (
          <>
            <ArrowUpRight size={12} />
            <span>{card.trend}</span>
          </>
        ) : (
          <>
            <ArrowDownRight size={12} />
            <span>{card.trend}</span>
          </>
        )}
      </div>

      <div className="stat-card-spark h-1 rounded-full bg-[#f1f5f9]" aria-hidden="true" />
    </motion.article>
  );
};

export default StatCard;
