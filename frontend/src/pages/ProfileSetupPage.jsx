import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { CURRENCY_OPTIONS } from '../lib/currency';

const initialForm = {
  fullName: '',
  country: '',
  currency: 'INR',
  occupation: '',
  dateOfBirth: '',
};

const steps = [
  {
    id: 'basic',
    title: 'Basic info',
    subtitle: 'Tell us how you want to be addressed.',
  },
  {
    id: 'personal',
    title: 'Personal details',
    subtitle: 'Add your country and optional personal info.',
  },
  {
    id: 'preferences',
    title: 'Preferences',
    subtitle: 'Choose the currency you want to see everywhere.',
  },
  {
    id: 'review',
    title: 'Review',
    subtitle: 'Confirm your details and save your profile.',
  },
];

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [stepIndex, setStepIndex] = useState(0);
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

  const completion = useMemo(() => {
    const fields = ['fullName', 'country', 'currency', 'occupation', 'dateOfBirth'];
    const filled = fields.filter((field) => String(form[field] || '').trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  const isStepValid = (index) => {
    if (index === 0) return Boolean(String(form.fullName || '').trim());
    if (index === 1) return Boolean(String(form.country || '').trim());
    if (index === 2) return Boolean(String(form.currency || '').trim());
    return true;
  };

  const handleNext = () => {
    setError('');
    if (!isStepValid(stepIndex)) {
      setError('Please complete the required fields before continuing.');
      return;
    }
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setError('');
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/profile', {
        firebaseUid: currentUser.uid,
        email: currentUser.email,
        fullName: form.fullName,
        country: form.country,
        currency: form.currency,
        occupation: form.occupation,
        dateOfBirth: form.dateOfBirth,
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Profile Setup</h1>
            <p className="mt-2 text-slate-300">
              Set up your personal details so the dashboard shows the right name and currency.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            Completion <span className="font-semibold text-white">{completion}%</span>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Profile completion</span>
            <span>{completion}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-linear-to-r from-cyan-400 to-indigo-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`rounded-2xl border px-3 py-3 text-sm ${
                index === stepIndex
                  ? 'border-cyan-400/60 bg-cyan-400/10 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300'
              }`}
            >
              <div className="text-xs uppercase tracking-wide">Step {index + 1}</div>
              <div className="font-semibold">{step.title}</div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold text-white">{steps[stepIndex].title}</h2>
          <p className="mt-1 text-sm text-slate-300">{steps[stepIndex].subtitle}</p>
        </div>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          {stepIndex === 0 && (
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
          )}

          {stepIndex === 1 && (
            <>
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
                <span className="text-sm text-slate-300">Occupation (optional)</span>
                <input
                  className="rounded-xl border border-white/20 bg-slate-900/70 px-4 py-3 outline-none focus:border-cyan-400"
                  name="occupation"
                  value={form.occupation}
                  onChange={onFieldChange}
                />
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm text-slate-300">Date of birth (optional)</span>
                <input
                  className="rounded-xl border border-white/20 bg-slate-900/70 px-4 py-3 outline-none focus:border-cyan-400"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={onFieldChange}
                />
              </label>
            </>
          )}

          {stepIndex === 2 && (
            <label className="grid gap-2 md:col-span-2">
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
          )}

          {stepIndex === 3 && (
            <div className="md:col-span-2 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Full name</span>
                <span className="font-semibold text-white">{form.fullName || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Country</span>
                <span className="font-semibold text-white">{form.country || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Occupation</span>
                <span className="font-semibold text-white">{form.occupation || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Date of birth</span>
                <span className="font-semibold text-white">{form.dateOfBirth || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Preferred currency</span>
                <span className="font-semibold text-white">{form.currency}</span>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-rose-300 md:col-span-2">{error}</p>}

          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30"
              onClick={handleBack}
              disabled={stepIndex === 0}
            >
              Back
            </button>
            {stepIndex < steps.length - 1 ? (
              <button
                type="button"
                className="rounded-xl bg-linear-to-r from-cyan-400 to-indigo-500 px-6 py-3 font-semibold text-slate-950 transition hover:scale-[1.01]"
                onClick={handleNext}
              >
                Continue
              </button>
            ) : (
              <button
                className="rounded-xl bg-linear-to-r from-cyan-400 to-indigo-500 px-6 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Saving profile...' : 'Save profile'}
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
};

export default ProfileSetupPage;
