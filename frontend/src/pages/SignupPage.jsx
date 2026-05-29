import { SignupForm } from '../components/SignupForm';
import { Check, Sparkles } from 'lucide-react';

const SignupPage = () => {
  return (
    <main className="min-h-screen bg-[#ECEBFA] px-4 py-6">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 rounded-3xl bg-[#E6E5F5] p-4 md:grid-cols-2 md:p-8">
        <section className="hidden rounded-3xl bg-[#F5F4FB] p-8 md:block">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E9E2FB] px-4 py-2 text-sm font-semibold text-[#6D28D9]"><Sparkles size={14} /> WealthWise</span>
          <h1 className="mt-7 text-4xl font-black leading-tight text-[#20104E]">Start your journey to smarter finance.</h1>
          <p className="mt-4 text-lg leading-relaxed text-[#646A88]">Join thousands of users growing their money with AI-powered clarity.</p>
          <ul className="mt-6 space-y-3 text-[#596082]">
            <li className="inline-flex items-center gap-3"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#E9E2FB] text-[#6D28D9]"><Check size={14} /></span>Free to get started</li>
            <li className="inline-flex items-center gap-3"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#E9E2FB] text-[#6D28D9]"><Check size={14} /></span>AI-powered financial insights</li>
            <li className="inline-flex items-center gap-3"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#E9E2FB] text-[#6D28D9]"><Check size={14} /></span>Secure & private by design</li>
          </ul>
          <div className="mt-7 flex gap-3">
            <span className="h-3 w-3 rounded-full bg-[#7C3AED]" />
            <span className="h-3 w-3 rounded-full bg-[#A78BFA]" />
            <span className="h-3 w-3 rounded-full bg-[#C4B5FD]" />
          </div>
        </section>
        <section className="rounded-3xl bg-[#F8F8FD] p-3">
          <SignupForm />
        </section>
      </div>
    </main>
  );
};

export default SignupPage;
