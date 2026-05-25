import { PencilLine, Trash2 } from 'lucide-react';

const TransactionTable = ({ items, currencyFormatter, loading, onEdit, onDelete, deletingId }) => {
  if (loading) {
    return <section className="mx-6 rounded-xl border border-gray-100 bg-white p-5 text-gray-500">Loading transactions...</section>;
  }

  if (!items.length) {
    return (
      <section className="mx-6 rounded-xl border border-gray-100 bg-white p-5 text-gray-500">
        <h3 className="text-lg font-semibold text-gray-800">Add your first transaction</h3>
        <p className="mt-2 text-sm text-gray-500">Start by adding income or expense from the button above.</p>
      </section>
    );
  }

  return (
    <section className="mx-6 overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[110px]" />
            <col className="w-[110px]" />
            <col className="w-[160px]" />
            <col />
            <col className="w-[130px]" />
            <col className="w-[120px]" />
          </colgroup>
          <thead className="h-10 bg-gray-50 text-[11px] font-medium uppercase tracking-wider text-gray-400">
            <tr>
              <th className="px-5 py-2">Date</th>
              <th className="px-5 py-2">Type</th>
              <th className="px-5 py-2">Category</th>
              <th className="px-5 py-2">Notes</th>
              <th className="px-5 py-2 text-right">Amount</th>
              <th className="px-5 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.type}-${item._id}`} className="h-14 border-b border-gray-50 transition hover:bg-[#F8F9FF]">
                <td className="px-5 py-3 text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${item.type === 'Income' ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm font-medium text-gray-700">{item.category}</td>
                <td className="max-w-[320px] truncate px-5 py-3 text-sm text-gray-500">{item.notes || 'No notes'}</td>
                <td className={`px-5 py-3 text-right text-sm font-medium ${item.type === 'Income' ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
                  {item.type === 'Income' ? '+' : '-'}{currencyFormatter(Math.abs(item.amount))}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="text-gray-400 transition hover:text-[#5B5BD6]"
                      aria-label="Edit transaction"
                    >
                      <PencilLine size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      disabled={deletingId === item._id}
                      className="text-gray-400 transition hover:text-red-500 disabled:opacity-60"
                      aria-label="Delete transaction"
                    >
                      <Trash2 size={16} />
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
