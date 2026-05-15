import TopNav from '../components/TopNav';
import { LoginForm } from '../components/LoginForm';

const LoginPage = () => {
  return (
    <>
      <TopNav />
      <main className="auth-container">
        <section className="card">
          <LoginForm />
        </section>
      </main>
    </>
  );
};

export default LoginPage;
