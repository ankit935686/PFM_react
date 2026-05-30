import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CircleDollarSign, UserRound } from 'lucide-react';
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
      <main className="profile-setup-page">
        <section className="profile-setup-card profile-setup-loading">
          <span className="profile-setup-spinner" />
          <p>Loading profile setup...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="profile-setup-page">
      <section className="profile-setup-card">
        <div className="profile-setup-hero">
          <div className="profile-setup-title-row">
            <span className="profile-setup-icon">
              <UserRound size={18} />
            </span>
            <div>
              <p className="profile-setup-eyebrow">Profile</p>
              <h1>Profile Setup</h1>
            </div>
          </div>
          <div className="profile-setup-completion">
            <span>Completion</span>
            <strong>{completion}%</strong>
          </div>
          <p>
              Set up your personal details so the dashboard shows the right name and currency.
          </p>
        </div>

        <div className="profile-setup-progress-card">
          <div className="profile-setup-progress-copy">
            <span>Profile completion</span>
            <span>{completion}%</span>
          </div>
          <div className="profile-setup-progress-track">
            <div
              className="profile-setup-progress-fill"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <div className="profile-setup-steps">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`profile-setup-step ${index === stepIndex ? 'is-active' : ''} ${index < stepIndex ? 'is-complete' : ''}`}
            >
              <span>{index < stepIndex ? <Check size={13} /> : index + 1}</span>
              <div>
                <small>Step {index + 1}</small>
                <strong>{step.title}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="profile-setup-section-head">
          <h2>{steps[stepIndex].title}</h2>
          <p>{steps[stepIndex].subtitle}</p>
        </div>

        <form className="profile-setup-form" onSubmit={handleSubmit}>
          {stepIndex === 0 && (
            <label className="profile-setup-field profile-setup-field-wide">
              <span>Full name</span>
              <input
                name="fullName"
                value={form.fullName}
                onChange={onFieldChange}
                required
              />
            </label>
          )}

          {stepIndex === 1 && (
            <>
              <label className="profile-setup-field">
                <span>Country</span>
                <input
                  name="country"
                  value={form.country}
                  onChange={onFieldChange}
                  required
                />
              </label>

              <label className="profile-setup-field">
                <span>Occupation (optional)</span>
                <input
                  name="occupation"
                  value={form.occupation}
                  onChange={onFieldChange}
                />
              </label>

              <label className="profile-setup-field profile-setup-field-wide">
                <span>Date of birth (optional)</span>
                <input
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={onFieldChange}
                />
              </label>
            </>
          )}

          {stepIndex === 2 && (
            <label className="profile-setup-field profile-setup-field-wide">
              <span>Preferred currency</span>
              <div className="profile-setup-input-icon">
                <CircleDollarSign size={16} />
              <select
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
              </div>
            </label>
          )}

          {stepIndex === 3 && (
            <div className="profile-setup-review">
              <div>
                <span>Full name</span>
                <strong>{form.fullName || 'Not set'}</strong>
              </div>
              <div>
                <span>Country</span>
                <strong>{form.country || 'Not set'}</strong>
              </div>
              <div>
                <span>Occupation</span>
                <strong>{form.occupation || 'Not set'}</strong>
              </div>
              <div>
                <span>Date of birth</span>
                <strong>{form.dateOfBirth || 'Not set'}</strong>
              </div>
              <div>
                <span>Preferred currency</span>
                <strong>{form.currency}</strong>
              </div>
            </div>
          )}

          {error && <p className="profile-setup-error">{error}</p>}

          <div className="profile-setup-actions">
            <button
              type="button"
              className="profile-setup-button profile-setup-button-ghost"
              onClick={handleBack}
              disabled={stepIndex === 0}
            >
              Back
            </button>
            {stepIndex < steps.length - 1 ? (
              <button
                type="button"
                className="profile-setup-button profile-setup-button-primary"
                onClick={handleNext}
              >
                Continue
              </button>
            ) : (
              <button
                className="profile-setup-button profile-setup-button-primary"
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
