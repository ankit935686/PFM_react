import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useSavings } from '../../context/SavingsContext';

const SavingsGoalModal = ({ isOpen, onClose, currentGoal, currencyFormatter, targetMonth, targetYear }) => {
  const { setSavingsGoal, saving } = useSavings();
  const [goalAmount, setGoalAmount] = useState(currentGoal?.goalAmount || '');
  const [notes, setNotes] = useState(currentGoal?.notes || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setGoalAmount(currentGoal?.goalAmount || '');
    setNotes(currentGoal?.notes || '');
    setError('');
  }, [currentGoal, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!goalAmount || Number(goalAmount) < 0) {
      setError('Please enter a valid goal amount');
      return;
    }

    try {
      const resolvedMonth = targetMonth || new Date().getMonth() + 1;
      const resolvedYear = targetYear || new Date().getFullYear();

      await setSavingsGoal(Number(goalAmount), resolvedMonth, resolvedYear, notes);
      onClose();
      setGoalAmount('');
      setNotes('');
    } catch (err) {
      setError(err.message || 'Failed to set savings goal');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(10, 14, 28, 0.55)' }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="rounded-2xl p-6 max-w-md w-full shadow-xl"
        style={{
          background: 'var(--app-surface-elevated)',
          border: '1px solid var(--app-border)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--app-text)' }}>
            Set Savings Goal
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition"
            style={{ color: 'var(--app-text-muted)' }}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--app-text)' }}>
              Monthly Savings Goal
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--app-text-muted)' }}>₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                placeholder="Enter goal amount"
                className="w-full pl-8 pr-4 py-2 rounded-lg transition"
                style={{
                  background: 'rgba(255, 255, 255, 0.76)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-text)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--app-text)' }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this goal..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg transition resize-none"
              style={{
                background: 'rgba(255, 255, 255, 0.76)',
                border: '1px solid var(--app-border)',
                color: 'var(--app-text)',
              }}
            />
          </div>

          {error && <p className="text-sm" style={{ color: 'var(--app-danger)' }}>{error}</p>}

          <div className="pt-4 flex gap-3" style={{ borderTop: '1px solid var(--app-border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg transition"
              style={{
                border: '1px solid var(--app-border)',
                color: 'var(--app-text)',
                background: 'transparent',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
              style={{
                background: 'linear-gradient(135deg, var(--app-brand), var(--app-brand-2))',
                color: '#ffffff',
              }}
            >
              {saving ? 'Saving...' : 'Set Goal'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SavingsGoalModal;
