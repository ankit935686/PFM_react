import { LoginForm } from '../components/LoginForm';
import { Sparkles } from 'lucide-react';

const LoginPage = () => {
  return (
    <main className="min-h-screen bg-[#ECEBFA] px-4 py-6">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 rounded-3xl bg-[#E6E5F5] p-4 md:grid-cols-2 md:p-8">
        <section className="hidden rounded-3xl bg-[#F5F4FB] p-8 md:block">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E9E2FB] px-4 py-2 text-sm font-semibold text-[#6D28D9]"><Sparkles size={14} /> WealthWise</span>
          <h1 className="mt-7 text-4xl font-black leading-tight text-[#20104E]">Welcome back to smarter finance.</h1>
          <p className="mt-4 text-lg text-[#646A88] leading-relaxed">Continue tracking, planning, and growing your money with AI-powered clarity.</p>
          <div className="mt-8 flex gap-3">
            <span className="h-3 w-3 rounded-full bg-[#7C3AED]" />
            <span className="h-3 w-3 rounded-full bg-[#A78BFA]" />
            <span className="h-3 w-3 rounded-full bg-[#C4B5FD]" />
          </div>
        </section>
        <section className="rounded-3xl bg-[#F8F8FD] p-3">
          <LoginForm />
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
