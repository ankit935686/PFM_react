import { Search } from 'lucide-react';

const ExpenseFilters = ({ filters, onChange, onReset }) => {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/10 backdrop-blur-xl md:p-5">
      <div className="grid gap-4 lg:grid-cols-4">
        <label className="grid gap-2 lg:col-span-2">
          <span className="text-sm font-medium text-slate-300">Search notes</span>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3 pl-11 pr-4 text-slate-100 outline-none transition focus:border-cyan-400"
              name="search"
              value={filters.search}
              onChange={onChange}
              placeholder="Search by note or category"
            />
          </div>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-300">Category</span>
          <select
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
            name="category"
            value={filters.category}
            onChange={onChange}
          >
            <option value="All">All</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Shopping">Shopping</option>
            <option value="Rent">Rent</option>
            <option value="Utilities">Utilities</option>
            <option value="Health">Health</option>
            <option value="Education">Education</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Travel">Travel</option>
            <option value="Groceries">Groceries</option>
            <option value="Bills">Bills</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-300">From</span>
          <input
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
            name="startDate"
            type="date"
            value={filters.startDate}
            onChange={onChange}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-300">To</span>
          <input
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={onChange}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">Use the filters above to narrow down your expenses.</p>
        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/5"
        >
          Reset filters
        </button>
      </div>
    </section>
  );
};

export default ExpenseFilters;
