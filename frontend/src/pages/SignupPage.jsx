import { SignupForm } from '../components/SignupForm';
import { Check, Sparkles } from 'lucide-react';

const SignupPage = () => {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-4 py-6">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 rounded-3xl bg-[var(--bg-surface)] p-4 md:grid-cols-2 md:p-8">
        <section className="hidden rounded-3xl bg-[var(--bg-card)] p-8 md:block">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--pill-bg)] px-4 py-2 text-sm font-semibold text-[var(--pill-text)]"><Sparkles size={14} /> WealthWise</span>
          <h1 className="mt-7 text-4xl font-black leading-tight text-[var(--text-primary)]">Start your journey to smarter finance.</h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">Join thousands of users growing their money with AI-powered clarity.</p>
          <ul className="mt-6 space-y-3 text-[var(--text-secondary)]">
            <li className="inline-flex items-center gap-3"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pill-bg)] text-[var(--pill-text)]"><Check size={14} /></span>Free to get started</li>
            <li className="inline-flex items-center gap-3"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pill-bg)] text-[var(--pill-text)]"><Check size={14} /></span>AI-powered financial insights</li>
            <li className="inline-flex items-center gap-3"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pill-bg)] text-[var(--pill-text)]"><Check size={14} /></span>Secure & private by design</li>
          </ul>
          <div className="mt-7 flex gap-3">
            <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
            <span className="h-3 w-3 rounded-full bg-[var(--pill-text)]" />
            <span className="h-3 w-3 rounded-full bg-[var(--accent-soft)]" />
          </div>
        </section>
        <section className="rounded-3xl bg-[var(--bg-card)] p-3">
          <SignupForm />
        </section>
      </div>
    </main>
  );
};

export default SignupPage;
