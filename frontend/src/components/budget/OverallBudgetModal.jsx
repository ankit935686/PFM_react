import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const OverallBudgetModal = ({ isOpen, onClose, currentBudget, onSubmit, saving }) => {
  const [formData, setFormData] = useState({
    amount: currentBudget?.overallBudget || '',
    notes: currentBudget?.notes || '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }

    try {
      await onSubmit({
        budgetType: 'overall',
        amount: Number(formData.amount),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        notes: formData.notes,
      });
      setFormData({ amount: '', notes: '' });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save budget');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 max-w-md w-full shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#E5E7EB]">Set Overall Budget</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1F2937] rounded-lg transition"
            type="button"
          >
            <X size={20} className="text-[#9CA3AF]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#D1D5DB] mb-2">
              Monthly Budget Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="50000"
                className="w-full pl-8 pr-4 py-2 bg-[#0B0F19] border border-[#1F2937] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-blue-500 focus:outline-none transition"
              />
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">
              This is your total monthly spending limit
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#D1D5DB] mb-2">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g., Conservative estimate for this month"
              rows={3}
              className="w-full px-4 py-2 bg-[#0B0F19] border border-[#1F2937] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-blue-500 focus:outline-none transition resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="pt-4 border-t border-[#1F2937] flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[#1F2937] text-[#D1D5DB] hover:bg-[#1F2937] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? 'Saving...' : 'Set Budget'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default OverallBudgetModal;
