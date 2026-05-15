import { motion } from 'framer-motion';
import { PencilLine, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../lib/currency';

const ExpenseTable = ({ expenses, currency, loading, deletingId, onEdit, onDelete }) => {
  if (loading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300 shadow-lg shadow-black/10">
        Loading expenses...
      </section>
    );
  }

  if (!expenses.length) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300 shadow-lg shadow-black/10">
        <h3 className="text-lg font-semibold text-slate-100">No expenses yet</h3>
        <p className="mt-2 text-sm text-slate-400">
          Add your first expense to start tracking spending and category patterns.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="text-xs uppercase tracking-[0.2em] text-slate-400">
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Payment</th>
              <th className="px-5 py-4">Notes</th>
              <th className="px-5 py-4 text-right">Amount</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => {
              const displayAmount = formatCurrency(expense.amount, currency);
              const expenseDate = new Date(expense.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <motion.tr
                  key={expense._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-white/5 text-slate-100 even:bg-white/[0.02]"
                >
                  <td className="px-5 py-4 text-slate-300">{expenseDate}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-100">{expense.category}</span>
                      <span className="text-xs text-slate-400">ID: {expense._id.slice(-6)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{expense.paymentMethod}</td>
                  <td className="px-5 py-4 text-slate-300">
                    <p className="max-w-80 truncate">{expense.notes || 'No notes added'}</p>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-emerald-400">
                    -{displayAmount}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(expense)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
                      >
                        <PencilLine size={15} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(expense)}
                        disabled={deletingId === expense._id}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 px-3 py-2 text-sm text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={15} />
                        {deletingId === expense._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ExpenseTable;
