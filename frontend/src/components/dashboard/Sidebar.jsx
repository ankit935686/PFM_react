import { motion } from 'framer-motion';
import { Home, Wallet, ReceiptText, ChartColumnBig, Target, Settings, LogOut, Menu, Landmark } from 'lucide-react';

const icons = {
  overview: Home,
  income: Landmark,
  expenses: Wallet,
  transactions: ReceiptText,
  reports: ChartColumnBig,
  budgets: Wallet,
  goals: Target,
  settings: Settings,
};

const Sidebar = ({ items, activeItem, onSelect, onLogout, mobileOpen, onToggleMobile }) => {
  return (
    <>
      <button
        className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#1F2937] bg-[#111827] text-[#E5E7EB] md:hidden"
        type="button"
        onClick={onToggleMobile}
        aria-label="Toggle navigation"
      >
        <Menu size={18} />
      </button>

      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          type="button"
          onClick={onToggleMobile}
          aria-label="Close sidebar backdrop"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-[#1F2937] bg-[#0E1423] p-4 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center gap-3 px-2">
          <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-blue-500 to-cyan-400 font-bold text-white">
            W
          </span>
          <div>
            <p className="font-semibold text-[#E5E7EB]">WealthWise</p>
            <p className="text-xs text-slate-400">Finance command center</p>
          </div>
        </div>

        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = icons[item.key] || Home;
            const isActive = activeItem === item.key;

            return (
              <button
                key={item.key}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  isActive
                    ? 'bg-white text-[#0B0F19]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
                type="button"
                onClick={() => onSelect(item.key)}
              >
                <Icon size={16} />
                <span>{item.label}</span>

                {isActive && (
                  <motion.span
                    layoutId="activeSidebarPill"
                    className="absolute inset-0 -z-10 rounded-xl bg-white"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <button
          className="mt-8 flex w-full items-center gap-3 rounded-xl border border-[#1F2937] px-3 py-2.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          type="button"
          onClick={onLogout}
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
