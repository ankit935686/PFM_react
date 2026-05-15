import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PiggyBank, Target, TrendingUp } from 'lucide-react';

const SavingsSection = ({ savingsTracker, currencyFormatter, onSetGoal, loading }) => {
  if (loading) {
    return (
      <article className="info-card">
        <header className="info-card-header">
          <h2>Monthly Savings Tracker</h2>
        </header>
        <div className="info-card-body">
          <div className="h-24 rounded animate-pulse" style={{ background: 'var(--app-surface-soft)' }} />
        </div>
      </article>
    );
  }

  if (!savingsTracker) {
    return (
      <article className="info-card">
        <header className="info-card-header">
          <h2>Monthly Savings Tracker</h2>
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
      className="info-card"
    >
      <header className="info-card-header">
        <h2>Monthly Savings Tracker</h2>
      </header>

      <div className="info-card-body">
        <div className="space-y-4">
          {/* Main Display Text */}
          <div
            className="p-3 rounded-lg"
            style={{
              background: 'linear-gradient(90deg, rgba(124, 92, 255, 0.08), rgba(56, 189, 248, 0.12))',
              border: '1px solid rgba(124, 92, 255, 0.18)',
            }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--app-brand)' }}>
              {displayText}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg" style={{ background: 'var(--app-surface)' }}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} style={{ color: 'var(--app-brand)' }} />
                <span className="text-xs" style={{ color: 'var(--app-text-muted)' }}>This Month</span>
              </div>
              <p className="font-semibold" style={{ color: 'var(--app-brand)' }}>
                {currencyFormatter(monthlySavings)}
              </p>
            </div>

            <div className="p-3 rounded-lg" style={{ background: 'var(--app-surface)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Target size={14} style={{ color: 'var(--app-warning)' }} />
                <span className="text-xs" style={{ color: 'var(--app-text-muted)' }}>Goal</span>
              </div>
              <p className="font-semibold" style={{ color: 'var(--app-warning)' }}>
                {currencyFormatter(goalAmount)}
              </p>
            </div>

            <div className="p-3 rounded-lg" style={{ background: 'var(--app-surface)' }}>
              <div className="flex items-center gap-2 mb-1">
                <PiggyBank size={14} style={{ color: 'var(--app-success)' }} />
                <span className="text-xs" style={{ color: 'var(--app-text-muted)' }}>Progress</span>
              </div>
              <p className="font-semibold" style={{ color: 'var(--app-success)' }}>
                {savingsPercentage}%
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--app-text-muted)' }}>Goal Progress</span>
              <span className="text-xs font-medium" style={{ color: 'var(--app-text)' }}>{progressStatus}</span>
            </div>
            <div className="progress-track">
              <motion.div
                className="progress-fill"
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
                ✓ Savings goal achieved this month!
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={onSetGoal}
              className="savings-action-button"
              type="button"
            >
              Set Monthly Goal
            </button>

            <Link to="/savings" className="savings-action-button savings-action-button--primary">
              Open Savings
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default SavingsSection;
