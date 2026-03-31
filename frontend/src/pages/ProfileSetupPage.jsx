import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { CURRENCY_OPTIONS } from '../lib/currency';

const initialForm = {
  fullName: '',
  country: '',
  currency: 'INR',
  monthlyIncome: '',
  monthlyBudget: '',
  savingsGoal: '',
  occupation: '',
  dateOfBirth: '',
};

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadExistingProfile = async () => {
      if (!currentUser?.uid) {
        return;
      }

      try {
        const response = await api.get(`/api/profile/${currentUser.uid}`);

        if (response.data?.exists && response.data?.profile) {
          const profile = response.data.profile;
          setForm({
            fullName: profile.fullName || '',
            country: profile.country || '',
            currency: profile.currency || 'INR',
            monthlyIncome: profile.monthlyIncome || '',
            monthlyBudget: profile.monthlyBudget || '',
            savingsGoal: profile.savingsGoal || '',
            occupation: profile.occupation || '',
            dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '',
          });
        }
      } catch (_error) {
        setError('Could not load profile. You can still fill and save it now.');
      } finally {
        setHydrating(false);
      }
    };

    loadExistingProfile();
  }, [currentUser]);

  const onFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/profile', {
        firebaseUid: currentUser.uid,
        email: currentUser.email,
        ...form,
      });

      navigate('/dashboard');
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (hydrating) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
        <section className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6">
          Loading profile setup...
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 md:px-8">
      <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl md:p-8">
        <h1 className="text-3xl font-bold">Profile Setup</h1>
        <p className="mt-2 text-slate-300">
          Complete your profile so WealthWise can personalize dashboard numbers and planning.
        </p>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm text-slate-300">Full name</span>
            <input
              className="rounded-xl border border-white/20 bg-slate-900/70 px-4 py-3 outline-none focus:border-cyan-400"
              name="fullName"
              value={form.fullName}
              onChange={onFieldChange}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Country</span>
            <input
              className="rounded-xl border border-white/20 bg-slate-900/70 px-4 py-3 outline-none focus:border-cyan-400"
              name="country"
              value={form.country}
              onChange={onFieldChange}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Preferred currency</span>
            <select
              className="rounded-xl border border-white/20 bg-slate-900/70 px-4 py-3 outline-none focus:border-cyan-400"
              name="currency"
              value={form.currency}
              onChange={onFieldChange}
              required
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Monthly income</span>
            <input
              className="rounded-xl border border-white/20 bg-slate-900/70 px-4 py-3 outline-none focus:border-cyan-400"
              name="monthlyIncome"
              type="number"
              min="0"
              step="0.01"
              value={form.monthlyIncome}
              onChange={onFieldChange}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Monthly budget target</span>
            <input
              className="rounded-xl border border-white/20 bg-slate-900/70 px-4 py-3 outline-none focus:border-cyan-400"
              name="monthlyBudget"
              type="number"
              min="0"
              step="0.01"
              value={form.monthlyBudget}
              onChange={onFieldChange}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Savings goal</span>
            <input
              className="rounded-xl border border-white/20 bg-slate-900/70 px-4 py-3 outline-none focus:border-cyan-400"
              name="savingsGoal"
              type="number"
              min="0"
              step="0.01"
              value={form.savingsGoal}
              onChange={onFieldChange}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Occupation</span>
            <input
              className="rounded-xl border border-white/20 bg-slate-900/70 px-4 py-3 outline-none focus:border-cyan-400"
              name="occupation"
              value={form.occupation}
              onChange={onFieldChange}
            />
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm text-slate-300">Date of birth</span>
            <input
              className="rounded-xl border border-white/20 bg-slate-900/70 px-4 py-3 outline-none focus:border-cyan-400"
              name="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={onFieldChange}
            />
          </label>

          {error && <p className="text-sm text-rose-300 md:col-span-2">{error}</p>}

          <div className="md:col-span-2">
            <button
              className="rounded-xl bg-linear-to-r from-cyan-400 to-indigo-500 px-6 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:opacity-70"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving profile...' : 'Save profile'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default ProfileSetupPage;
