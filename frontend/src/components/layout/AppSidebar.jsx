import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Wallet, PiggyBank, ChartNoAxesCombined, Settings, CalendarDays, Users, CircleDollarSign } from 'lucide-react';

const navSections = [
  {
    label: 'Main',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Finance',
    items: [
      { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
      { to: '/budget', label: 'Budget', icon: Wallet },
      { to: '/savings', label: 'Savings', icon: PiggyBank },
      { to: '/groups', label: 'Groups', icon: Users },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Settings',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
];

const AppSidebar = ({ mobileOpen, onToggleMobile, onLogout }) => {
  return (
    <>
      {mobileOpen && (
        <button
          className="sidebar-overlay"
          type="button"
          onClick={onToggleMobile}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`app-sidebar ${mobileOpen ? 'is-open' : ''} !font-[Nunito] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBFCFF_100%)]`}
      >
        <div className="sidebar-brand border-b border-[#EEF1F7] pb-3">
          <span className="sidebar-logo !h-11 !w-11 !rounded-xl !bg-[linear-gradient(135deg,#6EC6E6,#A78BFA)] !text-white shadow-[0_10px_24px_-14px_rgba(91,91,214,0.45)]">
            <CircleDollarSign size={20} />
          </span>
          <div>
            <p className="sidebar-title !text-[25px] !font-extrabold !tracking-[-0.01em] !text-[#1E1E2D]">FinTrack</p>
            <p className="sidebar-subtitle !text-[12px] !font-medium !text-[#7D8597]">Light Dashboard</p>
          </div>
        </div>

        <nav className="sidebar-nav mt-2 space-y-2">
          {navSections.map((section) => (
            <div key={section.label} className="sidebar-nav-section">
              <p className="sidebar-nav-label px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">{section.label}</p>
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-[16px] font-semibold transition ${
                        isActive
                          ? 'is-active bg-[#EEF0FF] text-[#5B5BD6] shadow-[inset_0_0_0_1px_#D9DCFF]'
                          : 'text-[#6B7280] hover:bg-[#F8F9FF] hover:text-[#1E1E2D]'
                      }`
                    }
                    onClick={() => {
                      if (mobileOpen) {
                        onToggleMobile();
                      }
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                            isActive ? 'bg-white text-[#5B5BD6]' : 'bg-[#F3F5FA] text-[#9CA3AF]'
                          }`}
                        >
                          <Icon size={18} strokeWidth={2.2} />
                        </span>
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <button className="sidebar-logout !rounded-xl !border-[#E8EAF6] !bg-white !text-[14px] !font-semibold !text-[#6B7280] hover:!bg-[#F8F9FF] hover:!text-[#1E1E2D]" type="button" onClick={onLogout}>
          Logout
        </button>
      </aside>
    </>
  );
};

export default AppSidebar;
