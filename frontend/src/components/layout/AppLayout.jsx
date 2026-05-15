import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AppSidebar from './AppSidebar';

const AppLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <main className="min-h-screen bg-[#0B0F19] text-slate-100">
      <AppSidebar mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen((prev) => !prev)} />

      <section className="md:ml-64">
        <header className="sticky top-0 z-20 border-b border-[#1F2937] bg-[#0D1526]/92 backdrop-blur px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#1F2937] bg-[#111827] md:hidden"
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Open navigation"
              >
                <Menu size={18} />
              </button>
              <p className="text-sm text-slate-300">Clear, unified money management</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </section>

      <Link
        to="/transactions?quickAdd=1"
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:scale-[1.02]"
      >
        <Plus size={16} />
        Add Transaction
      </Link>
    </main>
  );
};

export default AppLayout;
