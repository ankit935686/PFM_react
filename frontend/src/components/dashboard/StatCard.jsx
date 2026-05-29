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
  const gradientByKey = {
    balance: 'bg-[linear-gradient(135deg,#40C8D0_0%,#7ADBDD_55%,#8FE5DD_100%)]',
    income: 'bg-[linear-gradient(135deg,#6FA9E8_0%,#8EBAED_55%,#A5C7F1_100%)]',
    expenses: 'bg-[linear-gradient(135deg,#F08BC0_0%,#F3A1C9_55%,#F6B3D2_100%)]',
    savings: 'bg-[linear-gradient(135deg,#B29AE9_0%,#BFAAEF_55%,#CBB8F2_100%)]',
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -4 }}
      className={`!font-[Nunito] relative flex min-h-[116px] flex-col gap-2 overflow-hidden rounded-xl border border-white/40 p-3 text-white shadow-[0_14px_28px_-20px_rgba(30,30,45,0.55)] ${gradientByKey[card.key] || gradientByKey.balance}`}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.34),transparent_52%)]" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold tracking-[0.01em] text-white/90">
          {card.title}
        </p>
        <span className="flex h-[28px] w-[28px] items-center justify-center rounded-md border border-white/45 bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          <Icon size={17} strokeWidth={2.2} />
        </span>
      </div>

      <p className="text-[28px] font-semibold leading-none tracking-[-0.01em] text-white">
        {currencyFormatter(card.value)}
      </p>

      <div
        className={`mt-auto inline-flex w-fit items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold shadow-[0_6px_12px_-9px_rgba(0,0,0,0.35)] ${
          positive
            ? 'border-[#DCFCE7] bg-[#DCFCE7] text-[#15803D]'
            : 'border-[#FEE2E2] bg-[#FEE2E2] text-[#DC2626]'
        }`}
      >
        {positive ? (
          <>
            <ArrowUpRight size={13} />
            <span>{card.trend}</span>
          </>
        ) : (
          <>
            <ArrowDownRight size={13} />
            <span>{card.trend}</span>
          </>
        )}
      </div>

      <div className="h-1 rounded-full bg-white/35" aria-hidden="true" />
    </motion.article>
  );
};

export default StatCard;
