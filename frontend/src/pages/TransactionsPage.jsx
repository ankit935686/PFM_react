import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, History, Plus as PlusIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { useIncome } from '../context/IncomeContext';
import api from '../lib/api';
import { formatCurrency } from '../lib/currency';
import FiltersBar from '../components/transactions/FiltersBar';
import ModalForm from '../components/transactions/ModalForm';
import TransactionTable from '../components/transactions/TransactionTable';
import TransactionHistoryFilters from '../components/transactions/TransactionHistoryFilters';
import TransactionStatistics from '../components/transactions/TransactionStatistics';
import TransactionHistoryList from '../components/transactions/TransactionHistoryList';
import useTransactionHistory from '../hooks/useTransactionHistory';

const initialForm = {
  type: 'Expense',
  amount: '',
  category: 'Food',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
};

const expenseCategoryOptions = ['Food', 'Transport', 'Shopping', 'Rent', 'Utilities', 'Health', 'Education', 'Entertainment', 'Travel', 'Groceries', 'Bills', 'Other'];
const incomeCategoryOptions = ['Salary', 'Freelance', 'Business', 'Investments', 'Rental', 'Bonus', 'Other'];

const getDefaultCategoryForType = (type) => (type === 'Income' ? incomeCategoryOptions[0] : expenseCategoryOptions[0]);

const getValidCategoryForType = (type, category) => {
  const categories = type === 'Income' ? incomeCategoryOptions : expenseCategoryOptions;
  return categories.includes(category) ? category : getDefaultCategoryForType(type);
};

const scannedCategoryMap = {
  dining: 'Food',
  groceries: 'Groceries',
  grocery: 'Groceries',
  transport: 'Transport',
  shopping: 'Shopping',
  utilities: 'Utilities',
  health: 'Health',
  education: 'Education',
  entertainment: 'Entertainment',
  travel: 'Travel',
  rent: 'Rent',
  bills: 'Bills',
  food: 'Food',
  other: 'Other',
  uncategorized: 'Other',
};

const getScannedExpenseCategory = (category) => {
  const normalized = String(category || '').trim().toLowerCase();
  const mapped = scannedCategoryMap[normalized];
  return getValidCategoryForType('Expense', mapped || 'Other');
};

const initialFilters = {
  search: '',
  type: 'All',
  category: 'All',
  startDate: '',
  endDate: '',
};

const toDateInput = (value) => new Date(value).toISOString().slice(0, 10);

const toSafeDateInput = (value) => {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
};

const TransactionsPage = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { expenses, loading: expenseLoading, saving: expenseSaving, deletingId: expenseDeletingId, createExpense, updateExpense, deleteExpense } = useExpenses();
  const { income, loading: incomeLoading, saving: incomeSaving, deletingId: incomeDeletingId, createIncome, updateIncome, deleteIncome } = useIncome();
  const { transactions: historyTransactions, statistics, loading: historyLoading, pagination, filters: historyFilters, updateFilters } = useTransactionHistory();

  const [activeTab, setActiveTab] = useState('manage');
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
      category: getValidCategoryForType(item.type, item.category),
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
    setForm((prev) => {
      if (name === 'type') {
        return {
          ...prev,
          type: value,
          category: getDefaultCategoryForType(value),
        };
      }

      if (name === 'category') {
        return {
          ...prev,
          category: value,
        };
      }

      return { ...prev, [name]: value };
    });
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

  const addScannedExpense = async ({ amount, category, date, notes }) => {
    const payloadAmount = Number(amount);

    if (!Number.isFinite(payloadAmount) || payloadAmount <= 0) {
      throw new Error('Scanned amount is not valid.');
    }

    const payload = {
      amount: payloadAmount,
      category: getScannedExpenseCategory(category),
      date: toSafeDateInput(date),
      paymentMethod: 'UPI',
      notes: String(notes || '').trim(),
    };

    await createExpense(payload);
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
      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1F2937]">
        <button
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-3 font-medium transition ${
            activeTab === 'manage'
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          type="button"
        >
          <div className="flex items-center gap-2">
            <PlusIcon size={18} />
            Manage
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 font-medium transition ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          type="button"
        >
          <div className="flex items-center gap-2">
            <History size={18} />
            History & Analytics
          </div>
        </button>
      </div>

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <>
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
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <TransactionHistoryFilters
            filters={historyFilters}
            onFilterChange={updateFilters}
            categories={categories}
            loading={historyLoading}
          />

          <TransactionStatistics
            statistics={statistics}
            currencyFormatter={(value) => formatCurrency(value, profileCurrency)}
            loading={historyLoading}
          />

          <div>
            <h3 className="text-lg font-semibold text-[#E5E7EB] mb-4">Transactions</h3>
            <TransactionHistoryList
              transactions={historyTransactions}
              currencyFormatter={(value) => formatCurrency(value, profileCurrency)}
              loading={historyLoading}
              pagination={pagination}
              onPageChange={(page) =>
                updateFilters({
                  ...historyFilters,
                  page,
                })
              }
            />
          </div>
        </div>
      )}

      <ModalForm
        open={open}
        mode={mode}
        form={form}
        saving={saving}
        onClose={closeModal}
        onChange={onFormChange}
        onSubmit={onSubmit}
        onAddScan={addScannedExpense}
      />
    </section>
  );
};

export default TransactionsPage;
