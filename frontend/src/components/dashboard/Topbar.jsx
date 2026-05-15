import { UserCircle2 } from 'lucide-react';

const Topbar = ({ userEmail, onOpenExpenses, onOpenIncome, onOpenProfile }) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1F2937] bg-[#111827] p-4 shadow-lg shadow-black/20">
      <div>
        <h1 className="text-2xl font-semibold text-[#E5E7EB]">Finance Dashboard</h1>
        <p className="text-sm text-slate-400">Track income, expenses, and net cash flow with live data</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
          type="button"
          onClick={onOpenIncome}
        >
          Open Income
        </button>

        <button
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400"
          type="button"
          onClick={onOpenExpenses}
        >
          Open Expenses
        </button>

        <button
          className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-4 py-2 text-sm font-medium text-white transition hover:border-slate-500"
          type="button"
          onClick={onOpenProfile}
        >
          Update Profile
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
