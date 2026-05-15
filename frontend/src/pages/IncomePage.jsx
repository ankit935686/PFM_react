import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useIncome } from '../context/IncomeContext';
import api from '../lib/api';
import { formatCurrency } from '../lib/currency';
import IncomeFilters from '../components/income/IncomeFilters';
import IncomeModal from '../components/income/IncomeModal';
import IncomeTable from '../components/income/IncomeTable';

const initialForm = {
  amount: '',
  source: 'Salary',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
};

const toDateInputValue = (value) => {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
};

const IncomePage = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const {
    income,
    filters,
    loading,
    saving,
    deletingId,
    error,
    setFilters,
    setError,
    createIncome,
    updateIncome,
    deleteIncome,
  } = useIncome();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
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
    const total = income.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const highest = income.reduce(
      (current, entry) => (Number(entry.amount || 0) > Number(current.amount || 0) ? entry : current),
      income[0] || null
    );
    const sources = new Set(income.map((entry) => entry.source));

    return {
      total,
      count: income.length,
      sources: sources.size,
      highest,
    };
  }, [income]);

  const openCreateModal = () => {
    setEditingIncome(null);
    setForm(initialForm);
    setPageError('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (entry) => {
    setEditingIncome(entry);
    setForm({
      amount: entry.amount,
      source: entry.source || 'Salary',
      date: toDateInputValue(entry.date),
      notes: entry.notes || '',
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
    setEditingIncome(null);
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
      if (editingIncome?._id) {
        await updateIncome(editingIncome._id, payload);
      } else {
        await createIncome(payload);
      }

      closeModal();
    } catch (submitError) {
      setPageError(submitError.message || 'Could not save the income.');
    }
  };

  const handleDelete = async (entry) => {
    const confirmed = window.confirm(`Delete ${entry.source} income?`);

    if (!confirmed) {
      return;
    }

    setPageError('');
    setError('');

    try {
      await deleteIncome(entry._id);
    } catch (deleteError) {
      setPageError(deleteError.message || 'Could not delete the income.');
    }
  };

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      source: 'All',
      startDate: '',
      endDate: '',
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const topIncome = summary.highest ? formatCurrency(summary.highest.amount, currency) : formatCurrency(0, currency);

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
                Income Management
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400 md:text-base">
                Create, edit, search, and filter earned income records in one place.
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
                Add income
              </button>
            </div>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              { label: 'Total income', value: formatCurrency(summary.total, currency) },
              { label: 'Records loaded', value: String(summary.count) },
              { label: 'Sources used', value: String(summary.sources) },
              { label: 'Highest income', value: topIncome },
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
            <IncomeFilters filters={filters} onChange={updateFilter} onReset={resetFilters} />
          </div>

          {(error || pageError) && (
            <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {pageError || error}
            </div>
          )}

          <div className="mt-6">
            <IncomeTable
              income={income}
              currency={currency}
              loading={loading || profileLoading}
              deletingId={deletingId}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-300 backdrop-blur-xl">
            <p>Tip: add Salary, Freelance, and Business sources first to keep the dashboard meaningful.</p>
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

      <IncomeModal
        isOpen={isModalOpen}
        mode={editingIncome ? 'edit' : 'create'}
        form={form}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        onClose={closeModal}
        saving={saving}
      />
    </main>
  );
};

export default IncomePage;
