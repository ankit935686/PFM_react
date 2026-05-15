import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, BellRing, CheckCheck, CircleAlert, CircleCheck, CircleDashed, IndianRupee } from 'lucide-react';
import { useBudgets } from '../../context/BudgetContext';
import { useExpenses } from '../../context/ExpenseContext';
import { useIncome } from '../../context/IncomeContext';
import { useSavings } from '../../context/SavingsContext';

const STORAGE_PREFIX = 'pfm-notifications-read';

const severityRank = {
  critical: 0,
  warning: 1,
  success: 2,
  info: 3,
};

const getMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}`;
};

const getCurrentMonthEntries = (items) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return (items || []).filter((item) => {
    if (item?.month && item?.year) {
      return Number(item.month) === month && Number(item.year) === year;
    }

    if (!item?.date) {
      return false;
    }

    const date = new Date(item.date);
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return date.getMonth() + 1 === month && date.getFullYear() === year;
  });
};

const amountNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const NotificationBell = ({ userId, userLabel }) => {
  const { budgets } = useBudgets();
  const { expenses } = useExpenses();
  const { income } = useIncome();
  const { savingsTracker } = useSavings();

  const [isOpen, setIsOpen] = useState(false);
  const [readMap, setReadMap] = useState({});
  const panelRef = useRef(null);

  const storageKey = `${STORAGE_PREFIX}:${userId || 'guest'}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setReadMap(raw ? JSON.parse(raw) : {});
    } catch (_error) {
      setReadMap({});
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(readMap));
    } catch (_error) {
      // Ignore storage issues silently.
    }
  }, [readMap, storageKey]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [isOpen]);

  const notifications = useMemo(() => {
    const monthKey = getMonthKey();
    const monthBudgets = getCurrentMonthEntries(budgets);
    const monthExpenses = getCurrentMonthEntries(expenses);
    const monthIncome = getCurrentMonthEntries(income);

    const expenseByCategory = monthExpenses.reduce((acc, expense) => {
      const category = expense?.category || 'Others';
      acc[category] = (acc[category] || 0) + amountNumber(expense?.amount);
      return acc;
    }, {});

    const list = [];

    if (!monthBudgets.length && monthExpenses.length > 0) {
      list.push({
        id: `budget-missing-${monthKey}`,
        severity: 'warning',
        title: 'No budget set for this month',
        description: 'Add monthly category budgets to monitor overspending.',
        feature: 'Budget',
      });
    }

    monthBudgets.forEach((budget) => {
      const allocated = amountNumber(budget?.amount);
      const spent = amountNumber(expenseByCategory[budget?.category]);
      if (allocated <= 0) {
        return;
      }

      const usage = Math.round((spent / allocated) * 100);

      if (usage >= 100) {
        list.push({
          id: `budget-over-${budget.id || budget._id || budget.category}-${monthKey}`,
          severity: 'critical',
          title: `${budget.category} budget exceeded`,
          description: `Spent Rs.${Math.round(spent)} on Rs.${Math.round(allocated)} allocated.`,
          feature: 'Budget',
        });
      } else if (usage >= 80) {
        list.push({
          id: `budget-warning-${budget.id || budget._id || budget.category}-${monthKey}`,
          severity: 'warning',
          title: `${budget.category} budget near limit`,
          description: `${usage}% of this category budget is already used.`,
          feature: 'Budget',
        });
      }
    });

    const totalIncome = monthIncome.reduce((sum, item) => sum + amountNumber(item?.amount), 0);
    const totalExpenses = monthExpenses.reduce((sum, item) => sum + amountNumber(item?.amount), 0);
    const net = totalIncome - totalExpenses;

    if (monthIncome.length || monthExpenses.length) {
      if (net < 0) {
        list.push({
          id: `cashflow-negative-${monthKey}`,
          severity: 'critical',
          title: 'Negative cash flow this month',
          description: `Expenses exceed income by Rs.${Math.round(Math.abs(net))}.`,
          feature: 'Income/Expense',
        });
      } else if (net === 0) {
        list.push({
          id: `cashflow-zero-${monthKey}`,
          severity: 'warning',
          title: 'Break-even cash flow',
          description: 'Income and expense are currently equal this month.',
          feature: 'Income/Expense',
        });
      } else {
        list.push({
          id: `cashflow-positive-${monthKey}`,
          severity: 'success',
          title: 'Positive cash flow',
          description: `Net positive Rs.${Math.round(net)} this month.`,
          feature: 'Income/Expense',
        });
      }
    }

    if (savingsTracker) {
      const monthlySavings = amountNumber(savingsTracker.monthlySavings);
      const savingsPercentage = amountNumber(savingsTracker.savingsPercentage);
      const goalAmount = amountNumber(savingsTracker.goalAmount);

      if (goalAmount <= 0) {
        list.push({
          id: `savings-goal-missing-${monthKey}`,
          severity: 'info',
          title: 'Savings goal not set',
          description: 'Set a savings goal to receive better progress notifications.',
          feature: 'Savings',
        });
      } else if (savingsPercentage >= 100) {
        list.push({
          id: `savings-achieved-${monthKey}`,
          severity: 'success',
          title: 'Savings goal achieved',
          description: savingsTracker.displayText || 'Great work, you reached your savings target.',
          feature: 'Savings',
        });
      } else if (monthlySavings < 0) {
        list.push({
          id: `savings-negative-${monthKey}`,
          severity: 'critical',
          title: 'Savings is negative this month',
          description: 'Current month expenses are higher than income.',
          feature: 'Savings',
        });
      } else {
        list.push({
          id: `savings-progress-${monthKey}`,
          severity: 'info',
          title: 'Savings progress update',
          description:
            savingsTracker.displayText || `${Math.round(savingsPercentage)}% of the monthly goal is completed.`,
          feature: 'Savings',
        });
      }
    }

    list.push({
      id: `future-features-${monthKey}`,
      severity: 'info',
      title: 'Future feature notifications ready',
      description: 'This bell supports adding upcoming alerts without UI changes.',
      feature: 'System',
    });

    return list
      .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
      .slice(0, 12);
  }, [budgets, expenses, income, savingsTracker]);

  const unreadCount = notifications.reduce((count, item) => (readMap[item.id] ? count : count + 1), 0);

  const markAllRead = () => {
    const next = { ...readMap };
    notifications.forEach((item) => {
      next[item.id] = true;
    });
    setReadMap(next);
  };

  const toggleRead = (id) => {
    setReadMap((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical') {
      return <CircleAlert size={15} className="notify-dot notify-dot-critical" />;
    }
    if (severity === 'warning') {
      return <CircleDashed size={15} className="notify-dot notify-dot-warning" />;
    }
    if (severity === 'success') {
      return <CircleCheck size={15} className="notify-dot notify-dot-success" />;
    }
    return <IndianRupee size={15} className="notify-dot notify-dot-info" />;
  };

  return (
    <div className="notify-wrap" ref={panelRef}>
      <button
        className={`icon-btn notify-trigger ${isOpen ? 'notify-open' : ''}`}
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {unreadCount > 0 ? <BellRing size={18} /> : <Bell size={18} />}
        {unreadCount > 0 && <span className="notify-badge">{Math.min(unreadCount, 99)}</span>}
      </button>

      {isOpen && (
        <section className="notify-panel" role="dialog" aria-label="Notifications panel">
          <header className="notify-header">
            <div>
              <h3>Notifications</h3>
              <p>{userLabel ? `For ${userLabel}` : 'Financial alerts and updates'}</p>
            </div>
            <button className="notify-read-all" type="button" onClick={markAllRead}>
              <CheckCheck size={14} />
              Mark all read
            </button>
          </header>

          <div className="notify-list">
            {!notifications.length && <p className="notify-empty">No notifications right now.</p>}
            {notifications.map((item) => {
              const isRead = Boolean(readMap[item.id]);
              return (
                <article
                  key={item.id}
                  className={`notify-item notify-${item.severity} ${isRead ? 'notify-read' : ''}`}
                  onClick={() => toggleRead(item.id)}
                >
                  <div className="notify-title-row">
                    <span className="notify-icon">{getSeverityIcon(item.severity)}</span>
                    <h4>{item.title}</h4>
                    {!isRead && <span className="notify-unread" aria-label="Unread" />}
                  </div>
                  <p>{item.description}</p>
                  <span className="notify-feature">{item.feature}</span>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default NotificationBell;
