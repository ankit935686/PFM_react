import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const chips = ['All', 'Income', 'Expense'];

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
    <section className="transactions-card">
      <div className="transactions-header">
        <h2>Recent Transactions</h2>

        <div className="transactions-search">
          <Search size={15} className="transactions-search-icon" />
          <input
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="transactions-chips">
        {chips.map((chip) => (
          <button
            key={chip}
            className={`chip ${activeChip === chip ? 'is-active' : ''}`}
            type="button"
            onClick={() => setActiveChip(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="transactions-list">
        {filtered.map((entry) => (
          <motion.div key={entry.id} whileHover={{ y: -2 }} className="transaction-row">
            <div className="transaction-icon" data-kind={entry.kind}>
              {entry.title.charAt(0).toUpperCase()}
            </div>
            <div className="transaction-details">
              <p className="transaction-title">{entry.title}</p>
              <p className="transaction-meta">
                {entry.category} •{' '}
                {new Date(entry.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className={`transaction-status ${entry.kind === 'income' ? 'is-paid' : 'is-pending'}`}>
              {entry.kind === 'income' ? 'Credited' : 'Debited'}
            </div>
            <div className="transaction-amount" data-kind={entry.kind}>
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
