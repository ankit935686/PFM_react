import { useMemo, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Calendar, Menu, Moon, Plus, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AppSidebar from './AppSidebar';
import NotificationBell from './NotificationBell';

const monthOptions = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const AppLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const userLabel = currentUser?.displayName || currentUser?.email || 'Guest user';
  const userInitial = userLabel ? userLabel.trim().charAt(0).toUpperCase() : 'G';
  const availableYears = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => currentDate.getFullYear() - 3 + index);
  }, [currentDate]);

  const selectedPeriodLabel = `${monthOptions[selectedMonth - 1]} ${selectedYear}`;

  const outletContext = useMemo(
    () => ({
      selectedMonth,
      selectedYear,
      selectedPeriodLabel,
      setSelectedMonth,
      setSelectedYear,
    }),
    [selectedMonth, selectedYear, selectedPeriodLabel]
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <main className="app-shell">
      <AppSidebar
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((prev) => !prev)}
        onLogout={handleLogout}
      />

      <section className="app-content">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              className="app-menu-btn"
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>

            <div className="topbar-search">
              <Search size={16} className="topbar-search-icon" />
              <input type="search" placeholder="Search transactions, categories..." />
            </div>

            <div className="topbar-period" aria-label="Dashboard month selector">
              <Calendar size={16} className="topbar-period-icon" />
              <div className="topbar-period-fields">
                <select
                  className="topbar-period-select"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(Number(event.target.value))}
                  aria-label="Select month"
                >
                  {monthOptions.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  className="topbar-period-select"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                  aria-label="Select year"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="topbar-actions">
            <NotificationBell userId={currentUser?.uid} userLabel={userLabel} />
            <button className="icon-btn" type="button" aria-label="Toggle theme">
              <Moon size={18} />
            </button>

            <div className="user-pill">
              <span className="user-avatar">{userInitial}</span>
              <div>
                <p className="user-greeting">Hi, {userLabel.split(' ')[0] || 'User'}</p>
                <p className="user-subtitle">Personal Finance</p>
              </div>
            </div>
          </div>
        </header>

        <div className="app-page">
          <Outlet context={outletContext} />
        </div>
      </section>

      <Link to="/transactions?quickAdd=1" className="fab-add">
        <Plus size={16} />
      </Link>
    </main>
  );
};

export default AppLayout;
