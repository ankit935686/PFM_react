import { PencilLine, Trash2 } from 'lucide-react';

const TransactionTable = ({ items, currencyFormatter, loading, onEdit, onDelete, deletingId }) => {
  if (loading) {
    return <section className="rounded-2xl border border-[#1F2937] bg-[#111827] p-5 text-slate-300">Loading transactions...</section>;
  }

  if (!items.length) {
    return (
      <section className="rounded-2xl border border-[#1F2937] bg-[#111827] p-5 text-slate-300">
        <h3 className="text-lg font-semibold text-slate-100">Add your first transaction</h3>
        <p className="mt-2 text-sm text-slate-400">Start by adding income or expense from the button above.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#1F2937] bg-[#111827]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-[#0B0F19] text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.type}-${item._id}`} className="border-t border-[#1F2937] text-slate-200">
                <td className="px-4 py-3 text-slate-300">{new Date(item.date).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-1 text-xs ${item.type === 'Income' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-rose-500/30 text-rose-400 bg-rose-500/10'}`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-4 py-3">{item.category}</td>
                <td className="max-w-80 truncate px-4 py-3 text-slate-300">{item.notes || 'No notes'}</td>
                <td className={`px-4 py-3 text-right font-semibold ${item.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.type === 'Income' ? '+' : '-'}{currencyFormatter(Math.abs(item.amount))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#1F2937] px-2.5 py-1.5 text-xs hover:border-cyan-400/40"
                    >
                      <PencilLine size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      disabled={deletingId === item._id}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 px-2.5 py-1.5 text-xs text-rose-300 hover:border-rose-500/50 disabled:opacity-60"
                    >
                      <Trash2 size={14} />
                      {deletingId === item._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TransactionTable;
