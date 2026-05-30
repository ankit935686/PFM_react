import { LoginForm } from '../components/LoginForm';
import { Sparkles } from 'lucide-react';

const LoginPage = () => {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-4 py-6">
      <div className="theme-surface mx-auto grid w-full max-w-6xl items-center gap-8 rounded-3xl bg-[var(--bg-surface)] p-4 md:grid-cols-2 md:p-8">
        <section className="theme-surface hidden rounded-3xl bg-[var(--bg-card)] p-8 md:block">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--pill-bg)] px-4 py-2 text-sm font-semibold text-[var(--pill-text)]"><Sparkles size={14} /> WealthWise</span>
          <h1 className="mt-7 text-4xl font-black leading-tight text-[var(--text-primary)]">Welcome back to smarter finance.</h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)] leading-relaxed">Continue tracking, planning, and growing your money with AI-powered clarity.</p>
          <div className="mt-8 flex gap-3">
            <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
            <span className="h-3 w-3 rounded-full bg-[var(--pill-text)]" />
            <span className="h-3 w-3 rounded-full bg-[var(--accent-soft)]" />
          </div>
        </section>
        <section className="theme-surface rounded-3xl bg-[var(--bg-card)] p-3">
          <LoginForm />
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
