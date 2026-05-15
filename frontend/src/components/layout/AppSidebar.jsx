import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Wallet, PiggyBank, ChartNoAxesCombined, Settings } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/savings', label: 'Savings', icon: PiggyBank },
  { to: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { to: '/settings', label: 'Settings', icon: Settings },
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
          {navItems.map((item) => {
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
        </nav>

        <div className="sidebar-card">
          <p className="sidebar-card-title">Upgrade to Premium</p>
          <p className="sidebar-card-text">Unlock exclusive features and AI insights.</p>
          <button className="sidebar-card-button" type="button">
            Upgrade Now
          </button>
        </div>

        <button className="sidebar-logout" type="button" onClick={onLogout}>
          Logout
        </button>
      </aside>
    </>
  );
};

export default AppSidebar;
