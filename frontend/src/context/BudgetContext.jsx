import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const BudgetContext = createContext(null);

const normalizeBudget = (budget) => ({
  ...budget,
  id: budget.id || budget._id,
});

export const BudgetProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const loadBudgets = useCallback(async () => {
    if (!currentUser?.uid) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const headers = await getAuthHeaders();
      const response = await api.get('/api/budgets', { headers });
      const list = (response.data?.budgets || []).map(normalizeBudget);
      setBudgets(list);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, getAuthHeaders]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const addBudget = useCallback(
    async (payload) => {
      if (!currentUser?.uid) {
        throw new Error('No authenticated user found.');
      }

      setSaving(true);
      setError('');

      try {
        const headers = await getAuthHeaders();
        const response = await api.post('/api/budgets', payload, { headers });
        const created = normalizeBudget(response.data?.budget || {});

        setBudgets((current) => [created, ...current.filter((item) => item.id !== created.id)]);

        return created;
      } catch (requestError) {
        const message = requestError.response?.data?.message || 'Failed to create budget.';
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [currentUser, getAuthHeaders]
  );

  const updateBudget = useCallback(
    async (budgetId, payload) => {
      if (!currentUser?.uid) {
        throw new Error('No authenticated user found.');
      }

      setSaving(true);
      setError('');

      try {
        const headers = await getAuthHeaders();
        const response = await api.put(`/api/budgets/${budgetId}`, payload, { headers });
        const updated = normalizeBudget(response.data?.budget || {});

        setBudgets((current) => current.map((budget) => (budget.id === updated.id ? updated : budget)));

        return updated;
      } catch (requestError) {
        const message = requestError.response?.data?.message || 'Failed to update budget.';
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [currentUser, getAuthHeaders]
  );

  const deleteBudget = useCallback(
    async (budgetId) => {
      if (!currentUser?.uid) {
        throw new Error('No authenticated user found.');
      }

      setSaving(true);
      setError('');

      try {
        const headers = await getAuthHeaders();
        await api.delete(`/api/budgets/${budgetId}`, { headers });
        setBudgets((current) => current.filter((budget) => budget.id !== budgetId));
      } catch (requestError) {
        const message = requestError.response?.data?.message || 'Failed to delete budget.';
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [currentUser, getAuthHeaders]
  );

  const value = useMemo(
    () => ({
      budgets,
      loading,
      saving,
      error,
      setError,
      addBudget,
      updateBudget,
      deleteBudget,
      refreshBudgets: loadBudgets,
    }),
    [budgets, loading, saving, error, addBudget, updateBudget, deleteBudget, loadBudgets]
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};

export const useBudgets = () => {
  const context = useContext(BudgetContext);

  if (!context) {
    throw new Error('useBudgets must be used inside BudgetProvider');
  }

  return context;
};
