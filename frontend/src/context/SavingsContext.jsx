import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const SavingsContext = createContext(null);

export const SavingsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [savingsTracker, setSavingsTracker] = useState(null);
  const [savingsHistory, setSavingsHistory] = useState([]);
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
    };
  }, [currentUser]);

  const loadSavingsTracker = useCallback(async () => {
    if (!currentUser?.uid) {
      setSavingsTracker(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const headers = await getAuthHeaders();
      const response = await api.get('/api/savings/tracker', { headers });
      setSavingsTracker(response.data?.savingsTracker || null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load savings tracker.');
      setSavingsTracker(null);
    } finally {
      setLoading(false);
    }
  }, [currentUser, getAuthHeaders]);

  const loadSavingsHistory = useCallback(async (months = 6) => {
    if (!currentUser?.uid) {
      setSavingsHistory([]);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await api.get(`/api/savings/history?months=${months}`, { headers });
      setSavingsHistory(response.data?.savingsHistory || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load savings history.');
      setSavingsHistory([]);
    }
  }, [currentUser, getAuthHeaders]);

  useEffect(() => {
    loadSavingsTracker();
    loadSavingsHistory();
  }, [loadSavingsTracker, loadSavingsHistory]);

  const setSavingsGoal = useCallback(
    async (goalAmount, month, year, notes = '') => {
      if (!currentUser?.uid) {
        throw new Error('No authenticated user found.');
      }

      setSaving(true);
      setError('');

      try {
        const headers = await getAuthHeaders();
        const response = await api.post(
          '/api/savings/goal',
          {
            goalAmount,
            month: month || new Date().getMonth() + 1,
            year: year || new Date().getFullYear(),
            notes,
          },
          { headers }
        );

        await loadSavingsTracker();
        return response.data?.savingsGoal;
      } catch (requestError) {
        const message = requestError.response?.data?.message || 'Failed to set savings goal.';
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [currentUser, getAuthHeaders, loadSavingsTracker]
  );

  const deleteSavingsGoal = useCallback(
    async (month, year) => {
      if (!currentUser?.uid) {
        throw new Error('No authenticated user found.');
      }

      setSaving(true);
      setError('');

      try {
        const headers = await getAuthHeaders();
        await api.delete('/api/savings/goal', {
          headers,
          data: { month, year },
        });

        await loadSavingsTracker();
      } catch (requestError) {
        const message = requestError.response?.data?.message || 'Failed to delete savings goal.';
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [currentUser, getAuthHeaders, loadSavingsTracker]
  );

  const value = {
    savingsTracker,
    savingsHistory,
    loading,
    saving,
    error,
    setSavingsGoal,
    deleteSavingsGoal,
    loadSavingsTracker,
    loadSavingsHistory,
  };

  return <SavingsContext.Provider value={value}>{children}</SavingsContext.Provider>;
};

export const useSavings = () => {
  const context = useContext(SavingsContext);
  if (!context) {
    throw new Error('useSavings must be used within a SavingsProvider');
  }
  return context;
};
