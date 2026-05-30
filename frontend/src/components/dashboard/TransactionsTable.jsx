import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  UtensilsCrossed,
  ShoppingBag,
  Car,
  Home,
  Receipt,
  Tv,
  HeartPulse,
  Landmark,
  BriefcaseBusiness,
  Wallet,
  Plane,
  CircleDollarSign,
} from 'lucide-react';

const chips = ['All', 'Income', 'Expense'];

const categoryIconMap = [
  { match: ['food', 'restaurant', 'grocery', 'cafe', 'coffee'], icon: UtensilsCrossed },
  { match: ['shop', 'shopping', 'online'], icon: ShoppingBag },
  { match: ['rent', 'house', 'home'], icon: Home },
  { match: ['transport', 'travel', 'uber', 'taxi', 'fuel', 'car'], icon: Car },
  { match: ['utility', 'electric', 'water', 'gas', 'bill'], icon: Tv },
  { match: ['health', 'medical', 'pharmacy', 'doctor'], icon: HeartPulse },
  { match: ['salary', 'payroll', 'income', 'job'], icon: BriefcaseBusiness },
  { match: ['invest', 'investment', 'stock', 'mutual', 'sip'], icon: Landmark },
  { match: ['trip', 'flight', 'vacation'], icon: Plane },
];

const getTransactionIcon = (entry) => {
  const haystack = `${entry.title || ''} ${entry.category || ''}`.toLowerCase();
  const mapped = categoryIconMap.find((item) => item.match.some((token) => haystack.includes(token)));
  if (mapped) return mapped.icon;
  return entry.kind === 'income' ? Wallet : Receipt;
};

export const TransactionsTable = ({ recentActivity, currencyFormatter }) => {
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
    <section
      className="theme-surface !font-[Nunito] rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 backdrop-blur-sm"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">Recent Transactions</h2>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className="h-8 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] pl-8 pr-3 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-2 flex gap-2">
        {chips.map((chip) => (
          <button
            key={chip}
            className={`rounded-md border px-3 py-1 text-[10px] font-semibold ${activeChip === chip ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'}`}
            type="button"
            onClick={() => setActiveChip(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="grid gap-2">
        {filtered.map((entry) => (
          <motion.div key={entry.id} whileHover={{ y: -2 }} className="theme-surface transaction-row grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 hover:bg-[var(--bg-hover)]">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                entry.kind === 'income'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                  : 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]'
              }`}
              data-kind={entry.kind}
            >
              {(() => {
                const Icon = getTransactionIcon(entry) || CircleDollarSign;
                return <Icon size={18} strokeWidth={2.2} />;
              })()}
            </div>
            <div className="transaction-details">
              <p className="transaction-title text-[12px] font-semibold text-[var(--text-primary)]">{entry.title}</p>
              <p className="transaction-meta text-[10px] text-[var(--text-secondary)]">
                {entry.category} •{' '}
                {new Date(entry.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className={`transaction-status rounded-full border px-2 py-1 text-[9px] font-bold ${entry.kind === 'income' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {entry.kind === 'income' ? 'Credited' : 'Debited'}
            </div>
            <div className="transaction-amount text-[11px] font-semibold" data-kind={entry.kind}>
              {entry.kind === 'income' ? '+' : '-'}
              {currencyFormatter(Math.abs(entry.amount))}
            </div>
          </motion.div>
        ))}

        {!filtered.length && <p className="transactions-empty">No transactions match your filters.</p>}
      </div>
    </section>
  );
};

export default TransactionsTable;
