import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNav from '../components/TopNav';
import { getFirebaseAuthErrorMessage } from '../lib/firebaseAuthErrors';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (authError) {
      setError(getFirebaseAuthErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopNav />
      <main className="auth-container">
        <section className="card">
          <h1>Login</h1>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error && <p className="error-text">{error}</p>}

            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p>
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </section>
      </main>
    </>
  );
};

export default LoginPage;
