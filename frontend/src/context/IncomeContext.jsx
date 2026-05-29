import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const IncomeContext = createContext(null);

const defaultFilters = {
  search: '',
  source: 'All',
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

const matchesDateRange = (incomeDate, startDate, endDate) => {
  const date = toDateOnly(incomeDate);

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

const matchesFilters = (income, filters) => {
  if (!income) {
    return false;
  }

  if (filters.source && filters.source !== 'All' && income.source !== filters.source) {
    return false;
  }

  if (!matchesDateRange(income.date, filters.startDate, filters.endDate)) {
    return false;
  }

  const query = normalizeText(filters.search);
  if (!query) {
    return true;
  }

  return normalizeText(income.notes).includes(query) || normalizeText(income.source).includes(query);
};

export const IncomeProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [income, setIncome] = useState([]);
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

  const loadIncome = useCallback(async () => {
    if (!currentUser?.uid) {
      setIncome([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const headers = await getAuthHeaders();
      const params = {};

      if (filters.source && filters.source !== 'All') {
        params.source = filters.source;
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

      const response = await api.get('/api/income', {
        headers,
        params,
      });

      setIncome(response.data?.income || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load income.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, filters, getAuthHeaders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadIncome();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadIncome]);

  const createIncome = useCallback(
    async (payload) => {
      if (!currentUser?.uid) {
        throw new Error('No authenticated user found.');
      }

      setSaving(true);
      setError('');

      try {
        const headers = await getAuthHeaders();
        const response = await api.post('/api/income', payload, { headers });
        const createdIncome = response.data?.income;

        if (createdIncome && matchesFilters(createdIncome, filters)) {
          setIncome((current) => [createdIncome, ...current.filter((item) => item._id !== createdIncome._id)]);
        }

        return createdIncome;
      } catch (requestError) {
        const message = requestError.response?.data?.message || 'Failed to create income.';
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [currentUser, filters, getAuthHeaders]
  );

  const updateIncome = useCallback(
    async (incomeId, payload) => {
      if (!currentUser?.uid) {
        throw new Error('No authenticated user found.');
      }

      setSaving(true);
      setError('');

      try {
        const headers = await getAuthHeaders();
        const response = await api.put(`/api/income/${incomeId}`, payload, { headers });
        const updatedIncome = response.data?.income;

        if (updatedIncome) {
          setIncome((current) => {
            const next = current.filter((item) => item._id !== updatedIncome._id);
            return matchesFilters(updatedIncome, filters) ? [updatedIncome, ...next] : next;
          });
        }

        return updatedIncome;
      } catch (requestError) {
        const message = requestError.response?.data?.message || 'Failed to update income.';
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [currentUser, filters, getAuthHeaders]
  );

  const deleteIncome = useCallback(
    async (incomeId) => {
      if (!currentUser?.uid) {
        throw new Error('No authenticated user found.');
      }

      setDeletingId(incomeId);
      setError('');

      try {
        const headers = await getAuthHeaders();
        await api.delete(`/api/income/${incomeId}`, { headers });
        setIncome((current) => current.filter((item) => item._id !== incomeId));
      } catch (requestError) {
        const message = requestError.response?.data?.message || 'Failed to delete income.';
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
      refreshIncome: loadIncome,
    }),
    [income, filters, loading, saving, deletingId, error, createIncome, updateIncome, deleteIncome, loadIncome]
  );

  return <IncomeContext.Provider value={value}>{children}</IncomeContext.Provider>;
};

export const useIncome = () => {
  const context = useContext(IncomeContext);

  if (!context) {
    throw new Error('useIncome must be used inside IncomeProvider');
  }

  return context;
};
