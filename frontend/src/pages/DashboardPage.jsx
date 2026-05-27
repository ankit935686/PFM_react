import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBudgets } from '../context/BudgetContext';
import { useExpenses } from '../context/ExpenseContext';
import { useIncome } from '../context/IncomeContext';
import api from '../lib/api';
import { formatCurrency } from '../lib/currency';
import StatCard from '../components/dashboard/StatCard';
import ChartsSection from '../components/dashboard/ChartsSection';
import { TransactionsTable } from '../components/dashboard/TransactionsTable';
import SavingsSection from '../components/dashboard/SavingsSection';
import SavingsGoalModal from '../components/dashboard/SavingsGoalModal';

const chartPalette = ['#6EC6E6', '#A78BFA', '#F472B6', '#FB923C', '#34D399'];

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

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'No prior month';
  }

  const rounded = Number(value).toFixed(1);
  return `${Number(value) > 0 ? '+' : ''}${rounded}% vs last month`;
};

const buildSeries = (trendData, getter) => trendData.map((item) => Number(getter(item) || 0));

const buildStatCards = (summary, comparison, trendData) => {
  const incomeSeries = buildSeries(trendData, (item) => item.totalIncome);
  const expenseSeries = buildSeries(trendData, (item) => item.totalExpenses);
  const balanceSeries = trendData.map((item) => Number(item.totalIncome || 0) - Number(item.totalExpenses || 0));
  const deltas = comparison?.deltas || {};

  return [
    {
      key: 'balance',
      title: 'Total Balance',
      value: Number(summary.totalBalance || 0),
      trend: formatPercent(deltas.savingsChange),
      trendDirection: Number(summary.totalBalance || 0) >= 0 ? 'up' : 'down',
      sparkline: balanceSeries,
      detail: 'Selected period net position',
    },
    {
      key: 'income',
      title: 'Monthly Income',
      value: Number(summary.monthlyIncome || 0),
      trend: formatPercent(deltas.incomeChange),
      trendDirection: Number(deltas.incomeChange || 0) >= 0 ? 'up' : 'down',
      sparkline: incomeSeries,
      detail: 'Cash inflow tracked this month',
    },
    {
      key: 'expenses',
      title: 'Monthly Expenses',
      value: Number(summary.monthlyExpenses || 0),
      trend: formatPercent(deltas.expenseChange),
      trendDirection: Number(deltas.expenseChange || 0) <= 0 ? 'up' : 'down',
      sparkline: expenseSeries,
      detail: 'Outflow compared with last month',
    },
    {
      key: 'savings',
      title: 'Savings',
      value: Number(summary.totalSavings || 0),
      trend: formatPercent(deltas.savingsChange),
      trendDirection: Number(summary.totalSavings || 0) >= 0 ? 'up' : 'down',
      sparkline: balanceSeries,
      detail: 'Monthly savings after spending',
    },
  ];
};

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
  const [showWelcomeHeader, setShowWelcomeHeader] = useState(false);
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
  const [aiInsights, setAiInsights] = useState([]);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);

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
      profile.currency
    );
  }, [profile]);

  const currency = profile?.currency || 'INR';

  const dashboardCards = useMemo(
    () => buildStatCards(summary, comparison, incomeExpenseTrendData),
    [summary, comparison, incomeExpenseTrendData]
  );

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

  const budgetOverview = useMemo(() => {
    const periodBudgets = budgets.filter(
      (budget) => Number(budget.month) === Number(selectedMonth) && Number(budget.year) === Number(selectedYear)
    );
    const budgetByCategory = periodBudgets.reduce((acc, budget) => {
      const key = String(budget.category || 'Other');
      acc[key] = (acc[key] || 0) + Number(budget.amount || 0);
      return acc;
    }, {});

    const expenseByCategory = expenses.reduce((acc, expense) => {
      if (!isInMonth(expense.date, selectedMonth, selectedYear)) {
        return acc;
      }

      const key = String(expense.category || 'Other');
      acc[key] = (acc[key] || 0) + Number(expense.amount || 0);
      return acc;
    }, {});

    const coreCategories = ['Food', 'Rent', 'Transport', 'Utilities'];
    const spentByCore = coreCategories.reduce((acc, category) => {
      acc[category] = Number(expenseByCategory[category] || 0);
      return acc;
    }, {});

    const otherSpent = Object.entries(expenseByCategory).reduce((total, [category, amount]) => {
      return coreCategories.includes(category) ? total : total + Number(amount || 0);
    }, 0);

    const totalBudgetFromBudgets = periodBudgets.reduce(
      (sum, budget) => sum + Number(budget.amount || 0),
      0
    );
    const totalBudget = totalBudgetFromBudgets > 0
      ? totalBudgetFromBudgets
      : Number(budgetPreview.monthlyBudget || 0);
    const totalSpent = Number(summary.monthlyExpenses || 0);
    const remaining = totalBudget - totalSpent;
    const percentUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const usageStatus = percentUsed >= 100 ? 'over' : percentUsed >= 80 ? 'warn' : 'safe';

    return {
      spentByCore,
      otherSpent,
      totalBudget,
      totalSpent,
      remaining,
      percentUsed,
      usageStatus,
      hasBudgetData: totalBudget > 0,
      budgetByCategory,
    };
  }, [budgets, budgetPreview.monthlyBudget, expenses, selectedMonth, selectedYear, summary.monthlyExpenses]);

  const dailyBudgetLeft = useMemo(() => {
    const now = new Date();
    const year = Number(selectedYear);
    const monthIndex = Number(selectedMonth) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const isCurrentPeriod = now.getFullYear() === year && now.getMonth() === monthIndex;
    const remainingDays = isCurrentPeriod ? Math.max(1, daysInMonth - now.getDate() + 1) : daysInMonth;
    return budgetOverview.remaining / remainingDays;
  }, [budgetOverview.remaining, selectedMonth, selectedYear]);
  const budgetCategoryMini = useMemo(() => {
    return Object.entries(budgetOverview.spentByCore || {})
      .map(([name, amount]) => ({ name, amount: Number(amount || 0) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [budgetOverview.spentByCore]);

  const budgetBreakdown = useMemo(() => {
    const items = Object.entries(budgetOverview.spentByCore || {})
      .map(([name, amount]) => ({ name, amount: Number(amount || 0) }))
      .filter((item) => item.amount > 0);

    if (budgetOverview.otherSpent > 0) {
      items.push({ name: 'Other', amount: Number(budgetOverview.otherSpent || 0) });
    }

    return items.slice(0, 5);
  }, [budgetOverview.otherSpent, budgetOverview.spentByCore]);

  const spendTrend = useMemo(() => {
    const points = expenses
      .filter((expense) => isInMonth(expense.date, selectedMonth, selectedYear))
      .sort((left, right) => new Date(left.date) - new Date(right.date))
      .slice(-12)
      .map((expense) => Number(expense.amount || 0));

    const maxValue = Math.max(...points, 1);

    return {
      points: points.map((value) => value / maxValue),
      maxValue,
    };
  }, [expenses, selectedMonth, selectedYear]);

  const sparklinePoints = useMemo(() => {
    if (spendTrend.points.length < 2) {
      return '';
    }

    const maxIndex = Math.max(1, spendTrend.points.length - 1);

    return spendTrend.points
      .map((value, index) => {
        const x = (index / maxIndex) * 120;
        const y = 32 - value * 24 - 4;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [spendTrend.points]);

  const remainingLabel = budgetOverview.remaining >= 0
    ? `${currencyFormatter(budgetOverview.remaining)} remaining`
    : `${currencyFormatter(Math.abs(budgetOverview.remaining))} over budget`;
  const breakdownSplitIndex = Math.ceil(budgetBreakdown.length / 2);
  const breakdownLeft = budgetBreakdown.slice(0, breakdownSplitIndex);
  const breakdownRight = budgetBreakdown.slice(breakdownSplitIndex);
  const fallbackInsights = useMemo(() => {
    const next = [];
    const topCategory = budgetCategoryMini[0];
    if (budgetOverview.totalBudget > 0 && budgetOverview.percentUsed >= 90) {
      next.push({
        id: 'budget-risk',
        title: 'Budget pressure is high',
        detail: `${budgetOverview.percentUsed}% of your monthly budget is already used. Slow variable spending this week.`,
      });
    }
    if (Number(summary.totalSavings || 0) <= 0) {
      next.push({
        id: 'savings-nudge',
        title: 'No savings buffer yet',
        detail: 'Set a monthly savings goal and auto-transfer on income dates to build consistency.',
      });
    }
    if (topCategory && topCategory.amount > 0) {
      next.push({
        id: 'top-category',
        title: `Highest spend: ${topCategory.name}`,
        detail: `${currencyFormatter(topCategory.amount)} spent in ${topCategory.name}. Track this category weekly for better control.`,
      });
    }
    if (!next.length) {
      next.push({
        id: 'healthy',
        title: 'Spending pattern looks stable',
        detail: 'Keep reviewing transactions weekly and compare month-to-month trends to sustain progress.',
      });
    }
    return next.slice(0, 3);
  }, [budgetCategoryMini, budgetOverview.percentUsed, budgetOverview.totalBudget, currencyFormatter, summary.totalSavings]);

  const monthSummaryLabel = useMemo(() => {
    return {
      netLabel: currencyFormatter(Number(summary.totalBalance || 0)),
      incomeTrend: formatPercent(comparison?.deltas?.incomeChange),
      expenseTrend: formatPercent(comparison?.deltas?.expenseChange),
      savingsLabel: currencyFormatter(Number(summary.totalSavings || 0)),
    };
  }, [comparison?.deltas?.expenseChange, comparison?.deltas?.incomeChange, currencyFormatter, summary.totalBalance, summary.totalSavings]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setShowWelcomeHeader(false);
      return;
    }

    const key = `dashboard_welcome_seen_${currentUser.uid}`;
    const seen = window.sessionStorage.getItem(key);
    if (!seen) {
      setShowWelcomeHeader(true);
      window.sessionStorage.setItem(key, '1');
    } else {
      setShowWelcomeHeader(false);
    }
  }, [currentUser?.uid]);

  const loadDashboardData = useCallback(async () => {
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
  }, [currentUser, expenses, income, selectedMonth, selectedYear]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const loadInsights = async () => {
      if (!currentUser?.uid) {
        setAiInsights([]);
        return;
      }

      setAiInsightsLoading(true);
      try {
        const headers = await getAuthHeaders();
        const response = await api.get(`/api/dashboard/insights?month=${selectedMonth}&year=${selectedYear}`, { headers });
        setAiInsights(Array.isArray(response.data?.insights) ? response.data.insights : []);
      } catch (_insightError) {
        setAiInsights([]);
      } finally {
        setAiInsightsLoading(false);
      }
    };

    loadInsights();
  }, [currentUser, selectedMonth, selectedYear, comparison, budgetOverview.percentUsed]);

  return (
    <section className="dashboard-page !font-[Nunito] bg-[#F0F2FF] text-[#1E1E2D]">
      <header className="dashboard-header-modern dashboard-hero relative rounded-xl border border-[#E8EAF6] bg-white p-4 shadow-[0_8px_24px_-20px_rgba(30,30,45,0.2)] md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="dashboard-hero-main">
            <h1 className="dashboard-title text-[30px] font-semibold text-[#1E1E2D] md:text-[34px]">
              {profile?.fullName ? `Good Evening, ${profile.fullName}!` : 'Good evening!'}
            </h1>

            <p className="dashboard-subtitle text-[12px] text-[#6B7280]">
              {`Here's your financial overview for ${selectedPeriodLabel}`}
            </p>
          </div>

          <div className="dashboard-cta-row mt-1 flex flex-col items-start gap-2 md:mt-0 md:ml-0 md:text-right md:flex-row md:items-center md:gap-3 md:absolute md:top-4 md:right-6">
            <Link
              to="/transactions"
              className="dashboard-cta dashboard-cta-secondary min-w-[150px] justify-center rounded-md border border-[#E8EAF6] bg-white text-[12px] font-semibold text-[#5B5BD6] hover:bg-[#EEF0FF]"
            >
              View History
            </Link>
            <Link
              to="/transactions?quickAdd=1"
              className="dashboard-cta dashboard-cta-primary flex min-w-[150px] items-center justify-center gap-2 rounded-md bg-[#5B5BD6] text-[12px] font-semibold text-white hover:bg-[#4848C2]"
            >
              <span className="text-lg">+</span>
              <span>Add Transaction</span>
            </Link>
          </div>
        </div>
      </header>

      {!profileLoading && profileIncomplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-alert rounded-xl border border-[#E8EAF6] bg-white"
        >
          <p className="font-semibold">Complete your profile to personalize your dashboard.</p>
          <p className="dashboard-alert-subtitle">
            Add your basic details and preferred currency to tailor the experience.
          </p>
          <Link
            to="/profile-setup"
            className="dashboard-alert-link bg-fincheck-accent hover:bg-fincheck-accent-hover"
          >
            Open profile setup
          </Link>
        </motion.div>
      )}

      <section className="stat-grid mt-2 grid gap-3">
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
        <p className="dashboard-empty rounded-lg border border-[#E8EAF6] bg-white text-[#6B7280]">
          No transactions yet. Open Transactions and add your first income or expense.
        </p>
      )}

      <section className="dashboard-main-analytics">
        <ChartsSection
          expenseCategoryData={expenseCategoryData}
          monthlyExpenseData={monthlyExpenseData}
          incomeExpenseTrendData={incomeExpenseTrendData}
          currencyFormatter={currencyFormatter}
          loading={analyticsLoading}
          selectedPeriodLabel={selectedPeriodLabel}
        />
      </section>

      <section className="dashboard-operations-grid">
        <div className="dashboard-operations-main">
          <TransactionsTable recentActivity={recentActivity} currencyFormatter={currencyFormatter} />
        </div>

        <div className="dashboard-operations-side">
          <article className="dashboard-budget-card rounded-xl border border-[#E8EAF6] bg-white p-3 shadow-[0_8px_24px_-20px_rgba(30,30,45,0.2)]">
            <header className="info-card-header flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-semibold text-[#1E1E2D]">Budget Overview</h2>
              <Link to="/budget" className="text-[11px] font-semibold text-[#5B5BD6] hover:text-[#4848C2]">Edit Budget</Link>
            </header>

            {budgetOverview.hasBudgetData ? (
              <div className="info-card-body grid gap-3">
                <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-[#E8EAF6] bg-white px-3 py-2">
                  <div className="grid gap-0.5">
                    <span className="text-[0.68rem] uppercase tracking-[0.12em] text-[#9CA3AF]">Total Spent</span>
                    <strong className="text-lg text-fincheck-text-primary">{currencyFormatter(budgetOverview.totalSpent)}</strong>
                    <span className={`text-[0.7rem] font-semibold ${budgetOverview.remaining < 0 ? 'text-[#b91c1c]' : 'text-[#047857]'}`}>
                      {remainingLabel}
                    </span>
                  </div>
                  <div className="grid justify-items-end gap-1 text-[0.65rem] text-[#9CA3AF]">
                    <span>Trend</span>
                    {sparklinePoints ? (
                      <svg viewBox="0 0 120 32" className="h-8 w-28 text-fincheck-accent" role="img" aria-label="Spending trend">
                        <polyline
                          points={sparklinePoints}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <span className="text-[0.62rem]">No data</span>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between text-[0.72rem] font-semibold">
                    <span>Budget used</span>
                    <strong className={`text-[0.72rem] ${budgetOverview.usageStatus === 'over' ? 'text-[#b91c1c]' : budgetOverview.usageStatus === 'warn' ? 'text-[#b45309]' : 'text-[#047857]'}`}>
                      {budgetOverview.percentUsed}%
                    </strong>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#E5E7EB]">
                    <motion.div
                      className={`h-full rounded-full ${budgetOverview.usageStatus === 'over' ? 'bg-gradient-to-r from-[#ef4444] to-[#f97316]' : budgetOverview.usageStatus === 'warn' ? 'bg-gradient-to-r from-[#f59e0b] to-[#f97316]' : 'bg-[#5B5BD6]'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, Math.min(100, budgetOverview.percentUsed))}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[0.65rem] text-[#9CA3AF]">
                    <span>{currencyFormatter(budgetOverview.totalSpent)} spent</span>
                    <span>{currencyFormatter(budgetOverview.totalBudget)} budget</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[breakdownLeft, breakdownRight].map((column, columnIndex) => (
                    <div key={columnIndex} className="grid gap-1">
                      {column.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-[0.7rem]">
                          <span className="text-[#9CA3AF]">{item.name}</span>
                          <strong className="text-fincheck-text-primary">{currencyFormatter(item.amount)}</strong>
                        </div>
                      ))}
                    </div>
                  ))}
                  {!budgetBreakdown.length && (
                    <p className="text-[0.7rem] text-[#9CA3AF]">No spending recorded yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="budget-overview-empty-card">
                <div>
                  <p className="budget-empty-title">No Budget Set</p>
                  <p className="budget-empty-text">
                    Set a monthly budget to unlock usage tracking, insights, and alerts.
                  </p>
                </div>
                <Link to="/budget" className="budget-action-button primary">Set Monthly Budget</Link>
              </div>
            )}
          </article>

          <SavingsSection
            savingsTracker={selectedSavingsTracker}
            currencyFormatter={currencyFormatter}
            onSetGoal={() => setShowSavingsModal(true)}
            loading={summaryLoading}
          />
        </div>
      </section>

      <section className="dashboard-ai-bottom">
        <article className="rounded-xl border border-[#E8EAF6] bg-white p-3 shadow-[0_8px_24px_-20px_rgba(30,30,45,0.2)]">
          <header className="info-card-header">
            <h2 className="text-[13px] font-semibold text-[#1E1E2D]">AI Insights</h2>
          </header>

          {aiInsightsLoading ? (
            <p className="info-card-empty">Generating insights...</p>
          ) : aiInsights.length || fallbackInsights.length ? (
            <ul className="insights-list compact">
              {(aiInsights.length ? aiInsights : fallbackInsights).slice(0, 3).map((insight) => (
                <li key={insight.id}>
                  <p className="insight-title">{insight.title}</p>
                  <p className="insight-text">{insight.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="info-card-empty compact-empty">
              <p>No AI insights yet for this period.</p>
              <small>Tip: Add more transactions this month to unlock better guidance.</small>
            </div>
          )}
        </article>
      </section>

      <SavingsGoalModal
        isOpen={showSavingsModal}
        onClose={() => setShowSavingsModal(false)}
        onGoalSet={loadDashboardData}
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
