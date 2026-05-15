import { X } from 'lucide-react';
import { motion } from 'framer-motion';

const categories = [
  'Food',
  'Transport',
  'Shopping',
  'Rent',
  'Utilities',
  'Health',
  'Education',
  'Entertainment',
  'Travel',
  'Groceries',
  'Bills',
  'Other',
];

const paymentMethods = ['Cash', 'UPI', 'Card'];

const ExpenseModal = ({ isOpen, mode, form, onChange, onSubmit, onClose, saving }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
    >
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0F172A] p-5 shadow-2xl shadow-black/40 md:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="expense-modal-title" className="text-2xl font-bold text-slate-100">
              {mode === 'edit' ? 'Edit expense' : 'Add expense'}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Capture spending in seconds. Changes sync back to the expense list immediately.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition hover:border-white/25 hover:text-white"
            aria-label="Close expense form"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-300">Amount</span>
            <input
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.amount}
              onChange={onChange}
              placeholder="0.00"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-300">Category</span>
            <select
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
              name="category"
              value={form.category}
              onChange={onChange}
              required
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-300">Date</span>
            <input
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
              name="date"
              type="date"
              value={form.date}
              onChange={onChange}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-300">Payment method</span>
            <select
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={onChange}
              required
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-300">Notes</span>
            <textarea
              className="min-h-28 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
              name="notes"
              value={form.notes}
              onChange={onChange}
              placeholder="Optional note about the expense"
              rows="4"
            />
          </label>

          <div className="flex flex-wrap gap-3 md:col-span-2 md:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-linear-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving...' : mode === 'edit' ? 'Update expense' : 'Create expense'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ExpenseModal;
