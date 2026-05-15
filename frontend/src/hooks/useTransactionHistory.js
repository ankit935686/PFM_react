import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const useTransactionHistory = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    type: 'All',
    category: 'All',
    search: '',
    startDate: '',
    endDate: '',
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    limit: 50,
  });

  const getAuthHeaders = async () => {
    if (!currentUser) return {};
    const token = await currentUser.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      'x-firebase-uid': currentUser.uid,
      'x-firebase-email': currentUser.email || '',
    };
  };

  const loadTransactions = async (newFilters = filters) => {
    if (!currentUser?.uid) {
      setTransactions([]);
      return;
    }

    setLoading(true);

    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && value !== 'All') {
          params.append(key, value);
        }
      });

      const response = await api.get(`/api/transactions/history?${params}`, { headers });

      setTransactions(response.data?.transactions || []);
      setPagination(response.data?.pagination);
      setStatistics(response.data?.statistics);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [currentUser]);

  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    loadTransactions(newFilters);
  };

  return {
    transactions,
    statistics,
    loading,
    pagination,
    filters,
    updateFilters,
    loadTransactions,
  };
};

export default useTransactionHistory;
