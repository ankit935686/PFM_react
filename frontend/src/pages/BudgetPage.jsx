import { useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '../components/ui/chart';
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

  const chartConfig = {
    safe: { label: 'Safe', color: '#16a34a' },
    warn: { label: 'Warning', color: '#f59e0b' },
    over: { label: 'Over Budget', color: '#ef4444' },
  };

  const chartData = budgetCards.map((item) => ({
    name: item.category,
    value: item.percent,
    status: item.status,
  }));

  return (
    <section className="budget-page">
      <header className="budget-header">
        <div>
          <h1>Budget Management</h1>
          <p>Plan monthly budgets, track spending, and stay in control.</p>
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
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex justify-end mb-4">
          <button className="budget-add" type="button" onClick={() => handleOpenModal()}>
            Add Budget
          </button>
        </div>

        <section className="budget-overview">
          <article className="overview-card">
            <p>Total Budget</p>
            <h2>{currencyFormatter(totals.totalBudget)}</h2>
            <span>Allocated for the month</span>
          </article>
          <article className="overview-card">
            <p>Total Spent</p>
            <h2>{currencyFormatter(totals.totalSpent)}</h2>
            <span>Tracked expenses</span>
          </article>
          <article className="overview-card">
            <p>Remaining</p>
            <h2>{currencyFormatter(totals.remaining)}</h2>
            <span>Available balance</span>
          </article>
          <article className="overview-card">
            <p>Savings Estimate</p>
            <h2>{currencyFormatter(totals.savingsEstimate)}</h2>
            <span>Projected savings</span>
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
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80}>
                        {chartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={chartConfig[entry.status]?.color || '#f97316'}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <p className="budget-empty">Add budgets to see category usage.</p>
              )}
            </div>
          </article>

          <article className="budget-insight">
            <h3>Highest Spending</h3>
            {highestSpending ? (
              <div>
                <p>{highestSpending.category}</p>
                <span>{currencyFormatter(highestSpending.spent)} spent</span>
              </div>
            ) : (
              <p className="budget-empty">No spending recorded yet.</p>
            )}
          </article>

          <article className="budget-insight">
            <h3>Most Underused</h3>
            {mostUnderused ? (
              <div>
                <p>{mostUnderused.category}</p>
                <span>{mostUnderused.percent}% used</span>
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
                    <button type="button" onClick={() => handleOpenModal(budget)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => deleteBudget(budget.id)}>
                      Delete
                    </button>
                  </div>
                </header>

                <div className="budget-stats">
                  <p>Spent</p>
                  <strong>{currencyFormatter(budget.spent)}</strong>
                </div>
                <div className="budget-stats">
                  <p>Remaining</p>
                  <strong>{currencyFormatter(budget.remaining)}</strong>
                </div>

                <div className="budget-progress">
                  <div className="budget-progress-bar">
                    <span style={{ width: `${Math.min(100, budget.percent)}%` }} />
                  </div>
                  <span className="budget-percent">{budget.percent}% used</span>
                </div>

                {budget.status === 'warn' && <p className="budget-status">Warning: 80% used</p>}
                {budget.status === 'over' && <p className="budget-status">Over Budget</p>}
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
