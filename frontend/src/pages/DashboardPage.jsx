import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { useIncome } from '../context/IncomeContext';
import api from '../lib/api';
import { formatCurrency } from '../lib/currency';
import StatCard from '../components/dashboard/StatCard';
import ChartsSection from '../components/dashboard/ChartsSection';
import TransactionsTable from '../components/dashboard/TransactionsTable';

const chartPalette = ['#3B82F6', '#22C55E', '#F59E0B', '#A855F7', '#EC4899', '#14B8A6'];

const buildStatCards = (summary, currency) => [
  {
    key: 'balance',
    title: 'Total Balance',
    value: Number(summary.totalBalance || 0),
    trend: `${currency}`,
    trendDirection: Number(summary.totalBalance || 0) >= 0 ? 'up' : 'down',
  },
  {
    key: 'income',
    title: 'Monthly Income',
    value: Number(summary.monthlyIncome || 0),
    trend: `${currency}`,
    trendDirection: 'up',
  },
  {
    key: 'expenses',
    title: 'Monthly Expenses',
    value: Number(summary.monthlyExpenses || 0),
    trend: `${currency}`,
    trendDirection: 'down',
  },
  {
    key: 'savings',
    title: 'Savings',
    value: Number(summary.totalSavings || 0),
    trend: Number(summary.totalSavings || 0) >= 0 ? 'Net positive' : 'Net negative',
    trendDirection: Number(summary.totalSavings || 0) >= 0 ? 'up' : 'down',
  },
];

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { income, loading: incomeLoading } = useIncome();
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalSavings: 0,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [expenseCategoryData, setExpenseCategoryData] = useState([]);
  const [monthlyExpenseData, setMonthlyExpenseData] = useState([]);
  const [incomeExpenseTrendData, setIncomeExpenseTrendData] = useState([]);

  const liveIncomeEntries = useMemo(
    () => income.map((entry) => ({ ...entry, kind: 'income' })),
    [income]
  );
  const liveExpenseEntries = useMemo(
    () => expenses.map((entry) => ({ ...entry, kind: 'expense' })),
    [expenses]
  );

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

  const currency = profile?.currency || 'INR';

  const dashboardCards = useMemo(() => buildStatCards(summary, currency), [summary, currency]);

  const hasNoSummaryData = useMemo(() => {
    return (
      Number(summary.totalBalance || 0) === 0 &&
      Number(summary.monthlyIncome || 0) === 0 &&
      Number(summary.monthlyExpenses || 0) === 0 &&
      Number(summary.totalSavings || 0) === 0
    );
  }, [summary]);

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

  useEffect(() => {
    const loadSummary = async () => {
      if (!currentUser?.uid) {
        setSummaryLoading(false);
        setSummary({
          totalBalance: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          totalSavings: 0,
        });
        return;
      }

      setSummaryLoading(true);

      try {
        const token = await currentUser.getIdToken();
        const response = await api.get('/api/dashboard/summary', {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-firebase-uid': currentUser.uid,
            'x-firebase-email': currentUser.email || '',
          },
        });

        const nextSummary = response.data?.summary || {};

        setSummary({
          totalBalance: Number(nextSummary.totalBalance || 0),
          monthlyIncome: Number(nextSummary.monthlyIncome || 0),
          monthlyExpenses: Number(nextSummary.monthlyExpenses || 0),
          totalSavings: Number(nextSummary.totalSavings || 0),
        });
      } catch (summaryError) {
        setError(summaryError.response?.data?.message || 'Failed to load dashboard summary.');
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSummary();
  }, [currentUser]);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!currentUser?.uid) {
        setAnalyticsLoading(false);
        setExpenseCategoryData([]);
        setMonthlyExpenseData([]);
        setIncomeExpenseTrendData([]);
        return;
      }

      setAnalyticsLoading(true);

      try {
        const token = await currentUser.getIdToken();
        const headers = {
          Authorization: `Bearer ${token}`,
          'x-firebase-uid': currentUser.uid,
          'x-firebase-email': currentUser.email || '',
        };

        const [categoriesResponse, monthlyResponse, trendResponse] = await Promise.all([
          api.get('/api/dashboard/analytics/expense-categories', { headers }),
          api.get('/api/dashboard/analytics/monthly-expenses', { headers }),
          api.get('/api/dashboard/analytics/income-expense-trend', { headers }),
        ]);

        const categories = (categoriesResponse.data?.categories || []).map((item, index) => ({
          category: item.category,
          total: Number(item.total || 0),
          color: chartPalette[index % chartPalette.length],
        }));

        setExpenseCategoryData(categories);
        setMonthlyExpenseData(monthlyResponse.data?.monthlyExpenses || []);
        setIncomeExpenseTrendData(trendResponse.data?.trend || []);
      } catch (analyticsError) {
        setError(analyticsError.response?.data?.message || 'Failed to load dashboard analytics.');
        setExpenseCategoryData([]);
        setMonthlyExpenseData([]);
        setIncomeExpenseTrendData([]);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadAnalytics();
  }, [currentUser]);

  const currencyFormatter = (value) => formatCurrency(value, currency);

  const budgetPreview = useMemo(() => {
    const monthlyBudget = Number(profile?.monthlyBudget || 0);
    const used = Number(summary.monthlyExpenses || 0);
    const remaining = Math.max(0, monthlyBudget - used);
    const usagePercent = monthlyBudget > 0 ? Math.min(100, Math.round((used / monthlyBudget) * 100)) : 0;

    return {
      monthlyBudget,
      used,
      remaining,
      usagePercent,
    };
  }, [profile, summary]);

  const recentActivity = useMemo(() => {
    return [...liveIncomeEntries, ...liveExpenseEntries]
      .map((entry) => ({
        id: entry._id,
        kind: entry.kind,
        date: entry.date,
        title: entry.kind === 'income' ? entry.source : entry.category,
        category: entry.kind === 'income' ? entry.source : entry.category,
        note: entry.notes || '',
        amount: Number(entry.amount || 0),
      }))
      .sort((left, right) => new Date(right.date) - new Date(left.date))
      .slice(0, 5);
  }, [liveIncomeEntries, liveExpenseEntries]);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Read-only summary of your finances with live analytics.</p>
      </div>

      {!profileLoading && profileIncomplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-amber-100"
        >
          <p className="font-semibold">Complete your profile for more accurate budgeting insights.</p>
          <p className="mt-1 text-sm text-amber-100/80">
            Add monthly budget and savings target from the profile setup page.
          </p>
          <Link
            to="/profile-setup"
            className="mt-3 inline-block rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900"
          >
            Open profile setup
          </Link>
        </motion.div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryLoading
          ? [1, 2, 3, 4].map((item) => (
              <article
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-[#1F2937] bg-[#111827] p-4"
              />
            ))
          : dashboardCards.map((card) => (
              <StatCard key={card.key} card={card} currencyFormatter={currencyFormatter} />
            ))}
      </section>

      {!summaryLoading && hasNoSummaryData && (
        <p className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3 text-sm text-slate-400">
          No transactions yet. Open Transactions and add your first income or expense.
        </p>
      )}

      <ChartsSection
        expenseCategoryData={expenseCategoryData}
        monthlyExpenseData={monthlyExpenseData}
        incomeExpenseTrendData={incomeExpenseTrendData}
        currencyFormatter={currencyFormatter}
        loading={analyticsLoading}
      />

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <TransactionsTable recentActivity={recentActivity} currencyFormatter={currencyFormatter} />

        <article className="rounded-2xl border border-[#1F2937] bg-[#111827] p-4">
          <h2 className="text-base font-semibold text-slate-100">Budget Preview</h2>

          {budgetPreview.monthlyBudget > 0 ? (
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>Monthly Budget: <span className="font-semibold text-slate-100">{currencyFormatter(budgetPreview.monthlyBudget)}</span></p>
              <p>Spent This Month: <span className="font-semibold text-rose-300">{currencyFormatter(budgetPreview.used)}</span></p>
              <p>Remaining: <span className="font-semibold text-emerald-300">{currencyFormatter(budgetPreview.remaining)}</span></p>
              <div className="h-2 overflow-hidden rounded-full bg-[#0B0F19]">
                <div
                  className="h-full bg-linear-to-r from-cyan-400 to-blue-500"
                  style={{ width: `${budgetPreview.usagePercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">{budgetPreview.usagePercent}% budget used</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Set a monthly budget in profile setup to see budget preview.</p>
          )}
        </article>
      </section>

      {(summaryLoading || analyticsLoading || expensesLoading || incomeLoading) && (
        <p className="text-sm text-slate-400">Loading live income and expense data...</p>
      )}

      {error && <p className="text-sm text-rose-300">{error}</p>}
    </section>
  );
};

export default DashboardPage;




