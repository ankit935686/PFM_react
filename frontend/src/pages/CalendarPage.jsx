import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock3, Goal, ReceiptText, Repeat2, Wallet } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/currency';

const monthNames = [
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

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const detailTabs = ['Expenses', 'Income', 'Goals', 'Reminders', 'Transactions', 'Bills/Subscriptions', 'Split Expenses'];
const quickFilters = ['This Month', 'Expenses Only', 'Goals Only', 'Reminders Only', 'Upcoming Events'];

const toDateKey = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const buildCalendarCells = (year, month) => {
  const firstDay = new Date(year, month - 1, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month - 1, day));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
};

const CalendarPage = () => {
  const { currentUser } = useAuth();
  const outletContext = useOutletContext() || {};
  const [searchParams] = useSearchParams();

  const today = useMemo(() => new Date(), []);
  const selectedMonth = Number(outletContext.selectedMonth || today.getMonth() + 1);
  const selectedYear = Number(outletContext.selectedYear || today.getFullYear());
  const setSelectedMonth = outletContext.setSelectedMonth;
  const setSelectedYear = outletContext.setSelectedYear;

  const [overview, setOverview] = useState([]);
  const [dateDetails, setDateDetails] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [activeTab, setActiveTab] = useState('Transactions');
  const [activeFilter, setActiveFilter] = useState('This Month');
  const [monthTransitionKey, setMonthTransitionKey] = useState(0);
  const [reminderForm, setReminderForm] = useState({ title: '', description: '', remindDate: '', remindTime: '09:00' });

  const getDefaultReminderTime = () => '09:00';

  const yearOptions = useMemo(() => Array.from({ length: 11 }, (_, i) => today.getFullYear() - 5 + i), [today]);

  const getAuthHeaders = async () => {
    if (!currentUser) return {};
    const token = await currentUser.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      'x-firebase-uid': currentUser.uid,
      'x-firebase-email': currentUser.email || '',
      'x-firebase-name': currentUser.displayName || '',
    };
  };

  const shiftMonth = (delta) => {
    const date = new Date(selectedYear, selectedMonth - 1 + delta, 1);
    if (typeof setSelectedMonth === 'function') setSelectedMonth(date.getMonth() + 1);
    if (typeof setSelectedYear === 'function') setSelectedYear(date.getFullYear());
    setMonthTransitionKey((prev) => prev + 1);
  };

  const goToday = () => {
    const now = new Date();
    if (typeof setSelectedMonth === 'function') setSelectedMonth(now.getMonth() + 1);
    if (typeof setSelectedYear === 'function') setSelectedYear(now.getFullYear());
    const dateKey = toDateKey(now);
    setSelectedDate(dateKey);
    setReminderForm((prev) => ({ ...prev, remindDate: dateKey, remindTime: prev.remindTime || '09:00' }));
    setMonthTransitionKey((prev) => prev + 1);
  };

  useEffect(() => {
    const queryDate = searchParams.get('date');
    if (queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate)) {
      setSelectedDate(queryDate);
      setReminderForm((prev) => ({ ...prev, remindDate: queryDate, remindTime: prev.remindTime || '09:00' }));
      return;
    }

    const fallback = toDateKey(new Date(selectedYear, selectedMonth - 1, today.getDate()));
    setSelectedDate((current) => current || fallback);
    setReminderForm((prev) => ({ ...prev, remindDate: fallback, remindTime: prev.remindTime || '09:00' }));
  }, [searchParams, selectedMonth, selectedYear, today]);

  const loadOverview = async () => {
    if (!currentUser?.uid) return;
    setLoadingOverview(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      const response = await api.get(`/api/calendar/overview?month=${selectedMonth}&year=${selectedYear}`, { headers });
      setOverview(response.data?.days || []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to load calendar overview.');
      setOverview([]);
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadDateDetails = async (dateKey) => {
    if (!currentUser?.uid || !dateKey) return;
    setLoadingDetails(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      const response = await api.get(`/api/calendar/date/${dateKey}`, { headers });
      setDateDetails(response.data || null);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to load date details.');
      setDateDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [currentUser, selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedDate) loadDateDetails(selectedDate);
  }, [currentUser, selectedDate]);

  const dayMap = useMemo(() => overview.reduce((acc, day) => ({ ...acc, [day.date]: day }), {}), [overview]);
  const calendarCells = useMemo(() => buildCalendarCells(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  const overviewStats = useMemo(() => {
    return overview.reduce(
      (acc, day) => {
        acc.expense += day.counts?.expense || 0;
        acc.income += day.counts?.income || 0;
        acc.reminders += day.counts?.reminders || 0;
        acc.goals += (day.counts?.goalStart || 0) + (day.counts?.goalEnd || 0);
        return acc;
      },
      { expense: 0, income: 0, reminders: 0, goals: 0 }
    );
  }, [overview]);

  const filteredDayIndicators = (day) => {
    if (!day?.hasEvents) return [];
    const indicators = [
      { key: 'expense', label: 'Exp', count: day.counts.expense, cls: 'cal-event-expense' },
      { key: 'income', label: 'Inc', count: day.counts.income, cls: 'cal-event-income' },
      { key: 'reminders', label: 'Rem', count: day.counts.reminders, cls: 'cal-event-reminder' },
      { key: 'goals', label: 'Goal', count: (day.counts.goalStart || 0) + (day.counts.goalEnd || 0), cls: 'cal-event-goal' },
    ].filter((item) => item.count > 0);

    if (activeFilter === 'Expenses Only') return indicators.filter((i) => i.key === 'expense');
    if (activeFilter === 'Goals Only') return indicators.filter((i) => i.key === 'goals');
    if (activeFilter === 'Reminders Only') return indicators.filter((i) => i.key === 'reminders');
    if (activeFilter === 'Upcoming Events') {
      const todayKey = toDateKey(today);
      const dateKey = day.date;
      return dateKey >= todayKey ? indicators : [];
    }
    return indicators;
  };

  const reminderStatus = (reminder) => {
    if (reminder.isCompleted) return { text: 'Completed', cls: 'cal-status-completed' };
    const remindDate = new Date(reminder.remindAt);
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const nextThree = new Date(dayStart);
    nextThree.setDate(dayStart.getDate() + 3);
    if (remindDate < dayStart) return { text: 'Overdue', cls: 'cal-status-overdue' };
    if (toDateKey(remindDate) === toDateKey(dayStart)) return { text: 'Today', cls: 'cal-status-today' };
    if (remindDate <= nextThree) return { text: 'Upcoming', cls: 'cal-status-upcoming' };
    return { text: 'Scheduled', cls: 'cal-status-scheduled' };
  };

  const allTransactions = useMemo(() => {
    if (!dateDetails) return [];
    const expenses = (dateDetails.expenses || []).map((item) => ({
      id: item._id,
      kind: 'Expense',
      title: item.category,
      amount: Number(item.amount || 0),
      note: item.notes || '',
    }));
    const income = (dateDetails.income || []).map((item) => ({
      id: item._id,
      kind: 'Income',
      title: item.source,
      amount: Number(item.amount || 0),
      note: item.notes || '',
    }));
    return [...expenses, ...income].sort((a, b) => b.amount - a.amount);
  }, [dateDetails]);

  const billsFromReminders = useMemo(() => {
    const reminders = dateDetails?.reminders || [];
    return reminders.filter((item) => /bill|emi|subscription|renew|rent|due/i.test(`${item.title} ${item.description || ''}`));
  }, [dateDetails]);

  const splitsFromReminders = useMemo(() => {
    const reminders = dateDetails?.reminders || [];
    return reminders.filter((item) => /split|settle|splitwise|shared/i.test(`${item.title} ${item.description || ''}`));
  }, [dateDetails]);

  const createReminder = async (event) => {
    event.preventDefault();
    if (!reminderForm.title.trim() || !reminderForm.remindDate || !reminderForm.remindTime) {
      setError('Reminder title and reminder date/time are required.');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const [year, month, day] = (reminderForm.remindDate || '').split('-').map(Number);
      const [hours, minutes] = (reminderForm.remindTime || getDefaultReminderTime()).split(':').map(Number);
      const remindAtIso = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0).toISOString();
      await api.post(
        '/api/calendar/reminders',
        {
          title: reminderForm.title.trim(),
          description: reminderForm.description.trim(),
          remindAt: remindAtIso,
        },
        { headers }
      );
      setReminderForm((prev) => ({ ...prev, title: '', description: '' }));
      await Promise.all([loadOverview(), loadDateDetails(selectedDate)]);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to create reminder.');
    }
  };

  const setReminderDateTime = (datePart, timePart = reminderForm.remindTime || getDefaultReminderTime()) => {
    if (!datePart) return;
    setReminderForm((prev) => ({ ...prev, remindDate: datePart, remindTime: timePart || getDefaultReminderTime() }));
  };

  const applyQuickReminderDate = (kind) => {
    const base = new Date();
    if (kind === 'selected' && selectedDate) {
      setReminderDateTime(selectedDate, reminderForm.remindTime || getDefaultReminderTime());
      return;
    }
    if (kind === 'tomorrow') base.setDate(base.getDate() + 1);
    if (kind === 'nextWeek') base.setDate(base.getDate() + 7);
    setReminderDateTime(toDateKey(base), reminderForm.remindTime || getDefaultReminderTime());
  };

  const markReminder = async (reminderId, isCompleted) => {
    try {
      const headers = await getAuthHeaders();
      await api.put(`/api/calendar/reminders/${reminderId}`, { isCompleted }, { headers });
      await Promise.all([loadOverview(), loadDateDetails(selectedDate)]);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to update reminder.');
    }
  };

  const deleteReminder = async (reminderId) => {
    try {
      const headers = await getAuthHeaders();
      await api.delete(`/api/calendar/reminders/${reminderId}`, { headers });
      await Promise.all([loadOverview(), loadDateDetails(selectedDate)]);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to delete reminder.');
    }
  };

  return (
    <section className="calendar-premium space-y-5">
      <header className="cal-header">
        <div>
          <h1>Financial Calendar Hub</h1>
          <p>Track transactions, reminders, goals, deadlines, and future planning in one intelligent calendar workflow.</p>
          <div className="cal-quick-filters">
            {quickFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`cal-pill ${activeFilter === filter ? 'is-active' : ''}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        <div className="cal-stat-strip">
          <p><span>{overviewStats.expense}</span> Expense markers</p>
          <p><span>{overviewStats.income}</span> Income markers</p>
          <p><span>{overviewStats.reminders}</span> Reminder markers</p>
          <p><span>{overviewStats.goals}</span> Goal markers</p>
        </div>
      </header>

      {error && <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

      <div className="cal-main-grid">
        <article className="cal-board">
          <div className="cal-controls">
            <div className="cal-title">
              <h2>{monthNames[selectedMonth - 1]} {selectedYear}</h2>
              <span>Selected date: {selectedDate}</span>
            </div>
            <div className="cal-control-actions">
              <button type="button" className="cal-nav-btn" onClick={() => shiftMonth(-1)}><ChevronLeft size={16} /></button>
              <button type="button" className="cal-nav-btn" onClick={() => shiftMonth(1)}><ChevronRight size={16} /></button>
              <button type="button" className="cal-nav-btn cal-today-btn" onClick={goToday}>Today</button>
              <select
                className="cal-select"
                value={selectedMonth}
                onChange={(event) => {
                  if (typeof setSelectedMonth === 'function') setSelectedMonth(Number(event.target.value));
                  setMonthTransitionKey((prev) => prev + 1);
                }}
              >
                {monthNames.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
              </select>
              <select
                className="cal-select"
                value={selectedYear}
                onChange={(event) => {
                  if (typeof setSelectedYear === 'function') setSelectedYear(Number(event.target.value));
                  setMonthTransitionKey((prev) => prev + 1);
                }}
              >
                {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>

          <div key={monthTransitionKey} className="cal-grid-wrap">
            <div className="cal-weekdays">
              {dayLabels.map((label) => <span key={label}>{label}</span>)}
            </div>
            <div className="cal-grid">
              {calendarCells.map((dateObj, index) => {
                if (!dateObj) return <div key={`empty-${index}`} className="cal-empty-cell" />;

                const dateKey = toDateKey(dateObj);
                const day = dayMap[dateKey];
                const isSelected = selectedDate === dateKey;
                const isToday = toDateKey(today) === dateKey;
                const indicators = filteredDayIndicators(day);

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateKey);
                      setReminderForm((prev) => ({ ...prev, remindDate: dateKey, remindTime: prev.remindTime || '09:00' }));
                    }}
                    className={`cal-day-card ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}`}
                  >
                    <div className="cal-day-head">
                      <span className="cal-day-number">{dateObj.getDate()}</span>
                      {isToday && <span className="cal-today-tag">Today</span>}
                    </div>
                    <div className="cal-day-badges">
                      {indicators.slice(0, 3).map((item) => (
                        <span key={`${dateKey}-${item.key}`} className={`cal-badge ${item.cls}`}>
                          {item.label} {item.count}
                        </span>
                      ))}
                      {indicators.length > 3 && <span className="cal-badge cal-event-more">+{indicators.length - 3}</span>}
                    </div>
                    <div className="cal-day-footer">
                      <small>{day?.totals?.expenseAmount ? formatCurrency(day.totals.expenseAmount, 'INR') : '-'}</small>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {loadingOverview && <p className="mt-3 text-sm text-slate-400">Loading month events...</p>}
        </article>

        <article className="cal-reminder-panel">
          <h3>Quick Reminder</h3>
          <p>Attach reminders directly to selected date and trigger bell notifications automatically.</p>
          <div className="cal-reminder-shortcuts">
            <button type="button" className="cal-mini-btn" onClick={() => applyQuickReminderDate('selected')}>Use Selected Date</button>
            <button type="button" className="cal-mini-btn" onClick={() => applyQuickReminderDate('today')}>Today</button>
            <button type="button" className="cal-mini-btn" onClick={() => applyQuickReminderDate('tomorrow')}>Tomorrow</button>
            <button type="button" className="cal-mini-btn" onClick={() => applyQuickReminderDate('nextWeek')}>Next Week</button>
          </div>
          <form className="mt-3 space-y-2" onSubmit={createReminder}>
            <input
              className="cal-input"
              placeholder="Reminder title"
              value={reminderForm.title}
              onChange={(event) => setReminderForm((prev) => ({ ...prev, title: event.target.value }))}
            />
            <textarea
              className="cal-input"
              rows="3"
              placeholder="Description (optional)"
              value={reminderForm.description}
              onChange={(event) => setReminderForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <div className="cal-reminder-datetime-grid">
              <label className="cal-reminder-label">
                <span>Date</span>
                <input
                  type="date"
                  className="cal-input"
                  value={reminderForm.remindDate}
                  onChange={(event) => setReminderDateTime(event.target.value, reminderForm.remindTime)}
                />
              </label>
              <label className="cal-reminder-label">
                <span>Time</span>
                <input
                  type="time"
                  className="cal-input"
                  value={reminderForm.remindTime}
                  onChange={(event) => setReminderDateTime(reminderForm.remindDate || selectedDate, event.target.value)}
                />
              </label>
            </div>
            <button type="submit" className="cal-primary-btn">Save Reminder</button>
          </form>
        </article>
      </div>

      <article className="cal-details">
        <div className="cal-details-head">
          <div>
            <h2>Date Details</h2>
            <p>{selectedDate || '-'} | Dive by category with segmented view</p>
          </div>
          <div className="cal-tab-strip">
            {detailTabs.map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`cal-tab ${activeTab === tab ? 'is-active' : ''}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loadingDetails && <p className="mt-2 text-sm text-slate-400">Loading date details...</p>}

        {!loadingDetails && dateDetails && (
          <div className="cal-details-body">
            {activeTab === 'Expenses' && (
              <div className="cal-card-list">
                {(dateDetails.expenses || []).map((expense) => (
                  <article key={expense._id} className="cal-data-card">
                    <header><Wallet size={14} /> <strong>{expense.category}</strong></header>
                    <p>{formatCurrency(expense.amount, 'INR')}</p>
                    <small>{expense.notes || 'No note'}</small>
                  </article>
                ))}
                {!dateDetails.expenses?.length && <p className="cal-empty">No expenses on this date.</p>}
              </div>
            )}

            {activeTab === 'Income' && (
              <div className="cal-card-list">
                {(dateDetails.income || []).map((item) => (
                  <article key={item._id} className="cal-data-card">
                    <header><ReceiptText size={14} /> <strong>{item.source}</strong></header>
                    <p>{formatCurrency(item.amount, 'INR')}</p>
                    <small>{item.notes || 'No note'}</small>
                  </article>
                ))}
                {!dateDetails.income?.length && <p className="cal-empty">No income entries on this date.</p>}
              </div>
            )}

            {activeTab === 'Goals' && (
              <div className="cal-card-list">
                {(dateDetails.goalStarts || []).map((goal) => (
                  <article key={`start-${goal._id}`} className="cal-data-card">
                    <header><Goal size={14} /> <strong>{goal.goalName}</strong></header>
                    <p>Goal Start</p>
                    <small>Target: {formatCurrency(goal.targetAmount || 0, 'INR')}</small>
                  </article>
                ))}
                {(dateDetails.goalEnds || []).map((goal) => (
                  <article key={`end-${goal._id}`} className="cal-data-card">
                    <header><Goal size={14} /> <strong>{goal.goalName}</strong></header>
                    <p>Goal Deadline</p>
                    <small>Target: {formatCurrency(goal.targetAmount || 0, 'INR')}</small>
                  </article>
                ))}
                {!dateDetails.goalStarts?.length && !dateDetails.goalEnds?.length && <p className="cal-empty">No goal milestones on this date.</p>}
              </div>
            )}

            {activeTab === 'Reminders' && (
              <div className="cal-card-list">
                {(dateDetails.reminders || []).map((reminder) => {
                  const status = reminderStatus(reminder);
                  return (
                    <article key={reminder._id} className="cal-data-card">
                      <header><Clock3 size={14} /> <strong>{reminder.title}</strong></header>
                      <p>{reminder.description || 'No description'}</p>
                      <div className="cal-reminder-actions">
                        <span className={`cal-status-chip ${status.cls}`}>{status.text}</span>
                        <button type="button" className="cal-mini-btn" onClick={() => markReminder(reminder._id, !reminder.isCompleted)}>
                          {reminder.isCompleted ? 'Mark Pending' : 'Mark Done'}
                        </button>
                        <button type="button" className="cal-mini-btn danger" onClick={() => deleteReminder(reminder._id)}>Delete</button>
                      </div>
                    </article>
                  );
                })}
                {!dateDetails.reminders?.length && <p className="cal-empty">No reminders for this date.</p>}
              </div>
            )}

            {activeTab === 'Transactions' && (
              <div className="cal-card-list">
                {allTransactions.map((item) => (
                  <article key={`${item.kind}-${item.id}`} className="cal-data-card">
                    <header><ReceiptText size={14} /> <strong>{item.title}</strong></header>
                    <p className={item.kind === 'Expense' ? 'text-rose-300' : 'text-emerald-300'}>
                      {item.kind === 'Expense' ? '-' : '+'} {formatCurrency(item.amount, 'INR')}
                    </p>
                    <small>{item.kind} {item.note ? `| ${item.note}` : ''}</small>
                  </article>
                ))}
                {!allTransactions.length && <p className="cal-empty">No transactions on this date.</p>}
              </div>
            )}

            {activeTab === 'Bills/Subscriptions' && (
              <div className="cal-card-list">
                {billsFromReminders.map((item) => (
                  <article key={item._id} className="cal-data-card">
                    <header><Repeat2 size={14} /> <strong>{item.title}</strong></header>
                    <p>{item.description || 'Bill or subscription reminder'}</p>
                    <small>{new Date(item.remindAt).toLocaleString()}</small>
                  </article>
                ))}
                {!billsFromReminders.length && <p className="cal-empty">No bills/subscriptions on this date yet.</p>}
              </div>
            )}

            {activeTab === 'Split Expenses' && (
              <div className="cal-card-list">
                {splitsFromReminders.map((item) => (
                  <article key={item._id} className="cal-data-card">
                    <header><Repeat2 size={14} /> <strong>{item.title}</strong></header>
                    <p>{item.description || 'Split settlement reminder'}</p>
                    <small>{new Date(item.remindAt).toLocaleString()}</small>
                  </article>
                ))}
                {!splitsFromReminders.length && <p className="cal-empty">No split-expense events for this date yet.</p>}
              </div>
            )}
          </div>
        )}
      </article>
    </section>
  );
};

export default CalendarPage;
