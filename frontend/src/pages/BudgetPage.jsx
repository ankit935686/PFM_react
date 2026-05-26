import { useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Flame, Leaf, NotebookPen, Pencil, Plus, Star, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/chart';
import { useAuth } from '../context/AuthContext';
import { useBudgets } from '../context/BudgetContext';
import { useExpenses } from '../context/ExpenseContext';
import api from '../lib/api';
import { formatCurrency } from '../lib/currency';

const CATEGORY_OPTIONS = [
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Others',
];

const monthOptions = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const getBudgetStatusLabel = (status) => {
  if (status === 'over') {
    return 'Over budget';
  }
  if (status === 'warn') {
    return 'Warning';
  }
  return 'On track';
};

const BudgetPage = () => {
  const { currentUser } = useAuth();
  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { expenses } = useExpenses();
  const [profileCurrency, setProfileCurrency] = useState('INR');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formState, setFormState] = useState({
    category: CATEGORY_OPTIONS[0],
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: '',
  });

  useEffect(() => {
    const loadProfileCurrency = async () => {
      if (!currentUser?.uid) {
        return;
      }

      try {
        const response = await api.get(`/api/profile/${currentUser.uid}`);
        setProfileCurrency(response.data?.profile?.currency || 'INR');
      } catch (_error) {
        setProfileCurrency('INR');
      }
    };

    loadProfileCurrency();
  }, [currentUser]);

  const currencyFormatter = (value) => formatCurrency(value, profileCurrency);

  const handleOpenModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setFormState({
        category: budget.category,
        amount: budget.amount,
        month: budget.month,
        year: budget.year,
        notes: budget.notes || '',
      });
    } else {
      setEditingBudget(null);
      setFormState({
        category: CATEGORY_OPTIONS[0],
        amount: '',
        month: selectedMonth,
        year: selectedYear,
        notes: '',
      });
    }

    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingBudget(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      category: formState.category,
      amount: Number(formState.amount || 0),
      month: Number(formState.month),
      year: Number(formState.year),
      notes: formState.notes || '',
    };

    if (editingBudget) {
      updateBudget(editingBudget.id, payload);
    } else {
      addBudget(payload);
    }

    handleCloseModal();
  };

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }, []);

  const filteredBudgets = useMemo(() => {
    return budgets.filter(
      (budget) => Number(budget.month) === Number(selectedMonth) && Number(budget.year) === Number(selectedYear)
    );
  }, [budgets, selectedMonth, selectedYear]);

  const expenseByCategory = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const date = new Date(expense.date);
      if (date.getMonth() + 1 !== Number(selectedMonth) || date.getFullYear() !== Number(selectedYear)) {
        return acc;
      }

      const key = expense.category;
      acc[key] = (acc[key] || 0) + Number(expense.amount || 0);
      return acc;
    }, {});
  }, [expenses, selectedMonth, selectedYear]);

  const budgetCards = useMemo(() => {
    return filteredBudgets.map((budget) => {
      const spent = Number(expenseByCategory[budget.category] || 0);
      const remaining = budget.amount - spent;
      const percent = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
      const status = percent >= 100 ? 'over' : percent >= 80 ? 'warn' : 'safe';

      return {
        ...budget,
        spent,
        remaining,
        percent,
        status,
      };
    });
  }, [filteredBudgets, expenseByCategory]);

  const totals = useMemo(() => {
    const totalBudget = budgetCards.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalSpent = budgetCards.reduce((sum, item) => sum + Number(item.spent || 0), 0);
    const remaining = totalBudget - totalSpent;
    const savingsEstimate = remaining;

    return { totalBudget, totalSpent, remaining, savingsEstimate };
  }, [budgetCards]);

  const highestSpending = useMemo(() => {
    if (!budgetCards.length) {
      return null;
    }

    return budgetCards.reduce((top, item) => (item.spent > top.spent ? item : top), budgetCards[0]);
  }, [budgetCards]);

  const mostUnderused = useMemo(() => {
    if (!budgetCards.length) {
      return null;
    }

    return budgetCards.reduce((lowest, item) => (item.percent < lowest.percent ? item : lowest), budgetCards[0]);
  }, [budgetCards]);

  const piePalette = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6', '#06b6d4'];

  const chartData = useMemo(() => {
    const entries = Object.entries(expenseByCategory || {})
      .map(([name, value]) => ({ name, value: Number(value || 0) }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return entries.map((item, index) => ({ ...item, color: piePalette[index % piePalette.length] }));
  }, [expenseByCategory]);

  const chartTotal = useMemo(() => chartData.reduce((sum, item) => sum + item.value, 0), [chartData]);
  const chartConfig = useMemo(
    () =>
      chartData.reduce((acc, item) => {
        acc[item.name] = { label: item.name, color: item.color };
        return acc;
      }, {}),
    [chartData]
  );

  return (
    <section className="budget-page">
      <header className="budget-header">
        <div className="budget-header-title">
          <span className="budget-header-icon"><Wallet size={18} /></span>
          <div>
          <h1>Budget Management</h1>
          <p>Plan monthly budgets, track spending, and stay in control.</p>
          </div>
        </div>

        <div className="budget-controls">
          <div className="budget-filter">
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <button className="budget-add" type="button" onClick={() => handleOpenModal()}>
            <Plus size={16} />
            Add budget
          </button>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <section className="budget-overview">
          <article className="overview-card overview-card--budget">
            <div className="overview-card-head">
              <p>Total Budget</p>
              <span className="overview-card-icon"><Wallet size={15} /></span>
            </div>
            <h2>{currencyFormatter(totals.totalBudget)}</h2>
            <span>Allocated for the month</span>
            <div className="overview-card-meter"><span style={{ width: '62%' }} /></div>
          </article>
          <article className="overview-card overview-card--spent">
            <div className="overview-card-head">
              <p>Total Spent</p>
              <span className="overview-card-icon"><NotebookPen size={15} /></span>
            </div>
            <h2>{currencyFormatter(totals.totalSpent)}</h2>
            <span>Tracked expenses</span>
            <div className="overview-card-meter"><span style={{ width: '48%' }} /></div>
          </article>
          <article className="overview-card overview-card--remaining">
            <div className="overview-card-head">
              <p>Remaining</p>
              <span className="overview-card-icon"><TrendingUp size={15} /></span>
            </div>
            <h2 className="overview-value-positive">{currencyFormatter(totals.remaining)}</h2>
            <span>Available balance</span>
            <div className="overview-card-meter"><span style={{ width: '73%' }} /></div>
          </article>
          <article className="overview-card overview-card--savings">
            <div className="overview-card-head">
              <p>Savings Estimate</p>
              <span className="overview-card-icon"><Star size={15} /></span>
            </div>
            <h2 className="overview-value-brand">{currencyFormatter(totals.savingsEstimate)}</h2>
            <span>Projected savings</span>
            <div className="overview-card-meter"><span style={{ width: '68%' }} /></div>
          </article>
        </section>

        <section className="budget-analytics">
          <article className="budget-chart-card">
            <header>
              <h3>Category Usage</h3>
              <span>Monthly</span>
            </header>
            <div className="budget-chart-body">
              {chartData.length ? (
                <ChartContainer config={chartConfig} className="chart-container">
                  <div className="budget-donut-layout">
                    <div className="budget-donut-wrap">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} stroke="none">
                            {chartData.map((entry) => (
                              <Cell
                                key={entry.name}
                                fill={entry.color}
                              />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="budget-donut-center">
                        <span>Total</span>
                        <strong>{currencyFormatter(chartTotal)}</strong>
                      </div>
                    </div>
                    <div className="budget-donut-legend">
                      {chartData.map((item) => (
                        <div key={item.name} className="budget-donut-legend-row">
                          <span className="budget-donut-dot" style={{ background: item.color }} />
                          <p>{item.name}</p>
                          <strong>{currencyFormatter(item.value)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartContainer>
              ) : (
                <p className="budget-empty">Add budgets to see category usage.</p>
              )}
            </div>
          </article>

          <article className="budget-insight budget-insight--danger">
            <h3>Highest Spending</h3>
            {highestSpending ? (
              <div className="budget-insight-content budget-insight-content--danger">
                <span className="budget-insight-icon"><Flame size={20} /></span>
                <div>
                  <p>{highestSpending.category}</p>
                  <span>{currencyFormatter(highestSpending.spent)} spent</span>
                  <small>Highest spend this month</small>
                </div>
              </div>
            ) : (
              <p className="budget-empty">No spending recorded yet.</p>
            )}
          </article>

          <article className="budget-insight budget-insight--safe">
            <h3>Most Underused</h3>
            {mostUnderused ? (
              <div className="budget-insight-content budget-insight-content--safe">
                <span className="budget-insight-icon"><Leaf size={20} /></span>
                <div>
                  <p>{mostUnderused.category}</p>
                  <span>{mostUnderused.percent}% used</span>
                  <small>Underutilized - consider reallocating</small>
                </div>
              </div>
            ) : (
              <p className="budget-empty">No budgets available.</p>
            )}
          </article>
        </section>

        <section className="budget-grid">
          {budgetCards.length ? (
            budgetCards.map((budget) => (
              <article key={budget.id} className={`budget-card budget-${budget.status}`}>
                <header>
                  <div>
                    <h3>{budget.category}</h3>
                    <p>{currencyFormatter(budget.amount)} allocated</p>
                  </div>
                  <div className="budget-actions">
                    <button type="button" onClick={() => handleOpenModal(budget)} aria-label={`Edit ${budget.category} budget`}>
                      <Pencil size={14} />
                    </button>
                    <button type="button" onClick={() => deleteBudget(budget.id)} aria-label={`Delete ${budget.category} budget`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </header>

                <div className="budget-stats">
                  <p>Spent</p>
                  <strong>{currencyFormatter(budget.spent)}</strong>
                </div>
                <div className={`budget-stats budget-stats--remaining budget-stats--${budget.status}`}>
                  <p>Remaining</p>
                  <strong>{currencyFormatter(budget.remaining)}</strong>
                </div>

                <div className="budget-progress">
                  <div className="budget-progress-bar">
                    <span style={{ width: `${Math.min(100, budget.percent)}%` }} />
                  </div>
                  <span className="budget-percent">{budget.percent}% used</span>
                </div>

                <div className="budget-status-row">
                  <span className={`budget-status-chip budget-status-chip--${budget.status}`}>{getBudgetStatusLabel(budget.status)}</span>
                </div>
              </article>
            ))
          ) : (
            <p className="budget-empty">No budgets created for this month. Add one to get started.</p>
          )}
        </section>
      </motion.div>

      {/* Budget Modal */}
      {modalOpen && (
        <div className="budget-modal">
          <button className="budget-modal-backdrop" type="button" onClick={handleCloseModal} />
          <div className="budget-modal-card">
            <header>
              <h2>{editingBudget ? 'Edit Budget' : 'Add Budget'}</h2>
              <p>Set a monthly budget and track spending automatically.</p>
            </header>

            <form onSubmit={handleSubmit}>
              <label>
                Category
                <select
                  value={formState.category}
                  onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Budget Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.amount}
                  onChange={(event) => setFormState((current) => ({ ...current, amount: event.target.value }))}
                  required
                />
              </label>

              <div className="budget-form-row">
                <label>
                  Month
                  <select
                    value={formState.month}
                    onChange={(event) => setFormState((current) => ({ ...current, month: event.target.value }))}
                  >
                    {monthOptions.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Year
                  <select
                    value={formState.year}
                    onChange={(event) => setFormState((current) => ({ ...current, year: event.target.value }))}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Notes (optional)
                <textarea
                  rows="3"
                  value={formState.notes}
                  onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
                />
              </label>

              <div className="budget-form-actions">
                <button type="button" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit">Save Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default BudgetPage;
