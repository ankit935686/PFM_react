const FiltersBar = ({ filters, onChange, onReset, categories }) => {
  return (
    <section className="rounded-2xl border border-[#1F2937] bg-[#111827] p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input
          className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
          name="search"
          value={filters.search}
          onChange={onChange}
          placeholder="Search notes or category"
        />

        <select
          className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
          name="type"
          value={filters.type}
          onChange={onChange}
        >
          <option value="All">All Types</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>

        <select
          className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
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
          className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
          name="startDate"
          type="date"
          value={filters.startDate}
          onChange={onChange}
        />

        <div className="flex gap-2">
          <input
            className="w-full rounded-xl border border-[#1F2937] bg-[#0B0F19] px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={onChange}
          />
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-[#1F2937] px-3 py-2.5 text-sm text-slate-200 hover:border-slate-500"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
};

export default FiltersBar;
