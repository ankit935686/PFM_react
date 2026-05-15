import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, BarChart3, Calendar, Search } from 'lucide-react';

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
      className="space-y-4 p-6 bg-[#111827] border border-[#1F2937] rounded-2xl"
    >
      <h3 className="text-lg font-semibold text-[#E5E7EB] mb-4">Filter Transactions</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-[#D1D5DB] mb-2">Search</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleInputChange}
              placeholder="Search category, notes..."
              disabled={loading}
              className="w-full pl-10 pr-4 py-2 bg-[#0B0F19] border border-[#1F2937] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-blue-500 focus:outline-none transition disabled:opacity-50"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-[#D1D5DB] mb-2">Type</label>
          <select
            name="type"
            value={filters.type}
            onChange={handleInputChange}
            disabled={loading}
            className="w-full px-4 py-2 bg-[#0B0F19] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:border-blue-500 focus:outline-none transition disabled:opacity-50"
          >
            <option value="All">All Transactions</option>
            <option value="Income">Income Only</option>
            <option value="Expense">Expense Only</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-[#D1D5DB] mb-2">Category</label>
          <select
            name="category"
            value={filters.category}
            onChange={handleInputChange}
            disabled={loading}
            className="w-full px-4 py-2 bg-[#0B0F19] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:border-blue-500 focus:outline-none transition disabled:opacity-50"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-[#D1D5DB] mb-2">From Date</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2 bg-[#0B0F19] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:border-blue-500 focus:outline-none transition disabled:opacity-50"
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-[#D1D5DB] mb-2">To Date</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2 bg-[#0B0F19] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:border-blue-500 focus:outline-none transition disabled:opacity-50"
            />
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-[#D1D5DB] mb-2">Sort By</label>
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleInputChange}
            disabled={loading}
            className="w-full px-4 py-2 bg-[#0B0F19] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:border-blue-500 focus:outline-none transition disabled:opacity-50"
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
