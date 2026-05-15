import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Wallet, Target, ChartNoAxesCombined, Settings } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const AppSidebar = ({ mobileOpen, onToggleMobile }) => {
  return (
    <>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          type="button"
          onClick={onToggleMobile}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-[#1F2937] bg-[#0C1322] p-5 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center gap-3">
          <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-cyan-400 to-blue-500 font-bold text-slate-950">
            W
          </span>
          <div>
            <p className="font-semibold text-slate-100">WealthWise</p>
            <p className="text-xs text-slate-400">Personal Finance Tracker</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    isActive
                      ? 'bg-white text-[#0B0F19] font-semibold'
                      : 'text-slate-300 hover:bg-white/8 hover:text-white'
                  }`
                }
                onClick={() => {
                  if (mobileOpen) {
                    onToggleMobile();
                  }
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default AppSidebar;
