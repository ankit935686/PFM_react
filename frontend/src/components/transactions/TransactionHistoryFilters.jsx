import { motion } from 'framer-motion';
import { Calendar, Search } from 'lucide-react';

const TransactionHistoryFilters = ({
  filters,
  onFilterChange,
  categories,
  loading,
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({
      ...filters,
      [name]: value,
      page: 1, // Reset to first page when filter changes
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-6 mb-5 rounded-xl border border-gray-100 bg-white px-5 py-4"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-400">Search</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleInputChange}
              placeholder="Search category, notes..."
              disabled={loading}
              className="h-[38px] w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-[#5B5BD6] disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-400">Type</label>
          <select
            name="type"
            value={filters.type}
            onChange={handleInputChange}
            disabled={loading}
            className="h-[38px] w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#5B5BD6] disabled:opacity-50"
          >
            <option value="All">All Transactions</option>
            <option value="Income">Income Only</option>
            <option value="Expense">Expense Only</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-400">Category</label>
          <select
            name="category"
            value={filters.category}
            onChange={handleInputChange}
            disabled={loading}
            className="h-[38px] w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#5B5BD6] disabled:opacity-50"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-400">From Date</label>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleInputChange}
              disabled={loading}
              className="h-[38px] w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-[#5B5BD6] disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-400">To Date</label>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleInputChange}
              disabled={loading}
              className="h-[38px] w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-[#5B5BD6] disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-400">Sort By</label>
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleInputChange}
            disabled={loading}
            className="h-[38px] w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#5B5BD6] disabled:opacity-50"
          >
            <option value="date">Date (Newest)</option>
            <option value="amount">Amount (Highest)</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
};

export default TransactionHistoryFilters;
