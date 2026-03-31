import { Filter, UserCircle2 } from 'lucide-react';

const Topbar = ({ month, setMonth, account, setAccount, category, setCategory, userEmail }) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1F2937] bg-[#111827] p-4 shadow-lg shadow-black/20">
      <div>
        <h1 className="text-2xl font-semibold text-[#E5E7EB]">Finance Dashboard</h1>
        <p className="text-sm text-slate-400">Track your money with clarity and confidence</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3 py-2 text-sm text-[#E5E7EB] outline-none focus:border-blue-500"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          <option>Month to date</option>
          <option>Last month</option>
          <option>Last 3 months</option>
          <option>Year to date</option>
        </select>

        <select
          className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3 py-2 text-sm text-[#E5E7EB] outline-none focus:border-blue-500"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        >
          <option>All accounts</option>
          <option>Primary Account</option>
          <option>Savings Account</option>
        </select>

        <select
          className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3 py-2 text-sm text-[#E5E7EB] outline-none focus:border-blue-500"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>All categories</option>
          <option>Income</option>
          <option>Investments</option>
          <option>Lifestyle</option>
        </select>

        <button
          className="inline-flex items-center gap-2 rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
          type="button"
        >
          <Filter size={15} />
          Filters
        </button>

        <button
          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
          type="button"
        >
          Add Transaction
        </button>

        <div className="inline-flex items-center gap-2 rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3 py-2 text-sm text-slate-300">
          <UserCircle2 size={16} />
          <span className="max-w-36 truncate">{userEmail || 'Guest user'}</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
