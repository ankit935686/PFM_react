import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import api from '../lib/api';
import { formatCurrency } from '../lib/currency';
import ExpenseFilters from '../components/expenses/ExpenseFilters';
import ExpenseModal from '../components/expenses/ExpenseModal';
import ExpenseTable from '../components/expenses/ExpenseTable';

const initialForm = {
  amount: '',
  category: 'Food',
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: 'UPI',
  notes: '',
};

const toDateInputValue = (value) => {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
};

const ExpensesPage = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const {
    expenses,
    filters,
    loading,
    saving,
    deletingId,
    error,
    setFilters,
    setError,
    createExpense,
    updateExpense,
    deleteExpense,
  } = useExpenses();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [pageError, setPageError] = useState('');

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

  const currency = profile?.currency || 'INR';

  const summary = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const highest = expenses.reduce(
      (current, expense) => (Number(expense.amount || 0) > Number(current.amount || 0) ? expense : current),
      expenses[0] || null
    );
    const categories = new Set(expenses.map((expense) => expense.category));

    return {
      total,
      count: expenses.length,
      categories: categories.size,
      highest,
    };
  }, [expenses]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setForm(initialForm);
    setPageError('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setForm({
      amount: expense.amount,
      category: expense.category || 'Food',
      date: toDateInputValue(expense.date),
      paymentMethod: expense.paymentMethod || 'UPI',
      notes: expense.notes || '',
    });
    setPageError('');
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setIsModalOpen(false);
    setEditingExpense(null);
    setForm(initialForm);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPageError('');
    setError('');

    const payload = {
      ...form,
      amount: Number(form.amount),
      notes: form.notes.trim(),
    };

    try {
      if (editingExpense?._id) {
        await updateExpense(editingExpense._id, payload);
      } else {
        await createExpense(payload);
      }

      closeModal();
    } catch (submitError) {
      setPageError(submitError.message || 'Could not save the expense.');
    }
  };

  const handleDelete = async (expense) => {
    const confirmed = window.confirm(`Delete ${expense.category} expense?`);

    if (!confirmed) {
      return;
    }

    setPageError('');
    setError('');

    try {
      await deleteExpense(expense._id);
    } catch (deleteError) {
      setPageError(deleteError.message || 'Could not delete the expense.');
    }
  };

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      startDate: '',
      endDate: '',
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const topExpense = summary.highest ? formatCurrency(summary.highest.amount, currency) : formatCurrency(0, currency);

  return (
    <main className="min-h-screen bg-[#08111F] text-slate-100">
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_40%),radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,#08111F_0%,#0D1424_100%)]">
        <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-36 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <section className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-8">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
            <div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
              >
                <ArrowLeft size={16} />
                Back to dashboard
              </Link>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                Expense Management
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400 md:text-base">
                Create, edit, search, and filter your spending records in one place. Everything is scoped to the signed-in user.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current user</p>
                <p className="max-w-44 truncate text-sm font-semibold text-slate-100">
                  {currentUser?.email || 'Signed in user'}
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
              >
                <Plus size={16} />
                Add expense
              </button>
            </div>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              { label: 'Total expenses', value: formatCurrency(summary.total, currency) },
              { label: 'Records loaded', value: String(summary.count) },
              { label: 'Categories used', value: String(summary.categories) },
              { label: 'Highest expense', value: topExpense },
            ].map((card) => (
              <motion.article
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/10 backdrop-blur-xl"
              >
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-100">{card.value}</p>
              </motion.article>
            ))}
          </section>

          <div className="mt-6">
            <ExpenseFilters filters={filters} onChange={updateFilter} onReset={resetFilters} />
          </div>

          {(error || pageError) && (
            <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {pageError || error}
            </div>
          )}

          <div className="mt-6">
            <ExpenseTable
              expenses={expenses}
              currency={currency}
              loading={loading || profileLoading}
              deletingId={deletingId}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-300 backdrop-blur-xl">
            <p>
              Tip: start with Food, Transport, and Rent categories to get useful spending signals quickly.
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/5"
            >
              Logout
            </button>
          </div>
        </section>
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        mode={editingExpense ? 'edit' : 'create'}
        form={form}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        onClose={closeModal}
        saving={saving}
      />
    </main>
  );
};

export default ExpensesPage;
