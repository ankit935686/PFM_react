import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { formatCurrency } from '../lib/currency';
import Sidebar from '../components/dashboard/Sidebar';
import Topbar from '../components/dashboard/Topbar';
import StatCard from '../components/dashboard/StatCard';
import ChartsSection from '../components/dashboard/ChartsSection';
import TransactionsTable from '../components/dashboard/TransactionsTable';
import {
  categoryDistribution,
  monthlySpending,
  sidebarItems,
  statCards,
  transactions,
} from '../components/dashboard/dashboardData';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeItem, setActiveItem] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [month, setMonth] = useState('Month to date');
  const [account, setAccount] = useState('All accounts');
  const [category, setCategory] = useState('All categories');

  const profileIncomplete = useMemo(() => {
    if (!profile) {
      return true;
    }

    return !(
      profile.fullName &&
      profile.country &&
      profile.currency &&
      Number(profile.monthlyIncome) > 0 &&
      Number(profile.monthlyBudget) > 0 &&
      Number(profile.savingsGoal) > 0
    );
  }, [profile]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.uid) {
        return;
      }

      try {
        const response = await api.get(`/api/profile/${currentUser.uid}`);
        setProfile(response.data?.profile || null);
      } catch (_profileError) {
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  const handleLogout = async () => {
    setError('');

    try {
      await logout();
      navigate('/login');
    } catch (logoutError) {
      setError(logoutError.message);
    }
  };

  const currency = profile?.currency || 'INR';
  const dashboardCards = useMemo(() => {
    const income = Number(profile?.monthlyIncome || 0);
    const expenses = Number(profile?.monthlyBudget || 0);
    const balance = income - expenses;
    const savings = Number(profile?.savingsGoal || 0);

    return statCards.map((card) => {
      if (card.key === 'income') {
        return { ...card, value: income || card.value };
      }

      if (card.key === 'expenses') {
        return { ...card, value: expenses || card.value };
      }

      if (card.key === 'balance') {
        return { ...card, value: income || expenses ? balance : card.value };
      }

      if (card.key === 'savings') {
        return { ...card, value: savings || card.value };
      }

      return card;
    });
  }, [profile]);

  const currencyFormatter = (value) => formatCurrency(value, currency);

  return (
    <main className="min-h-screen bg-[#0B0F19] text-slate-100">
      <Sidebar
        items={sidebarItems}
        activeItem={activeItem}
        onSelect={setActiveItem}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((prev) => !prev)}
      />

      <section className="md:ml-64">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_45%),linear-gradient(180deg,#0B0F19_0%,#0E1423_100%)] p-4 pt-16 md:p-6 md:pt-6">
          <Topbar
            month={month}
            setMonth={setMonth}
            account={account}
            setAccount={setAccount}
            category={category}
            setCategory={setCategory}
            userEmail={currentUser?.email}
          />

          <div className="mt-5">
            <h2 className="text-2xl font-bold text-[#E5E7EB]">
              Welcome back, {profile?.fullName || currentUser?.email?.split('@')[0] || 'Investor'}
            </h2>
            <p className="text-sm text-slate-400">Your money movement and goals, all in one place.</p>
          </div>

          {!profileLoading && profileIncomplete && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-amber-100"
            >
              <p className="font-semibold">Complete your profile for a personalized dashboard.</p>
              <p className="mt-1 text-sm text-amber-100/80">
                Add income, budget, goal, and preferred currency to unlock better planning.
              </p>
              <Link
                to="/profile-setup"
                className="mt-3 inline-block rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Fill profile now
              </Link>
            </motion.div>
          )}

          <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map((card) => (
              <StatCard key={card.key} card={card} currencyFormatter={currencyFormatter} />
            ))}
          </section>

          <div className="mt-5">
            <ChartsSection monthlySpending={monthlySpending} categoryDistribution={categoryDistribution} />
          </div>

          <div className="mt-5">
            <TransactionsTable transactions={transactions} currencyFormatter={currencyFormatter} />
          </div>

          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        </div>
      </section>
    </main>
  );
};

export default DashboardPage;
