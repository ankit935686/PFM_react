import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PiggyBank, Target, TrendingUp } from 'lucide-react';

const SavingsSection = ({ savingsTracker, currencyFormatter, onSetGoal, loading }) => {
  if (loading) {
    return (
      <article className="!font-[Nunito] rounded-xl border border-[#E8EAF6] bg-white p-3 shadow-[0_8px_24px_-20px_rgba(30,30,45,0.2)]">
        <header className="mb-2">
          <h2 className="text-[13px] font-semibold text-[#1E1E2D]">Monthly Savings Tracker</h2>
        </header>
        <div className="info-card-body">
          <div className="h-24 rounded animate-pulse" style={{ background: 'var(--app-surface-soft)' }} />
        </div>
      </article>
    );
  }

  if (!savingsTracker) {
    return (
      <article className="!font-[Nunito] rounded-xl border border-[#E8EAF6] bg-white p-3 shadow-[0_8px_24px_-20px_rgba(30,30,45,0.2)]">
        <header className="mb-2">
          <h2 className="text-[13px] font-semibold text-[#1E1E2D]">Monthly Savings Tracker</h2>
        </header>
        <p className="info-card-empty">Loading savings data...</p>
      </article>
    );
  }

  const { monthlySavings, goalAmount, savingsPercentage, progressStatus, displayText } = savingsTracker;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="!font-[Nunito] rounded-xl border border-[#E8EAF6] bg-white p-3 shadow-[0_8px_24px_-20px_rgba(30,30,45,0.2)]"
    >
      <header className="mb-2">
        <h2 className="text-[13px] font-semibold text-[#1E1E2D]">Monthly Savings Tracker</h2>
      </header>

      <div>
        <div className="space-y-4">
          {/* Main Display Text */}
          <div className="rounded-lg border border-[#D9DCFF] bg-[linear-gradient(90deg,rgba(91,91,214,0.08),rgba(110,198,230,0.12))] p-3">
            <p className="text-xs font-semibold text-[#5B5BD6]">
              {displayText}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-[#F8F9FF] p-3">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp size={14} className="text-[#5B5BD6]" />
                <span className="text-xs text-[#9CA3AF]">This Month</span>
              </div>
              <p className="text-xs font-semibold text-[#5B5BD6]">
                {currencyFormatter(monthlySavings)}
              </p>
            </div>

            <div className="rounded-lg bg-[#F8F9FF] p-3">
              <div className="mb-1 flex items-center gap-2">
                <Target size={14} className="text-[#FB923C]" />
                <span className="text-xs text-[#9CA3AF]">Goal</span>
              </div>
              <p className="text-xs font-semibold text-[#FB923C]">
                {currencyFormatter(goalAmount)}
              </p>
            </div>

            <div className="rounded-lg bg-[#F8F9FF] p-3">
              <div className="mb-1 flex items-center gap-2">
                <PiggyBank size={14} className="text-[#34D399]" />
                <span className="text-xs text-[#9CA3AF]">Progress</span>
              </div>
              <p className="text-xs font-semibold text-[#34D399]">
                {savingsPercentage}%
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">Goal Progress</span>
              <span className="text-xs font-medium text-[#1E1E2D]">{progressStatus}</span>
            </div>
            <div className="progress-track h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
              <motion.div
                className="progress-fill h-full bg-[#6EC6E6]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, savingsPercentage)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Status Badge */}
          {progressStatus === 'Achieved' && (
            <div
              className="p-2 rounded-lg"
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <p className="text-xs font-medium" style={{ color: 'var(--app-success)' }}>
                Savings goal achieved this month!
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={onSetGoal}
              className="savings-action-button rounded-md border border-[#E8EAF6] px-3 py-2 text-[11px] font-semibold text-[#5B5BD6] hover:bg-[#EEF0FF]"
              type="button"
            >
              Set Monthly Goal
            </button>

            <Link to="/savings" className="savings-action-button savings-action-button--primary rounded-md bg-[#5B5BD6] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#4848C2]">
              Open Savings
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default SavingsSection;

