import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bike,
  CalendarDays,
  CircleDollarSign,
  Edit3,
  GraduationCap,
  House,
  Laptop,
  Plane,
  PiggyBank,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { formatCurrency } from '../lib/currency';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '../components/ui/chart';

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

const goalIconOptions = [
  { value: 'target', label: 'General Goal', icon: Target },
  { value: 'shield', label: 'Emergency Fund', icon: ShieldCheck },
  { value: 'plane', label: 'Goa Trip', icon: Plane },
  { value: 'laptop', label: 'Laptop', icon: Laptop },
  { value: 'bike', label: 'Bike', icon: Bike },
  { value: 'investments', label: 'Investments', icon: CircleDollarSign },
  { value: 'home', label: 'Home', icon: House },
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'wealth', label: 'Wealth Building', icon: PiggyBank },
  { value: 'travel', label: 'Travel', icon: Sparkles },
];

const categoryOptions = ['Emergency Fund', 'Travel', 'Tech', 'Vehicle', 'Investment', 'Education', 'Home', 'Other'];

const getDefaultGoalForm = () => ({
  goalName: '',
  targetAmount: '',
  currentSavedAmount: '0',
  targetDate: '',
  icon: 'target',
  category: 'Other',
  notes: '',
  status: 'active',
});

const getIconByValue = (value) => {
  return goalIconOptions.find((option) => option.value === value)?.icon || Target;
};

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const SavingsPage = () => {
  const { currentUser } = useAuth();
  const outletContext = useOutletContext() || {};
  const currentDate = new Date();
  const selectedMonth = outletContext.selectedMonth || currentDate.getMonth() + 1;
  const selectedYear = outletContext.selectedYear || currentDate.getFullYear();
  const selectedPeriodLabel = outletContext.selectedPeriodLabel || `${monthOptions[selectedMonth - 1]} ${selectedYear}`;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [contributionGoal, setContributionGoal] = useState(null);
  const [goalForm, setGoalForm] = useState(getDefaultGoalForm());
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionNote, setContributionNote] = useState('');

  const currency = profile?.currency || 'INR';
  const summary = details?.summary || {};
  const breakdown = details?.breakdown || {};
  const goals = details?.goals?.allGoals || [];
  const activeGoals = details?.goals?.activeGoals || [];
  const completedGoals = details?.goals?.completedGoals || [];
  const history = details?.history || [];
  const timeline = details?.timeline || [];
  const trend = details?.trend || [];
  const insights = details?.insights || null;

  const getAuthHeaders = async () => {
    if (!currentUser) {
      return {};
    }

    const token = await currentUser.getIdToken();

    return {
      Authorization: `Bearer ${token}`,
      'x-firebase-uid': currentUser.uid,
      'x-firebase-email': currentUser.email || '',
      'x-firebase-name': currentUser.displayName || '',
    };
  };

  const loadSavingsDetails = async () => {
    if (!currentUser?.uid) {
      setDetails(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const headers = await getAuthHeaders();
      const response = await api.get(
        `/api/savings/details?month=${selectedMonth}&year=${selectedYear}&historyMonths=12`,
        { headers }
      );

      setDetails(response.data || null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load savings details.');
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.uid) {
        setProfile(null);
        return;
      }

      try {
        const response = await api.get(`/api/profile/${currentUser.uid}`);
        setProfile(response.data?.profile || null);
      } catch (_profileError) {
        setProfile(null);
      }
    };

    loadProfile();
  }, [currentUser]);

  useEffect(() => {
    loadSavingsDetails();
  }, [currentUser, selectedMonth, selectedYear]);

  const overviewCards = useMemo(() => {
    return [
      {
        title: 'Lifetime Savings',
        value: formatCurrency(summary.totalLifetimeSavings || 0, currency),
        meta: 'All time net savings',
        icon: PiggyBank,
      },
      {
        title: 'This Month',
        value: formatCurrency(summary.currentMonthSavings || 0, currency),
        meta: selectedPeriodLabel,
        icon: TrendingUp,
      },
      {
        title: 'Savings Rate',
        value: formatPercent(summary.savingsRatePercentage || 0),
        meta: 'Income retained as savings',
        icon: CircleDollarSign,
      },
      {
        title: 'Active Goals',
        value: String(summary.totalActiveGoals || 0),
        meta: 'Long-term goals in progress',
        icon: Target,
      },
    ];
  }, [currency, selectedPeriodLabel, summary.currentMonthSavings, summary.savingsRatePercentage, summary.totalActiveGoals, summary.totalLifetimeSavings]);

  const trendChartData = useMemo(() => {
    return trend.map((item) => ({
      month: item.label || item.monthKey,
      savings: Number(item.savings || 0),
      income: Number(item.income || 0),
      expenses: Number(item.expenses || 0),
      goalAmount: Number(item.goalAmount || 0),
    }));
  }, [trend]);

  const topCategories = breakdown.highestSpendingCategory ? [breakdown.highestSpendingCategory] : [];

  const openCreateGoal = () => {
    setEditingGoal(null);
    setGoalForm(getDefaultGoalForm());
    setGoalModalOpen(true);
  };

  const openEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalForm({
      goalName: goal.goalName || '',
      targetAmount: goal.targetAmount ?? '',
      currentSavedAmount: goal.currentSavedAmount ?? '0',
      targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().slice(0, 10) : '',
      icon: goal.icon || 'target',
      category: goal.category || 'Other',
      notes: goal.notes || '',
      status: goal.status || 'active',
    });
    setGoalModalOpen(true);
  };

  const closeGoalModal = () => {
    setGoalModalOpen(false);
    setEditingGoal(null);
    setGoalForm(getDefaultGoalForm());
  };

  const saveGoal = async (event) => {
    event.preventDefault();

    if (!goalForm.goalName.trim() || Number(goalForm.targetAmount) < 0 || !goalForm.targetDate) {
      setError('Please enter a valid goal name, amount, and target date.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const headers = await getAuthHeaders();
      const payload = {
        goalName: goalForm.goalName.trim(),
        targetAmount: Number(goalForm.targetAmount),
        currentSavedAmount: Number(goalForm.currentSavedAmount || 0),
        targetDate: goalForm.targetDate,
        icon: goalForm.icon,
        category: goalForm.category,
        notes: goalForm.notes,
        status: goalForm.status,
      };

      if (editingGoal?._id) {
        await api.put(`/api/savings/goals/${editingGoal._id}`, payload, { headers });
      } else {
        await api.post('/api/savings/goals', payload, { headers });
      }

      closeGoalModal();
      await loadSavingsDetails();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to save savings goal.');
    } finally {
      setSaving(false);
    }
  };

  const removeGoal = async (goal) => {
    const confirmed = window.confirm(`Delete the goal \"${goal.goalName}\"?`);
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const headers = await getAuthHeaders();
      await api.delete(`/api/savings/goals/${goal._id}`, { headers });
      await loadSavingsDetails();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to delete savings goal.');
    } finally {
      setSaving(false);
    }
  };

  const openContributionModal = (goal) => {
    setContributionGoal(goal);
    setContributionAmount('');
    setContributionNote('');
  };

  const closeContributionModal = () => {
    setContributionGoal(null);
    setContributionAmount('');
    setContributionNote('');
  };

  const saveContribution = async (event) => {
    event.preventDefault();

    if (!contributionGoal || Number(contributionAmount) <= 0) {
      setError('Please enter a valid contribution amount.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const headers = await getAuthHeaders();
      await api.post(
        `/api/savings/goals/${contributionGoal._id}/contributions`,
        {
          amount: Number(contributionAmount),
          note: contributionNote,
        },
        { headers }
      );

      closeContributionModal();
      await loadSavingsDetails();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to add contribution.');
    } finally {
      setSaving(false);
    }
  };

  const analysisText = useMemo(() => {
    if (!breakdown.highestSpendingCategory) {
      return 'Add expenses to see your spending impact analysis.';
    }

    const target = breakdown.categoryReductionTarget || 0;
    return `Reducing ${breakdown.highestSpendingCategory.name} by 10% could save you ${formatCurrency(target, currency)} more per month.`;
  }, [breakdown, currency]);

  const savingsGrowthText = useMemo(() => {
    if (summary.monthOverMonthGrowth === null || summary.monthOverMonthGrowth === undefined) {
      return 'Not enough history yet to measure month-over-month growth.';
    }

    const direction = summary.monthOverMonthGrowth >= 0 ? 'more' : 'less';
    return `You saved ${Math.abs(summary.monthOverMonthGrowth).toFixed(1)}% ${direction} than last month.`;
  }, [summary]);

  return (
    <section className="savings-page dashboard-page">
      <header className="savings-hero">
        <div>
          <p className="savings-eyebrow">Savings</p>
          <h1 className="dashboard-title">Savings management</h1>
          <p className="dashboard-subtitle">
            Manage monthly savings, long-term goals, and progress timelines.
          </p>
        </div>

        <div className="savings-hero-actions">
          <div className="savings-period-pill savings-period-pill--select">
            <CalendarDays size={16} />
            <span>{selectedPeriodLabel}</span>
          </div>

          <button
            className="savings-action-button savings-action-button--icon"
            type="button"
            onClick={loadSavingsDetails}
            disabled={loading}
            aria-label="Refresh savings data"
          >
            <RefreshCw size={16} />
          </button>

          <button className="savings-action-button savings-action-button--primary" type="button" onClick={openCreateGoal}>
            <Plus size={16} />
            New goal
          </button>
        </div>
      </header>

      {error && <div className="dashboard-empty">{error}</div>}

      <section className="stat-grid savings-overview-grid">
        {loading
          ? Array.from({ length: 5 }).map((_, index) => <div key={`overview-skeleton-${index}`} className="stat-card stat-card--loading" />)
          : overviewCards.map((card, index) => {
              const Icon = card.icon;

              return (
                <motion.article
                  key={card.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, delay: 0.04 * index }}
                  className={`stat-card savings-overview-card savings-stat-card savings-stat-card--${index}`}
                >
                  <div className="stat-card-head">
                    <p className="stat-card-label">{card.title}</p>
                    <span className="stat-card-icon">
                      <Icon size={14} />
                    </span>
                  </div>
                  <p className="stat-card-value">{card.value}</p>
                  <div className="stat-card-trend">
                    <span>{card.meta}</span>
                  </div>
                </motion.article>
              );
            })}
      </section>

      <section className="savings-dual-grid">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="chart-card savings-chart-card"
        >
          <header className="chart-card-header">
            <h2>Savings Trend Analytics</h2>
            <span>{selectedPeriodLabel}</span>
          </header>

          <div className="chart-body savings-chart-body">
            {loading ? (
              <div className="chart-empty">Loading trend data...</div>
            ) : trendChartData.length ? (
              <ChartContainer
                config={{
                  savings: { label: 'Savings', color: 'var(--color-chart-1)' },
                  income: { label: 'Income', color: 'var(--color-chart-2)' },
                  expenses: { label: 'Expenses', color: 'var(--color-chart-5)' },
                }}
                className="chart-container"
              >
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <LineChart data={trendChartData} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="var(--color-muted-foreground)"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="savings" stroke="var(--color-savings)" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="chart-empty">No savings history yet.</div>
            )}
          </div>
        </motion.article>

        <article className="info-card savings-breakdown-card">
          <div className="info-card-header">
            <h2>Monthly Savings Breakdown</h2>
            <span>{selectedPeriodLabel}</span>
          </div>

          <div className="info-card-body">
            <div className="savings-breakdown-metrics">
              <div className="savings-mini-card savings-mini-card--income">
                <p>Income</p>
                <strong>{formatCurrency(breakdown.income || 0, currency)}</strong>
              </div>
              <div className="savings-mini-card savings-mini-card--expenses">
                <p>Expenses</p>
                <strong>{formatCurrency(breakdown.expenses || 0, currency)}</strong>
              </div>
              <div className="savings-mini-card savings-mini-card--net">
                <p>Net Savings</p>
                <strong>{formatCurrency(breakdown.netSavings || 0, currency)}</strong>
              </div>
            </div>

            <div className="savings-insight-box">
              <p className="insight-title">Spending impact analysis</p>
              <p className="insight-text">{analysisText}</p>
            </div>

            <div className="savings-comparison-grid">
              <div>
                <p className="insight-title">Monthly comparison</p>
                <p className="insight-text">{savingsGrowthText}</p>
              </div>
              <div>
                <p className="insight-title">Previous month</p>
                <p className="insight-text">
                  {formatCurrency(breakdown.previousMonth?.savings || 0, currency)} savings
                </p>
              </div>
            </div>

            <div>
              <p className="insight-title">Top spending category</p>
              {topCategories.length ? (
                <div className="savings-category-row">
                  <span>{topCategories[0].name}</span>
                  <strong>{formatCurrency(topCategories[0].amount || 0, currency)}</strong>
                </div>
              ) : (
                <p className="insight-text">No spending categories available yet.</p>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="savings-goals-section">
        <div className="savings-goals-header">
          <div>
            <h2>Savings goals</h2>
            <p className="dashboard-subtitle">Create goals that persist across months and grow with contributions.</p>
          </div>
          <div className="savings-goals-summary" aria-label="Goals summary">
            <span className="savings-goals-pill savings-goals-pill--active">{activeGoals.length} active</span>
            <span className="savings-goals-pill savings-goals-pill--completed">{completedGoals.length} completed</span>
          </div>
        </div>

        <div className="savings-goal-grid">
          {loading &&
            Array.from({ length: 3 }).map((_, index) => <div key={`goal-skeleton-${index}`} className="goal-card goal-card--loading" />)}

          {!loading && !goals.length && <div className="dashboard-empty">No savings goals yet. Create your first one.</div>}

          {!loading &&
            goals.map((goal) => {
              const Icon = getIconByValue(goal.icon);

              return (
                <article key={goal._id} className={`goal-card ${goal.status === 'completed' ? 'goal-card--completed' : ''}`}>
                  <div className="goal-card-header">
                    <div className="goal-card-title-wrap">
                      <span className="goal-card-icon">
                        <Icon size={16} />
                      </span>
                      <div>
                        <h3>{goal.goalName}</h3>
                        <p>{goal.category || 'General'}</p>
                      </div>
                    </div>

                    <span className={`goal-status goal-status--${goal.status || 'active'}`}>
                      {goal.status === 'completed' ? 'Completed' : goal.status === 'paused' ? 'Paused' : 'Active'}
                    </span>
                  </div>

                  <div className="goal-progress-copy">
                    <strong>{formatCurrency(goal.currentSavedAmount || 0, currency)}</strong>
                    <span>of {formatCurrency(goal.targetAmount || 0, currency)}</span>
                  </div>

                  <div className="progress-track">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, goal.progressPercent || 0)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="goal-metric-grid">
                    <div>
                      <p>Remaining</p>
                      <strong>{formatCurrency(goal.remainingAmount || 0, currency)}</strong>
                    </div>
                    <div>
                      <p>Monthly required</p>
                      <strong>{formatCurrency(goal.monthlyRequired || 0, currency)}</strong>
                    </div>
                    <div>
                      <p>Timeline</p>
                      <strong>
                        {goal.estimatedCompletionMonths === null ? 'Needs more savings' : `${goal.estimatedCompletionMonths} months`}
                      </strong>
                    </div>
                    <div>
                      <p>Target date</p>
                      <strong>{goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'Not set'}</strong>
                    </div>
                  </div>

                  {goal.notes && <p className="goal-notes">{goal.notes}</p>}

                  <div className="goal-contributions">
                    <p className="insight-title">Contribution history</p>
                    {goal.contributions?.length ? (
                      goal.contributions.slice(-3).map((contribution, index) => (
                        <div key={`${goal._id}-contribution-${index}`} className="goal-contribution-row">
                          <span>{new Date(contribution.contributedAt).toLocaleDateString()}</span>
                          <strong>{formatCurrency(contribution.amount || 0, currency)}</strong>
                        </div>
                      ))
                    ) : (
                      <p className="insight-text">No contributions yet.</p>
                    )}
                  </div>

                  <div className="goal-card-actions">
                    <button type="button" className="savings-action-button" onClick={() => openContributionModal(goal)}>
                      <Plus size={14} />
                      Contribute
                    </button>
                    <button type="button" className="savings-action-button" onClick={() => openEditGoal(goal)}>
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button type="button" className="savings-action-button savings-action-button--danger" onClick={() => removeGoal(goal)}>
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
        </div>
      </section>

      {goalModalOpen && (
        <div className="savings-modal-backdrop" role="presentation" onClick={closeGoalModal}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="savings-modal-panel"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="savings-modal-header">
              <div>
                <p className="savings-eyebrow">Savings Goal</p>
                <h2>{editingGoal ? 'Edit goal' : 'Create new goal'}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={closeGoalModal} aria-label="Close goal modal">
                <Trash2 size={16} />
              </button>
            </div>

            <form className="savings-form" onSubmit={saveGoal}>
              <label>
                Goal name
                <input
                  type="text"
                  value={goalForm.goalName}
                  onChange={(event) => setGoalForm((prev) => ({ ...prev, goalName: event.target.value }))}
                  placeholder="Emergency Fund"
                />
              </label>

              <div className="savings-form-grid">
                <label>
                  Target amount
                  <input
                    type="number"
                    min="0"
                    value={goalForm.targetAmount}
                    onChange={(event) => setGoalForm((prev) => ({ ...prev, targetAmount: event.target.value }))}
                  />
                </label>

                <label>
                  Starting saved amount
                  <input
                    type="number"
                    min="0"
                    value={goalForm.currentSavedAmount}
                    onChange={(event) => setGoalForm((prev) => ({ ...prev, currentSavedAmount: event.target.value }))}
                  />
                </label>
              </div>

              <div className="savings-form-grid">
                <label>
                  Target date
                  <input
                    type="date"
                    value={goalForm.targetDate}
                    onChange={(event) => setGoalForm((prev) => ({ ...prev, targetDate: event.target.value }))}
                  />
                </label>

                <label>
                  Category
                  <select
                    value={goalForm.category}
                    onChange={(event) => setGoalForm((prev) => ({ ...prev, category: event.target.value }))}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Icon
                <select
                  value={goalForm.icon}
                  onChange={(event) => setGoalForm((prev) => ({ ...prev, icon: event.target.value }))}
                >
                  {goalIconOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Notes
                <textarea
                  rows={3}
                  value={goalForm.notes}
                  onChange={(event) => setGoalForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Add a quick note about this savings goal"
                />
              </label>

              <div className="savings-modal-actions">
                <button type="button" className="savings-action-button" onClick={closeGoalModal}>
                  Cancel
                </button>
                <button type="submit" className="savings-action-button savings-action-button--primary" disabled={saving}>
                  {saving ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {contributionGoal && (
        <div className="savings-modal-backdrop" role="presentation" onClick={closeContributionModal}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="savings-modal-panel"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="savings-modal-header">
              <div>
                <p className="savings-eyebrow">Contribution</p>
                <h2>{contributionGoal.goalName}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={closeContributionModal} aria-label="Close contribution modal">
                <Trash2 size={16} />
              </button>
            </div>

            <form className="savings-form" onSubmit={saveContribution}>
              <label>
                Amount
                <input
                  type="number"
                  min="0"
                  value={contributionAmount}
                  onChange={(event) => setContributionAmount(event.target.value)}
                />
              </label>

              <label>
                Note
                <textarea
                  rows={3}
                  value={contributionNote}
                  onChange={(event) => setContributionNote(event.target.value)}
                  placeholder="Optional note for this contribution"
                />
              </label>

              <div className="savings-modal-actions">
                <button type="button" className="savings-action-button" onClick={closeContributionModal}>
                  Cancel
                </button>
                <button type="submit" className="savings-action-button savings-action-button--primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Add Contribution'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default SavingsPage;
