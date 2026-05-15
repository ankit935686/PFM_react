import { motion } from 'framer-motion';
import { PencilLine, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../lib/currency';

const IncomeTable = ({ income, currency, loading, deletingId, onEdit, onDelete }) => {
  if (loading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300 shadow-lg shadow-black/10">
        Loading income...
      </section>
    );
  }

  if (!income.length) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300 shadow-lg shadow-black/10">
        <h3 className="text-lg font-semibold text-slate-100">No income yet</h3>
        <p className="mt-2 text-sm text-slate-400">
          Add your first income entry to start tracking earnings and cash flow.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="text-xs uppercase tracking-[0.2em] text-slate-400">
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4">Source</th>
              <th className="px-5 py-4">Notes</th>
              <th className="px-5 py-4 text-right">Amount</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {income.map((entry) => {
              const displayAmount = formatCurrency(entry.amount, currency);
              const incomeDate = new Date(entry.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <motion.tr
                  key={entry._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-white/5 text-slate-100 even:bg-white/[0.02]"
                >
                  <td className="px-5 py-4 text-slate-300">{incomeDate}</td>
                  <td className="px-5 py-4 font-medium text-slate-100">{entry.source}</td>
                  <td className="px-5 py-4 text-slate-300">
                    <p className="max-w-80 truncate">{entry.notes || 'No notes added'}</p>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-emerald-400">
                    +{displayAmount}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(entry)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
                      >
                        <PencilLine size={15} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(entry)}
                        disabled={deletingId === entry._id}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 px-3 py-2 text-sm text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={15} />
                        {deletingId === entry._id ? 'Deleting...' : 'Delete'}
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

export default IncomeTable;
