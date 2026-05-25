import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Wallet, PiggyBank, ChartNoAxesCombined, Settings, CalendarDays, Users } from 'lucide-react';

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
        className={`app-sidebar ${mobileOpen ? 'is-open' : ''}`}
      >
        <div className="sidebar-brand">
          <span className="sidebar-logo">
            W
          </span>
          <div>
            <p className="sidebar-title">FinTrack</p>
            <p className="sidebar-subtitle">Personal Finance</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.label} className="sidebar-nav-section">
              <p className="sidebar-nav-label">{section.label}</p>
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'is-active' : ''}`
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
            </div>
          ))}
        </nav>

        <button className="sidebar-logout" type="button" onClick={onLogout}>
          Logout
        </button>
      </aside>
    </>
  );
};

export default AppSidebar;
