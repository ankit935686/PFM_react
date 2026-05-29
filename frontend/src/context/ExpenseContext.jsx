import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const ExpenseContext = createContext(null);

const defaultFilters = {
  search: '',
  category: 'All',
  startDate: '',
  endDate: '',
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const toDateOnly = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const matchesDateRange = (expenseDate, startDate, endDate) => {
  const date = toDateOnly(expenseDate);

  if (!date) {
    return false;
  }

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00.000`);
    if (date < start) {
      return false;
    }
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59.999`);
    if (date > end) {
      return false;
    }
  }

  return true;
};

const matchesFilters = (expense, filters) => {
  if (!expense) {
    return false;
  }

  if (filters.category && filters.category !== 'All' && expense.category !== filters.category) {
    return false;
  }

  if (!matchesDateRange(expense.date, filters.startDate, filters.endDate)) {
    return false;
  }

  const query = normalizeText(filters.search);
  if (!query) {
    return true;
  }

  return normalizeText(expense.notes).includes(query) || normalizeText(expense.category).includes(query);
};

export const ExpenseProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');

  const getAuthHeaders = useCallback(async () => {
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
  }, [currentUser]);

  const loadExpenses = useCallback(async () => {
    if (!currentUser?.uid) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const headers = await getAuthHeaders();
      const params = {};

      if (filters.category && filters.category !== 'All') {
        params.category = filters.category;
      }

      if (filters.startDate) {
        params.startDate = filters.startDate;
      }

      if (filters.endDate) {
        params.endDate = filters.endDate;
      }

      if (filters.search.trim()) {
        params.keyword = filters.search.trim();
      }

      const response = await api.get('/api/expenses', {
        headers,
        params,
      });

      setExpenses(response.data?.expenses || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, filters, getAuthHeaders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadExpenses();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadExpenses]);

  const createExpense = useCallback(
    async (payload) => {
      if (!currentUser?.uid) {
        throw new Error('No authenticated user found.');
      }

      setSaving(true);
      setError('');

      try {
        const headers = await getAuthHeaders();
        const response = await api.post('/api/expenses', payload, { headers });
        const createdExpense = response.data?.expense;

        if (createdExpense && matchesFilters(createdExpense, filters)) {
          setExpenses((current) => [createdExpense, ...current.filter((item) => item._id !== createdExpense._id)]);
        }

        return createdExpense;
      } catch (requestError) {
        const message = requestError.response?.data?.message || 'Failed to create expense.';
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [currentUser, filters, getAuthHeaders]
  );

  const updateExpense = useCallback(
    async (expenseId, payload) => {
      if (!currentUser?.uid) {
        throw new Error('No authenticated user found.');
      }

      setSaving(true);
      setError('');

      try {
        const headers = await getAuthHeaders();
        const response = await api.put(`/api/expenses/${expenseId}`, payload, { headers });
        const updatedExpense = response.data?.expense;

        if (updatedExpense) {
          setExpenses((current) => {
            const next = current.filter((item) => item._id !== updatedExpense._id);
            return matchesFilters(updatedExpense, filters) ? [updatedExpense, ...next] : next;
          });
        }

        return updatedExpense;
      } catch (requestError) {
        const message = requestError.response?.data?.message || 'Failed to update expense.';
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [currentUser, filters, getAuthHeaders]
  );

  const deleteExpense = useCallback(
    async (expenseId) => {
      if (!currentUser?.uid) {
        throw new Error('No authenticated user found.');
      }

      setDeletingId(expenseId);
      setError('');

      try {
        const headers = await getAuthHeaders();
        await api.delete(`/api/expenses/${expenseId}`, { headers });
        setExpenses((current) => current.filter((item) => item._id !== expenseId));
      } catch (requestError) {
        const message = requestError.response?.data?.message || 'Failed to delete expense.';
        setError(message);
        throw new Error(message);
      } finally {
        setDeletingId('');
      }
    },
    [currentUser, getAuthHeaders]
  );

  const value = useMemo(
    () => ({
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
      refreshExpenses: loadExpenses,
    }),
    [expenses, filters, loading, saving, deletingId, error, createExpense, updateExpense, deleteExpense, loadExpenses]
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);

  if (!context) {
    throw new Error('useExpenses must be used inside ExpenseProvider');
  }

  return context;
};
