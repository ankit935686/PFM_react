import { Search } from 'lucide-react';

const FiltersBar = ({ filters, onChange, onReset, categories }) => {
  return (
    <section className="mx-6 mb-4 rounded-xl border border-gray-100 bg-white px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[180px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="h-[38px] w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-[#5B5BD6]"
            name="search"
            value={filters.search}
            onChange={onChange}
            placeholder="Search notes or category..."
          />
        </div>

        <select
          className="h-[38px] min-w-[140px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#5B5BD6]"
          name="type"
          value={filters.type}
          onChange={onChange}
        >
          <option value="All">All Types</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>

        <select
          className="h-[38px] min-w-[140px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#5B5BD6]"
          name="category"
          value={filters.category}
          onChange={onChange}
        >
          <option value="All">All Categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input
          className="h-[38px] min-w-[130px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#5B5BD6]"
          name="startDate"
          type="date"
          value={filters.startDate}
          onChange={onChange}
        />

        <input
          className="h-[38px] min-w-[130px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#5B5BD6]"
          name="endDate"
          type="date"
          value={filters.endDate}
          onChange={onChange}
        />

        <button
          type="button"
          onClick={onReset}
          className="ml-auto text-sm text-[#5B5BD6] hover:underline"
        >
          Reset
        </button>
      </div>
    </section>
  );
};

export default FiltersBar;
