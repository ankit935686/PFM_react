import TopNav from '../components/TopNav';
import { SignupForm } from '../components/SignupForm';

const SignupPage = () => {
  return (
    <>
      <TopNav />
      <main className="auth-container">
        <section className="card">
          <SignupForm />
        </section>
      </main>
    </>
  );
};

export default SignupPage;
