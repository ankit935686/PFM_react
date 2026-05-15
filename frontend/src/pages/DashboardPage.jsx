import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useBudgets } from '../context/BudgetContext';
import { useExpenses } from '../context/ExpenseContext';
import { useIncome } from '../context/IncomeContext';
import api from '../lib/api';
import { formatCurrency } from '../lib/currency';
import StatCard from '../components/dashboard/StatCard';
import ChartsSection from '../components/dashboard/ChartsSection';
import TransactionsTable from '../components/dashboard/TransactionsTable';
import SavingsSection from '../components/dashboard/SavingsSection';
import SavingsGoalModal from '../components/dashboard/SavingsGoalModal';

const chartPalette = ['#3B82F6', '#22C55E', '#F59E0B', '#A855F7', '#EC4899', '#14B8A6'];

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

const getDateOnly = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isInMonth = (value, month, year) => {
  const date = getDateOnly(value);

  if (!date) {
    return false;
  }

  return date.getMonth() + 1 === Number(month) && date.getFullYear() === Number(year);
};

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
  const { budgets } = useBudgets();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { income, loading: incomeLoading } = useIncome();
  const outletContext = useOutletContext() || {};
  const currentDate = new Date();
  const selectedMonth = outletContext.selectedMonth || currentDate.getMonth() + 1;
  const selectedYear = outletContext.selectedYear || currentDate.getFullYear();
  const selectedPeriodLabel = outletContext.selectedPeriodLabel || `${monthOptions[selectedMonth - 1]} ${selectedYear}`;
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalSavings: 0,
    cumulativeBalance: 0,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [expenseCategoryData, setExpenseCategoryData] = useState([]);
  const [monthlyExpenseData, setMonthlyExpenseData] = useState([]);
  const [incomeExpenseTrendData, setIncomeExpenseTrendData] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [selectedSavingsTracker, setSelectedSavingsTracker] = useState(null);
  const [showSavingsModal, setShowSavingsModal] = useState(false);

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

  const currencyFormatter = (value) => formatCurrency(value, currency);

  const getAuthHeaders = async () => {
    if (!currentUser) {
      return {};
    }

    const token = await currentUser.getIdToken();

    return {
      Authorization: `Bearer ${token}`,
      'x-firebase-uid': currentUser.uid,
      'x-firebase-email': currentUser.email || '',
    };
  };

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
      .filter((entry) => isInMonth(entry.date, selectedMonth, selectedYear))
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
  }, [liveIncomeEntries, liveExpenseEntries, selectedMonth, selectedYear]);

  const budgetProgressItems = useMemo(() => {
    const periodBudgets = budgets.filter(
      (budget) => Number(budget.month) === Number(selectedMonth) && Number(budget.year) === Number(selectedYear)
    );

    if (!periodBudgets.length) {
      return [];
    }

    const expenseByCategory = expenses.reduce((acc, expense) => {
      if (!isInMonth(expense.date, selectedMonth, selectedYear)) {
        return acc;
      }

      const key = expense.category;
      acc[key] = (acc[key] || 0) + Number(expense.amount || 0);
      return acc;
    }, {});

    return periodBudgets.slice(0, 4).map((budget) => {
      const spent = Number(expenseByCategory[budget.category] || 0);
      const percent = budget.amount > 0 ? Math.min(100, Math.round((spent / budget.amount) * 100)) : 0;

      return {
        category: budget.category,
        spent,
        percent,
      };
    });
  }, [budgets, expenses, selectedMonth, selectedYear]);

  const insights = useMemo(() => {
    const items = [];

    if (Number(summary.monthlyExpenses || 0) > Number(summary.monthlyIncome || 0)) {
      items.push({
        title: 'Spending higher than income',
        detail: 'Expenses exceeded income this month. Consider adjusting budgets.',
      });
    }

    if (budgetPreview.usagePercent >= 80) {
      items.push({
        title: 'Budget nearly used',
        detail: `You have used ${budgetPreview.usagePercent}% of your monthly budget.`,
      });
    }

    if (recentActivity.length === 0) {
      items.push({
        title: 'No recent activity',
        detail: 'Add your first income or expense to see insights here.',
      });
    }

    if (comparison?.deltas?.expenseChange !== null && comparison?.deltas?.expenseChange !== undefined) {
      const direction = comparison.deltas.expenseChange > 0 ? 'increased' : 'decreased';

      items.push({
        title: 'Month-over-month expenses',
        detail: `Expenses ${direction} by ${Math.abs(Math.round(comparison.deltas.expenseChange))}% versus ${comparison.previous.month}/${comparison.previous.year}.`,
      });
    }

    if (comparison?.deltas?.savingsChange !== null && comparison?.deltas?.savingsChange !== undefined) {
      const direction = comparison.deltas.savingsChange > 0 ? 'improved' : 'softened';

      items.push({
        title: 'Savings trend',
        detail: `Monthly savings ${direction} by ${Math.abs(Math.round(comparison.deltas.savingsChange))}% compared with the previous month.`,
      });
    }

    return items.slice(0, 3);
  }, [budgetPreview.usagePercent, comparison, recentActivity.length, summary]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser?.uid) {
        setSummaryLoading(false);
        setAnalyticsLoading(false);
        setSelectedSavingsTracker(null);
        setComparison(null);
        setSummary({
          totalBalance: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          totalSavings: 0,
          cumulativeBalance: 0,
        });
        setExpenseCategoryData([]);
        setMonthlyExpenseData([]);
        setIncomeExpenseTrendData([]);
        return;
      }

      setSummaryLoading(true);
      setAnalyticsLoading(true);
      setError('');

      try {
        const headers = await getAuthHeaders();
        const query = `month=${selectedMonth}&year=${selectedYear}`;

        const [summaryResponse, categoriesResponse, monthlyResponse, trendResponse] = await Promise.all([
          api.get(`/api/dashboard/summary?${query}`, { headers }),
          api.get(`/api/dashboard/analytics/expense-categories?${query}`, { headers }),
          api.get(`/api/dashboard/analytics/monthly-expenses?${query}&months=6`, { headers }),
          api.get(`/api/dashboard/analytics/income-expense-trend?${query}&months=6`, { headers }),
        ]);

        const nextSummary = summaryResponse.data?.summary || {};

        setSummary({
          totalBalance: Number(nextSummary.totalBalance || 0),
          monthlyIncome: Number(nextSummary.monthlyIncome || 0),
          monthlyExpenses: Number(nextSummary.monthlyExpenses || 0),
          totalSavings: Number(nextSummary.totalSavings || 0),
          cumulativeBalance: Number(nextSummary.cumulativeBalance || 0),
        });
        setSelectedSavingsTracker(summaryResponse.data?.savings || null);
        setComparison(summaryResponse.data?.comparison || null);

        const categories = (categoriesResponse.data?.categories || []).map((item, index) => ({
          category: item.category,
          total: Number(item.total || 0),
          color: chartPalette[index % chartPalette.length],
        }));

        setExpenseCategoryData(categories);
        setMonthlyExpenseData(monthlyResponse.data?.monthlyExpenses || []);
        setIncomeExpenseTrendData(trendResponse.data?.trend || []);
      } catch (dashboardError) {
        setError(dashboardError.response?.data?.message || 'Failed to load dashboard data.');
        setSelectedSavingsTracker(null);
        setComparison(null);
        setSummary({
          totalBalance: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          totalSavings: 0,
          cumulativeBalance: 0,
        });
        setExpenseCategoryData([]);
        setMonthlyExpenseData([]);
        setIncomeExpenseTrendData([]);
      } finally {
        setSummaryLoading(false);
        setAnalyticsLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser, selectedMonth, selectedYear]);

  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Read-only summary of your finances with live analytics for {selectedPeriodLabel}.
          </p>
        </div>
      </header>

      {!profileLoading && profileIncomplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-alert"
        >
          <p className="font-semibold">Complete your profile for more accurate budgeting insights.</p>
          <p className="dashboard-alert-subtitle">
            Add monthly budget and savings target from the profile setup page.
          </p>
          <Link
            to="/profile-setup"
            className="dashboard-alert-link"
          >
            Open profile setup
          </Link>
        </motion.div>
      )}

      <section className="stat-grid">
        {summaryLoading
          ? [1, 2, 3, 4].map((item) => (
              <article
                key={item}
                className="stat-card stat-card--loading"
              />
            ))
          : dashboardCards.map((card) => (
              <StatCard key={card.key} card={card} currencyFormatter={currencyFormatter} />
            ))}
      </section>

      {!summaryLoading && hasNoSummaryData && (
        <p className="dashboard-empty">
          No transactions yet. Open Transactions and add your first income or expense.
        </p>
      )}

      <ChartsSection
        expenseCategoryData={expenseCategoryData}
        monthlyExpenseData={monthlyExpenseData}
        incomeExpenseTrendData={incomeExpenseTrendData}
        currencyFormatter={currencyFormatter}
        loading={analyticsLoading}
        selectedPeriodLabel={selectedPeriodLabel}
      />

      <section className="dashboard-lower">
        <TransactionsTable recentActivity={recentActivity} currencyFormatter={currencyFormatter} />

        <div className="dashboard-side">
          <article className="info-card">
            <header className="info-card-header">
              <h2>Budget Progress</h2>
              <span>View All</span>
            </header>

            {budgetProgressItems.length ? (
              <div className="info-card-body">
                {budgetProgressItems.map((item) => (
                  <div key={item.category} className="progress-row">
                    <div className="progress-labels">
                      <span>{item.category}</span>
                      <span>{currencyFormatter(item.spent)}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${item.percent}%` }} />
                    </div>
                    <p className="progress-meta">{item.percent}% of monthly spend</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="info-card-empty">Add monthly budgets to see progress here.</p>
            )}
          </article>

          <SavingsSection
            savingsTracker={selectedSavingsTracker}
            currencyFormatter={currencyFormatter}
            onSetGoal={() => setShowSavingsModal(true)}
            loading={summaryLoading}
          />

          <article className="info-card">
            <header className="info-card-header">
              <h2>AI Insights</h2>
            </header>

            {insights.length ? (
              <ul className="insights-list">
                {insights.map((insight) => (
                  <li key={insight.title}>
                    <p className="insight-title">{insight.title}</p>
                    <p className="insight-text">{insight.detail}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="info-card-empty">Insights will appear after a few transactions.</p>
            )}
          </article>
        </div>
      </section>

      <SavingsGoalModal
        isOpen={showSavingsModal}
        onClose={() => setShowSavingsModal(false)}
        currentGoal={selectedSavingsTracker}
        currencyFormatter={currencyFormatter}
        targetMonth={selectedMonth}
        targetYear={selectedYear}
      />

      {(summaryLoading || analyticsLoading || expensesLoading || incomeLoading) && (
        <p className="dashboard-loading">Loading live income and expense data...</p>
      )}

      {error && <p className="dashboard-error">{error}</p>}
    </section>
  );
};

export default DashboardPage;





