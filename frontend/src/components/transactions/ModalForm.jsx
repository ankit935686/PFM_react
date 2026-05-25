import { X } from 'lucide-react';
import { useState } from 'react';
import ReceiptScanner from './ReceiptScanner';

const expenseCategories = ['Food', 'Transport', 'Shopping', 'Rent', 'Utilities', 'Health', 'Education', 'Entertainment', 'Travel', 'Groceries', 'Bills', 'Other'];
const incomeCategories = ['Salary', 'Freelance', 'Business', 'Investments', 'Rental', 'Bonus', 'Other'];

const ModalForm = ({ open, form, saving, onChange, onClose, onSubmit, mode, onAddScan }) => {
  const [scannerOpen, setScannerOpen] = useState(false);

  if (!open) {
    return null;
  }

  const categories = form.type === 'Income' ? incomeCategories : expenseCategories;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-[#1F2937] bg-[#101827] p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{mode === 'edit' ? 'Edit Transaction' : 'Add Transaction'}</h2>
            <p className="text-sm text-slate-400">Track both income and expenses from one unified flow.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1F2937] text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <label className="grid gap-1.5">
            <span className="text-xs text-slate-300">Type</span>
            <select
              className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
              name="type"
              value={form.type}
              onChange={onChange}
            >
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs text-slate-300">Amount</span>
            <input
              className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={onChange}
              required
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs text-slate-300">Category</span>
            <select
              className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
              name="category"
              value={form.category}
              onChange={onChange}
              required
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs text-slate-300">Date</span>
            <input
              className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
              name="date"
              type="date"
              value={form.date}
              onChange={onChange}
              required
            />
          </label>

          <label className="grid gap-1.5 md:col-span-2">
            <span className="text-xs text-slate-300">Notes</span>
            <textarea
              className="min-h-24 rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
              name="notes"
              value={form.notes}
              onChange={onChange}
              rows="4"
            />
          </label>

          <div className="mt-2 flex justify-end gap-2 md:col-span-2">
            <button
              type="button"
              onClick={() => setScannerOpen((s) => !s)}
              className="rounded-xl border border-[#1F2937] px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
            >
              Scan receipt
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#1F2937] px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-linear-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-70"
            >
              {saving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Add'}
            </button>
          </div>

          {scannerOpen && (
            <div className="md:col-span-2 mt-4">
              <ReceiptScanner
                onClose={() => setScannerOpen(false)}
                onSaved={() => {
                  setScannerOpen(false);
                  onClose();
                }}
                onAdd={(payload) => {
                  if (onAddScan) {
                    return onAddScan(payload);
                  }

                  return Promise.resolve();
                }}
              />
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ModalForm;
