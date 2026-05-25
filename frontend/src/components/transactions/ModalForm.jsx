import { ArrowDown, ArrowUp, ChevronRight, IndianRupee, Receipt, X } from 'lucide-react';
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
  const inputBase =
    'h-[38px] rounded-lg border border-[#E2E4EF] bg-[#F8F8FC] px-3 text-[13px] text-[#1E1E2D] outline-none transition focus:border-[#5B5BD6] focus:bg-white focus:ring-2 focus:ring-[#5B5BD6]/10';

  const handleTypeChange = (nextType) => {
    onChange({
      target: {
        name: 'type',
        value: nextType,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-[420px] flex-col rounded-2xl border border-[#EBEBF5] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-semibold text-[#1E1E2D]">{mode === 'edit' ? 'Edit Transaction' : 'Add Transaction'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200"
          >
            <X size={14} />
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
          <div className="grid min-h-0 grid-cols-2 gap-x-3 gap-y-3 overflow-y-auto pr-1">
          <div className="grid gap-1.5 col-span-2">
            <span className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[#9CA3AF]">Type</span>
            <div className="mb-4 flex rounded-xl bg-[#F4F4F8] p-1">
              <button
                type="button"
                onClick={() => handleTypeChange('Expense')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-[9px] py-2 text-[13px] transition-all duration-150 ${
                  form.type === 'Expense'
                    ? 'border border-[#FECACA] bg-[#FEE2E2] font-semibold text-[#DC2626]'
                    : 'bg-transparent font-medium text-gray-400'
                }`}
              >
                <ArrowDown size={13} />
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('Income')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-[9px] py-2 text-[13px] transition-all duration-150 ${
                  form.type === 'Income'
                    ? 'border border-[#BBF7D0] bg-[#DCFCE7] font-semibold text-[#15803D]'
                    : 'bg-transparent font-medium text-gray-400'
                }`}
              >
                <ArrowUp size={13} />
                Income
              </button>
            </div>
          </div>

          <label className="grid gap-1.5">
            <span className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[#9CA3AF]">Amount</span>
            <div className="relative">
              <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className={`${inputBase} w-full pl-6`}
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={onChange}
                required
              />
            </div>
          </label>

          <label className="grid gap-1.5">
            <span className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[#9CA3AF]">Date</span>
            <input
              className={inputBase}
              name="date"
              type="date"
              value={form.date}
              onChange={onChange}
              required
            />
          </label>

          <label className="grid gap-1.5">
            <span className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[#9CA3AF]">Category</span>
            <select
              className={inputBase}
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
            <span className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[#9CA3AF]">Payment Method</span>
            <input
              className={inputBase}
              value={form.type === 'Income' ? 'Bank Transfer' : 'UPI'}
              readOnly
            />
          </label>

          <label className="col-span-2 grid gap-1.5">
            <span className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[#9CA3AF]">Notes</span>
            <textarea
              className="h-[72px] resize-none rounded-lg border border-[#E2E4EF] bg-[#F8F8FC] px-3 py-2 text-[13px] text-[#1E1E2D] outline-none transition focus:border-[#5B5BD6] focus:bg-white focus:ring-2 focus:ring-[#5B5BD6]/10"
              name="notes"
              value={form.notes}
              onChange={onChange}
              rows="3"
            />
          </label>

          <div className="col-span-2">
            <div className="relative my-2 flex items-center justify-center">
              <span className="absolute inset-x-0 h-px bg-gray-200" />
              <span className="relative bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">or autofill</span>
            </div>
            <button
              type="button"
              onClick={() => setScannerOpen((s) => !s)}
              className="mb-4 flex w-full items-center gap-3 rounded-xl border border-dashed border-[#C7C5F4] bg-[#F5F4FF] px-3.5 py-2.5 text-left transition-colors hover:bg-[#EEEEFF]"
            >
              <span className="flex flex-1 items-center gap-3">
                <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#5B5BD6] text-white">
                  <Receipt size={15} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-[#1E1E2D]">Scan receipt</span>
                  <span className="block text-[11px] text-[#8B8FC7]">Capture and auto-fill amount, date &amp; category</span>
                </span>
              </span>
              <ChevronRight size={14} className="text-[#A5A3D4]" />
            </button>
          </div>

          {scannerOpen && (
            <div className="col-span-2 mb-1">
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
          </div>

          <div className="col-span-2 mt-3 flex shrink-0 gap-2.5 border-t border-[#F0F1F8] pt-3">
            <button
              type="button"
              onClick={onClose}
              className="h-[40px] flex-1 rounded-xl border border-[#E2E4EF] bg-white text-[13px] font-medium text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex h-[40px] flex-[2] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#5B5BD6] to-[#7C7CE8] text-[13px] font-semibold text-white hover:from-[#4848C2] hover:to-[#6A6AD4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : mode === 'edit' ? 'Update Transaction' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalForm;
