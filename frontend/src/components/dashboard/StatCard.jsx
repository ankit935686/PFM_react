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
    balance: 'bg-[linear-gradient(135deg,#6EC6E6,#89D8C0)]',
    income: 'bg-[linear-gradient(135deg,#A78BFA,#818CF8)]',
    expenses: 'bg-[linear-gradient(135deg,#F472B6,#FB923C)]',
    savings: 'bg-[linear-gradient(135deg,#C4B5FD,#A5B4FC)]',
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -4 }}
      className={`!font-[Nunito] flex min-h-[116px] flex-col gap-2 rounded-xl border border-transparent p-3 text-white shadow-[0_8px_20px_-16px_rgba(30,30,45,0.4)] ${gradientByKey[card.key] || gradientByKey.balance}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium tracking-[0.01em] text-white/90">
          {card.title}
        </p>
        <span className="flex h-[28px] w-[28px] items-center justify-center rounded-md bg-white/20 text-white">
          <Icon size={17} strokeWidth={2.2} />
        </span>
      </div>

      <p className="text-[28px] font-semibold leading-none tracking-[-0.01em] text-white">
        {currencyFormatter(card.value)}
      </p>

      <div
        className={`mt-auto inline-flex w-fit items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold ${
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

      <div className="h-1 rounded-full bg-white/30" aria-hidden="true" />
    </motion.article>
  );
};

export default StatCard;
