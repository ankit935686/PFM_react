import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { useIncome } from '../context/IncomeContext';
import api from '../lib/api';
import { formatCurrency } from '../lib/currency';
import FiltersBar from '../components/transactions/FiltersBar';
import ModalForm from '../components/transactions/ModalForm';
import TransactionTable from '../components/transactions/TransactionTable';

const initialForm = {
  type: 'Expense',
  amount: '',
  category: 'Food',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
};

const initialFilters = {
  search: '',
  type: 'All',
  category: 'All',
  startDate: '',
  endDate: '',
};

const toDateInput = (value) => new Date(value).toISOString().slice(0, 10);

const TransactionsPage = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { expenses, loading: expenseLoading, saving: expenseSaving, deletingId: expenseDeletingId, createExpense, updateExpense, deleteExpense } = useExpenses();
  const { income, loading: incomeLoading, saving: incomeSaving, deletingId: incomeDeletingId, createIncome, updateIncome, deleteIncome } = useIncome();

  const [profileCurrency, setProfileCurrency] = useState('INR');
  const [open, setOpen] = useState(searchParams.get('quickAdd') === '1');
  const [mode, setMode] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser?.uid) {
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await api.get(`/api/profile/${currentUser.uid}`);
        setProfileCurrency(response.data?.profile?.currency || 'INR');
      } catch (_error) {
        setProfileCurrency('INR');
      }
    };

    loadProfile();
  }, [currentUser]);

  useEffect(() => {
    if (searchParams.get('quickAdd') === '1') {
      setOpen(true);
      setMode('create');
      setEditingItem(null);
      setForm(initialForm);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const transactions = useMemo(() => {
    const normalizedIncome = income.map((item) => ({
      ...item,
      type: 'Income',
      category: item.source,
    }));

    const normalizedExpense = expenses.map((item) => ({
      ...item,
      type: 'Expense',
    }));

    return [...normalizedIncome, ...normalizedExpense].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [income, expenses]);

  const categories = useMemo(() => {
    return Array.from(new Set(transactions.map((item) => item.category).filter(Boolean))).sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return transactions.filter((item) => {
      const byType = filters.type === 'All' || item.type === filters.type;
      const byCategory = filters.category === 'All' || item.category === filters.category;
      const bySearch = !query || item.category.toLowerCase().includes(query) || String(item.notes || '').toLowerCase().includes(query);
      const date = new Date(item.date);

      const byStart = !filters.startDate || date >= new Date(`${filters.startDate}T00:00:00`);
      const byEnd = !filters.endDate || date <= new Date(`${filters.endDate}T23:59:59`);

      return byType && byCategory && bySearch && byStart && byEnd;
    });
  }, [transactions, filters]);

  const openCreate = () => {
    setMode('create');
    setEditingItem(null);
    setForm(initialForm);
    setError('');
    setOpen(true);
  };

  const openEdit = (item) => {
    setMode('edit');
    setEditingItem(item);
    setForm({
      type: item.type,
      amount: item.amount,
      category: item.category || 'Other',
      date: toDateInput(item.date),
      notes: item.notes || '',
    });
    setError('');
    setOpen(true);
  };

  const closeModal = () => {
    if (expenseSaving || incomeSaving) {
      return;
    }

    setOpen(false);
    setMode('create');
    setEditingItem(null);
    setForm(initialForm);
  };

  const onFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const payloadAmount = Number(form.amount);
    if (!Number.isFinite(payloadAmount) || payloadAmount < 0) {
      setError('Please provide a valid amount.');
      return;
    }

    try {
      if (form.type === 'Income') {
        const payload = {
          amount: payloadAmount,
          source: form.category,
          date: form.date,
          notes: form.notes.trim(),
        };

        if (mode === 'edit' && editingItem) {
          await updateIncome(editingItem._id, payload);
        } else {
          await createIncome(payload);
        }
      } else {
        const payload = {
          amount: payloadAmount,
          category: form.category,
          date: form.date,
          paymentMethod: 'UPI',
          notes: form.notes.trim(),
        };

        if (mode === 'edit' && editingItem) {
          await updateExpense(editingItem._id, payload);
        } else {
          await createExpense(payload);
        }
      }

      closeModal();
    } catch (requestError) {
      setError(requestError.message || 'Failed to save transaction.');
    }
  };

  const onDelete = async (item) => {
    const confirmed = window.confirm('Delete this transaction?');
    if (!confirmed) {
      return;
    }

    setError('');
    try {
      if (item.type === 'Income') {
        await deleteIncome(item._id);
      } else {
        await deleteExpense(item._id);
      }
    } catch (requestError) {
      setError(requestError.message || 'Failed to delete transaction.');
    }
  };

  const loading = incomeLoading || expenseLoading;
  const saving = incomeSaving || expenseSaving;
  const deletingId = incomeDeletingId || expenseDeletingId;

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1F2937] bg-[#111827] p-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Transactions</h1>
          <p className="mt-1 text-sm text-slate-400">Manage income and expense in one unified workflow.</p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-semibold text-slate-950"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </header>

      <FiltersBar
        filters={filters}
        onChange={(event) => {
          const { name, value } = event.target;
          setFilters((prev) => ({ ...prev, [name]: value }));
        }}
        onReset={() => setFilters(initialFilters)}
        categories={categories}
      />

      {error && (
        <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>
      )}

      <TransactionTable
        items={filtered}
        currencyFormatter={(value) => formatCurrency(value, profileCurrency)}
        loading={loading}
        deletingId={deletingId}
        onEdit={openEdit}
        onDelete={onDelete}
      />

      <ModalForm
        open={open}
        mode={mode}
        form={form}
        saving={saving}
        onClose={closeModal}
        onChange={onFormChange}
        onSubmit={onSubmit}
      />
    </section>
  );
};

export default TransactionsPage;
