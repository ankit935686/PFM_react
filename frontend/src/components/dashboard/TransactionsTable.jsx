import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const typeStyles = {
  income: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  expense: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const chips = ['All', 'Income', 'Expense'];

const TransactionsTable = ({ recentActivity, currencyFormatter }) => {
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('All');

  const filtered = useMemo(() => {
    return recentActivity.filter((entry) => {
      const byChip =
        activeChip === 'All' ||
        (activeChip === 'Income' && entry.kind === 'income') ||
        (activeChip === 'Expense' && entry.kind === 'expense');
      const query = search.trim().toLowerCase();
      const bySearch =
        !query ||
        entry.title.toLowerCase().includes(query) ||
        entry.category.toLowerCase().includes(query) ||
        entry.note.toLowerCase().includes(query) ||
        entry.date.toLowerCase().includes(query);

      return byChip && bySearch;
    });
  }, [recentActivity, activeChip, search]);

  return (
    <section className="rounded-2xl border border-[#1F2937] bg-[#111827] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#E5E7EB]">Recent Activity</h2>

        <div className="relative min-w-55">
          <Search size={15} className="pointer-events-none absolute left-3 top-2.5 text-slate-500" />
          <input
            className="w-full rounded-xl border border-[#1F2937] bg-[#0B0F19] py-2 pl-9 pr-3 text-sm text-[#E5E7EB] outline-none focus:border-blue-500"
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              activeChip === chip
                ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                : 'border-[#1F2937] text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }`}
            type="button"
            onClick={() => setActiveChip(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-180 border-separate border-spacing-y-2 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-400">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Note</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <motion.tr
                key={entry.id}
                whileHover={{ scale: 1.005 }}
                className="rounded-xl bg-[#0B0F19] text-[#E5E7EB]"
              >
                <td className="rounded-l-xl px-3 py-3 text-slate-300">
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${
                      typeStyles[entry.kind] || 'border-slate-500 text-slate-300'
                    }`}
                  >
                    {entry.kind === 'income' ? 'Income' : 'Expense'}
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-300">{entry.category}</td>
                <td className="px-3 py-3">
                  <p className="max-w-60 truncate text-slate-300">{entry.note || 'No note added'}</p>
                </td>
                <td
                  className={`rounded-r-xl px-3 py-3 text-right font-medium ${
                    entry.kind === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {entry.kind === 'income' ? '+' : '-'}
                  {currencyFormatter(Math.abs(entry.amount))}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TransactionsTable;
