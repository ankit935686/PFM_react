import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChartsSection from '../components/dashboard/ChartsSection';
import api from '../lib/api';
import { formatCurrency } from '../lib/currency';

const monthOptions = [
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

const chartPalette = ['#3B82F6', '#22C55E', '#F59E0B', '#A855F7', '#EC4899', '#14B8A6'];

const AnalyticsPage = () => {
  const { currentUser } = useAuth();
  const outletContext = useOutletContext() || {};
  const currentDate = new Date();
  const selectedMonth = outletContext.selectedMonth || currentDate.getMonth() + 1;
  const selectedYear = outletContext.selectedYear || currentDate.getFullYear();
  const selectedPeriodLabel = outletContext.selectedPeriodLabel || `${monthOptions[selectedMonth - 1]} ${selectedYear}`;
  const [loading, setLoading] = useState(true);
  const [expenseCategoryData, setExpenseCategoryData] = useState([]);
  const [incomeExpenseTrendData, setIncomeExpenseTrendData] = useState([]);
  const [error, setError] = useState('');
  const [profileCurrency, setProfileCurrency] = useState('INR');

  const currencyFormatter = useMemo(
    () => (value) => formatCurrency(value, profileCurrency),
    [profileCurrency]
  );

  useEffect(() => {
    if (!currentUser?.uid) {
      return;
    }

    const loadProfileCurrency = async () => {
      try {
        const response = await api.get(`/api/profile/${currentUser.uid}`);
        setProfileCurrency(response.data?.profile?.currency || 'INR');
      } catch (_error) {
        setProfileCurrency('INR');
      }
    };

    loadProfileCurrency();
  }, [currentUser]);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        setExpenseCategoryData([]);
        setIncomeExpenseTrendData([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const token = await currentUser.getIdToken();
        const headers = {
          Authorization: `Bearer ${token}`,
          'x-firebase-uid': currentUser.uid,
          'x-firebase-email': currentUser.email || '',
        };
        const query = `month=${selectedMonth}&year=${selectedYear}`;

        const [categoriesResponse, trendResponse] = await Promise.all([
          api.get(`/api/dashboard/analytics/expense-categories?${query}`, { headers }),
          api.get(`/api/dashboard/analytics/income-expense-trend?${query}&months=6`, { headers }),
        ]);

        const categories = (categoriesResponse.data?.categories || []).map((item, index) => ({
          category: item.category,
          total: Number(item.total || 0),
          color: chartPalette[index % chartPalette.length],
        }));

        setExpenseCategoryData(categories);
        setIncomeExpenseTrendData(trendResponse.data?.trend || []);
      } catch (analyticsError) {
        setError(analyticsError.response?.data?.message || 'Failed to load analytics.');
        setExpenseCategoryData([]);
        setIncomeExpenseTrendData([]);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [currentUser, selectedMonth, selectedYear]);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-bold text-slate-100">Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">
          Deep dive into trends and category distribution for {selectedPeriodLabel}.
        </p>
      </header>

      <ChartsSection
        expenseCategoryData={expenseCategoryData}
        incomeExpenseTrendData={incomeExpenseTrendData}
        currencyFormatter={currencyFormatter}
        loading={loading}
        selectedPeriodLabel={selectedPeriodLabel}
      />

      {error && <p className="dashboard-error">{error}</p>}
    </section>
  );
};

export default AnalyticsPage;
