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
      className="stat-card"
    >
      <div className="stat-card-head">
        <p className="stat-card-label">{card.title}</p>
        <span className="stat-card-icon">
          <Icon size={16} />
        </span>
      </div>

      <p className="stat-card-value">{currencyFormatter(card.value)}</p>

      <div className="stat-card-trend">
        {positive ? (
          <>
            <ArrowUpRight size={14} className="trend-up" />
            <span className="trend-up">{card.trend}</span>
          </>
        ) : (
          <>
            <ArrowDownRight size={14} className="trend-down" />
            <span className="trend-down">{card.trend}</span>
          </>
        )}
      </div>
    </motion.article>
  );
};

export default StatCard;
