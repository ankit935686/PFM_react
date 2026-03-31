import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const statusStyles = {
  Completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Processing: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Failed: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const chips = ['All', 'Completed', 'Pending', 'Processing', 'Failed'];

const TransactionsTable = ({ transactions, currencyFormatter }) => {
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('All');

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const byChip = activeChip === 'All' || tx.status === activeChip;
      const query = search.trim().toLowerCase();
      const bySearch =
        !query ||
        tx.title.toLowerCase().includes(query) ||
        tx.category.toLowerCase().includes(query) ||
        tx.date.toLowerCase().includes(query);

      return byChip && bySearch;
    });
  }, [transactions, activeChip, search]);

  return (
    <section className="rounded-2xl border border-[#1F2937] bg-[#111827] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#E5E7EB]">Transactions</h2>

        <div className="relative min-w-55">
          <Search size={15} className="pointer-events-none absolute left-3 top-2.5 text-slate-500" />
          <input
            className="w-full rounded-xl border border-[#1F2937] bg-[#0B0F19] py-2 pl-9 pr-3 text-sm text-[#E5E7EB] outline-none focus:border-blue-500"
            placeholder="Search transactions..."
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
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <motion.tr
                key={tx.id}
                whileHover={{ scale: 1.005 }}
                className="rounded-xl bg-[#0B0F19] text-[#E5E7EB]"
              >
                <td className="rounded-l-xl px-3 py-3 text-slate-300">{tx.date}</td>
                <td className="px-3 py-3">{tx.title}</td>
                <td className="px-3 py-3 text-slate-300">{tx.category}</td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${
                      statusStyles[tx.status] || 'border-slate-500 text-slate-300'
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className={`rounded-r-xl px-3 py-3 text-right font-medium ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tx.amount >= 0 ? '+' : '-'}
                  {currencyFormatter(Math.abs(tx.amount))}
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
