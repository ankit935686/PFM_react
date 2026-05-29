import { Link } from 'react-router-dom';
import {
  Bot,
  BrainCircuit,
  ChartNoAxesCombined,
  CircleCheck,
  Gem,
  Goal,
  ShieldCheck,
  Sparkles,
  WalletCards,
  ArrowRight,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: Bot, title: 'AI Financial Advisor', desc: 'Get personalized insights, smart recommendations, and answers to all your money questions.' },
  { icon: ShieldCheck, title: 'Financial Health Score', desc: 'Know how healthy your finances are with an AI-powered score based on key metrics.' },
  { icon: WalletCards, title: 'Smart Budgeting', desc: "Create budgets, track progress, and get alerts when you're about to overspend." },
  { icon: ChartNoAxesCombined, title: 'Spending Analytics', desc: 'Beautiful charts and insights to understand your spending patterns better.' },
  { icon: Goal, title: 'Goal Tracking', desc: 'Set financial goals and let AI help you achieve them faster and smarter.' },
  { icon: Gem, title: 'Subscription Tracker', desc: 'Track all your subscriptions and detect where you can save more.' },
];

const steps = [
  { no: '1', title: 'Connect & Setup', desc: 'Create your account and set up your income, expenses, and goals in minutes.' },
  { no: '2', title: 'Track & Analyze', desc: 'WealthWise tracks your transactions and analyzes your spending patterns using AI.' },
  { no: '3', title: 'Get AI Insights', desc: 'Receive personalized insights, recommendations, and alerts that matter.' },
  { no: '4', title: 'Grow & Achieve', desc: 'Improve your habits, save more, and achieve your financial goals faster.' },
];

const advisorMessages = [
  { icon: '📈', bg: '#F3EEFF', iconColor: '#7C3AED', main: 'Your spending on Food increased by 24%.', sub: 'Try cooking at home more to save up to $120/month.' },
  { icon: '💳', bg: '#FEF2F2', iconColor: '#EF4444', main: 'You can save $320/month', sub: 'Reduce entertainment & subscriptions a little.' },
  { icon: '📊', bg: '#EFF6FF', iconColor: '#3B82F6', main: 'Your savings ratio is 16%.', sub: 'Good job! Aim for at least 20% for a healthier future.' },
  { icon: '🔔', bg: '#FFF7ED', iconColor: '#F97316', main: 'You have 3 active subscriptions', sub: 'You could save $45/month by reviewing them.' },
];

const footerLinks = {
  Product: ['Features', 'AI Advisor', 'Pricing', 'Updates', 'Roadmap'],
  Company: ['About Us', 'Blog', 'Careers', 'Contact Us', 'Privacy Policy'],
  Support: ['Help Center', 'Guides', 'FAQs', 'Community', 'Contact Support'],
};

const HomePage = () => {
  const { currentUser } = useAuth();

  return (
    <main style={{ minHeight: '100vh', background: '#F4F4FC', color: '#1E1E2D', fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAVBAR ── */}
      <header style={{ width: '100%', background: '#F4F4FC', padding: '14px 32px' }}>
        <nav style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', height: 28, width: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#8B5CF6)', color: '#fff' }}>
              <Sparkles size={13} />
            </span>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#1E1E2D' }}>WealthWise</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 14, fontWeight: 500, color: '#5F6582' }}>
            {['Home','Features','AI Advisor','Pricing','Blog','About'].map(l => (
              <a key={l} href={l === 'Features' ? '#features' : l === 'AI Advisor' ? '#advisor' : '#'} style={{ color: '#5F6582', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = '#7C3AED'} onMouseLeave={e => e.target.style.color = '#5F6582'}>
                {l}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!currentUser && (
              <>
                <Link to="/login" style={{ padding: '8px 16px', fontSize: 14, fontWeight: 600, color: '#1E1E2D', textDecoration: 'none' }}>Login</Link>
                <Link to="/signup" style={{ borderRadius: 999, background: '#7C3AED', padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
                  Get Started Free
                </Link>
              </>
            )}
            {currentUser && (
              <Link to="/dashboard" style={{ borderRadius: 999, background: '#7C3AED', padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
                Open Dashboard
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 32px 64px', display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 48, alignItems: 'center' }}>
        {/* Left */}
        <div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, border: '1px solid #E0D9FF', background: '#fff', padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#7C3AED' }}>
            <Sparkles size={11} /> AI-Powered Personal Finance
          </span>
          <h1 style={{ marginTop: 20, fontSize: 56, fontWeight: 900, lineHeight: 1.07, letterSpacing: '-1.5px', color: '#1A0A3C' }}>
            Smarter Money.<br />Better Future.
          </h1>
          <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.7, color: '#6B7280', maxWidth: 440 }}>
            WealthWise helps you track, analyze, and grow your money with AI insights and personalized financial guidance.
          </p>

          <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {currentUser ? (
              <Link to="/dashboard" style={{ borderRadius: 10, background: '#7C3AED', padding: '12px 24px', fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>Open Dashboard</Link>
            ) : (
              <>
                <Link to="/signup" style={{ borderRadius: 10, background: '#7C3AED', padding: '12px 24px', fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>Get Started Free</Link>
                <Link to="/login" style={{ borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', padding: '12px 24px', fontSize: 14, fontWeight: 600, color: '#374151', textDecoration: 'none' }}>Explore Features</Link>
              </>
            )}
          </div>

          <div style={{ marginTop: 28, display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13, color: '#6B7280' }}>
            {['AI Financial Advisor', 'Smart Analytics', '100% Secure'].map(t => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CircleCheck size={14} style={{ color: '#7C3AED' }} /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right – Dashboard Mockup */}
        <div style={{ borderRadius: 20, border: '1px solid #E5E7EB', background: '#fff', boxShadow: '0 24px 64px -20px rgba(124,58,237,0.15)', overflow: 'hidden' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', padding: '12px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-flex', height: 20, width: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: '#7C3AED', color: '#fff' }}>
                <Sparkles size={10} />
              </span>
              <span style={{ fontWeight: 700, fontSize: 12 }}>WealthWise</span>
            </div>
            <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Dashboard</span>
            <div style={{ display: 'flex', gap: 5 }}>
              <span style={{ height: 10, width: 10, borderRadius: '50%', background: '#F87171', display: 'inline-block' }} />
              <span style={{ height: 10, width: 10, borderRadius: '50%', background: '#FCD34D', display: 'inline-block' }} />
              <span style={{ height: 10, width: 10, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
            </div>
          </div>

          <div style={{ display: 'flex' }}>
            {/* Sidebar */}
            <div style={{ width: 130, borderRight: '1px solid #F3F4F6', padding: '12px 8px', flexShrink: 0 }}>
              {['Dashboard','Transactions','Budgets','Goals','Investments','Reports','Subscriptions','AI Advisor','Settings'].map(item => (
                <div key={item} style={{ borderRadius: 6, padding: '6px 10px', fontSize: 10, fontWeight: 500, marginBottom: 2, background: item === 'Dashboard' ? '#F3EEFF' : 'transparent', color: item === 'Dashboard' ? '#7C3AED' : '#9CA3AF' }}>
                  {item}
                </div>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: '16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#1E1E2D' }}>Hello, Alex 👋</p>
              <p style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 12 }}>Here's your financial overview.</p>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Total Balance', val: '$8,542.50', sub: '+12.5% this month', subColor: '#10B981' },
                  { label: 'Income', val: '$5,820.00', sub: '+6.2%', subColor: '#10B981' },
                  { label: 'Expenses', val: '$3,256.80', sub: '−1.4%', subColor: '#EF4444' },
                ].map(s => (
                  <div key={s.label} style={{ borderRadius: 10, border: '1px solid #F3F4F6', background: '#FAFAFA', padding: '10px' }}>
                    <p style={{ fontSize: 9, color: '#9CA3AF' }}>{s.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1A0A3C', margin: '3px 0 2px' }}>{s.val}</p>
                    <p style={{ fontSize: 9, fontWeight: 600, color: s.subColor }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Bottom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {/* Spending */}
                <div style={{ borderRadius: 10, border: '1px solid #F3F4F6', background: '#FAFAFA', padding: '10px' }}>
                  <p style={{ fontSize: 9, fontWeight: 600, color: '#1E1E2D', marginBottom: 8 }}>Spending Overview</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                      <svg viewBox="0 0 56 56" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        <circle cx="28" cy="28" r="22" fill="none" stroke="#E9E7F8" strokeWidth="8" />
                        <circle cx="28" cy="28" r="22" fill="none" stroke="#7C3AED" strokeWidth="8" strokeDasharray="55 83" />
                        <circle cx="28" cy="28" r="22" fill="none" stroke="#A78BFA" strokeWidth="8" strokeDasharray="25 113" strokeDashoffset="-55" />
                        <circle cx="28" cy="28" r="22" fill="none" stroke="#C4B5FD" strokeWidth="8" strokeDasharray="15 123" strokeDashoffset="-80" />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ fontSize: 8, fontWeight: 700, color: '#1E1E2D' }}>$3,256</p>
                        <p style={{ fontSize: 7, color: '#9CA3AF' }}>Total</p>
                      </div>
                    </div>
                    <div style={{ fontSize: 8, color: '#6B7280', lineHeight: 1.9 }}>
                      {[['#7C3AED','Food & Dining 40%'],['#A78BFA','Shopping 20%'],['#C4B5FD','Transport 15%'],['#DDD6FE','Bills & Utilities 15%'],['#EDE9FE','Entertainment 10%']].map(([c,t]) => (
                        <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ height: 6, width: 6, borderRadius: '50%', background: c, display: 'inline-block', flexShrink: 0 }} />
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Health score */}
                <div style={{ borderRadius: 10, border: '1px solid #F3F4F6', background: '#FAFAFA', padding: '10px' }}>
                  <p style={{ fontSize: 9, fontWeight: 600, color: '#1E1E2D', marginBottom: 6 }}>AI Financial Health Score</p>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <p style={{ fontSize: 32, fontWeight: 900, color: '#7C3AED', lineHeight: 1 }}>78</p>
                      <span style={{ display: 'inline-block', borderRadius: 999, background: '#ECFDF3', padding: '2px 8px', fontSize: 8, fontWeight: 600, color: '#047857', marginTop: 3 }}>Good</span>
                    </div>
                    <p style={{ fontSize: 8, color: '#9CA3AF', lineHeight: 1.5, marginTop: 2 }}>You're doing great! Keep maintaining your habits</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px 64px' }}>
        <div style={{ borderRadius: 24, border: '1px solid #E5E7EB', background: '#fff', padding: 40, boxShadow: '0 8px 40px -20px rgba(124,58,237,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', gap: 6, borderRadius: 999, border: '1px solid #E0D9FF', background: '#F3EEFF', padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#7C3AED' }}>
                <Sparkles size={11} /> Why WealthWise?
              </span>
              <h2 style={{ marginTop: 16, fontSize: 32, fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.5px', color: '#1A0A3C' }}>
                Everything You Need<br />To Manage Your Money
              </h2>
              <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7, color: '#6B7280' }}>
                Powerful features designed to help you take control of your finances and build a better future.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {features.map(({ icon: Icon, title, desc }) => (
                <article key={title} style={{ borderRadius: 16, border: '1px solid #F3F4F6', background: '#FAFAFA', padding: 20 }}>
                  <span style={{ display: 'inline-flex', height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: '#F3EEFF', color: '#7C3AED' }}>
                    <Icon size={18} />
                  </span>
                  <h3 style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: '#1E1E2D' }}>{title}</h3>
                  <p style={{ marginTop: 6, fontSize: 11, lineHeight: 1.6, color: '#6B7280' }}>{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI ADVISOR ── */}
      <section id="advisor" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px 64px' }}>
        <div style={{ borderRadius: 24, border: '1px solid #E5E7EB', background: '#F8F5FF', padding: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, border: '1px solid #E0D9FF', background: '#fff', padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#7C3AED' }}>
              <Sparkles size={11} /> AI-Powered Insights
            </span>
            <h2 style={{ marginTop: 16, fontSize: 36, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.5px', color: '#1A0A3C' }}>
              Your Personal<br />AI Financial Advisor
            </h2>
            <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7, color: '#6B7280' }}>
              WealthWise analyzes your financial behavior and gives smart, actionable insights to help you save more, spend wisely, and reach your goals faster.
            </p>
            <ul style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Real-time AI insights','Risk detection & alerts','Smart saving recommendations','Behavioral spending analysis'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4F5574' }}>
                  <CircleCheck size={15} style={{ color: '#7C3AED', flexShrink: 0 }} /> {item}
                </li>
              ))}
            </ul>
            <Link to={currentUser ? '/copilot' : '/signup'} style={{ marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 12, background: '#7C3AED', padding: '12px 24px', fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
              Try AI Advisor Now
            </Link>
          </div>

          {/* Chat mockup */}
          <div style={{ borderRadius: 20, border: '1px solid #E5E7EB', background: '#fff', padding: 20, boxShadow: '0 16px 40px -20px rgba(124,58,237,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-flex', height: 24, width: 24, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#7C3AED', color: '#fff' }}>
                  <BrainCircuit size={12} />
                </span>
                <p style={{ fontSize: 13, fontWeight: 700 }}>AI Financial Advisor</p>
              </div>
              <span style={{ fontSize: 13, color: '#9CA3AF', cursor: 'pointer' }}>✕</span>
            </div>

            <div style={{ borderRadius: 12, background: '#F3EEFF', padding: '10px 14px', marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#4C1D95' }}>Hi Alex! 👋</p>
              <p style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Here's what I found about your finances this month.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {advisorMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 12, border: '1px solid #F3F4F6', background: '#FAFAFA', padding: '10px 12px' }}>
                  <span style={{ display: 'inline-flex', height: 28, width: 28, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: msg.bg, fontSize: 13, flexShrink: 0 }}>
                    {msg.icon}
                  </span>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#1E1E2D' }}>{msg.main}</p>
                    <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{msg.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, border: '1px solid #E5E7EB', padding: '8px 12px' }}>
              <input type="text" placeholder="Ask me anything about your finances..." readOnly style={{ flex: 1, fontSize: 11, color: '#1E1E2D', border: 'none', outline: 'none', background: 'transparent' }} />
              <button style={{ display: 'inline-flex', height: 24, width: 24, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#7C3AED', border: 'none', cursor: 'pointer' }}>
                <Send size={11} color="#fff" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px 64px' }}>
        <div style={{ borderRadius: 24, border: '1px solid #E5E7EB', background: '#fff', padding: 40 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, border: '1px solid #E0D9FF', background: '#F3EEFF', padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#7C3AED' }}>
              <Sparkles size={11} /> How It Works
            </span>
            <h2 style={{ marginTop: 16, fontSize: 36, fontWeight: 900, letterSpacing: '-0.5px', color: '#1A0A3C' }}>
              Simple Steps To Financial Freedom
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 24 }}>
            {steps.map((step, i) => (
              <div key={step.no} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', top: 14, right: -12, zIndex: 10 }}>
                    <ArrowRight size={16} color="#C4B5FD" />
                  </div>
                )}
                <span style={{ display: 'inline-flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#7C3AED', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  {step.no}
                </span>
                <p style={{ marginTop: 4, fontSize: 10, color: '#9CA3AF', fontWeight: 500 }}>Step {step.no}</p>
                <h3 style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: '#1E1E2D' }}>{step.title}</h3>
                <p style={{ marginTop: 6, fontSize: 11, lineHeight: 1.6, color: '#6B7280' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px 64px' }}>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, background: '#7C3AED', padding: 48, boxShadow: '0 20px 60px -20px rgba(124,58,237,0.6)' }}>
          <div style={{ position: 'absolute', right: 0, top: 0, width: '30%', height: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                Ready To Take Control Of Your Finances?
              </h2>
              <p style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                Join thousands of smart users who are building a better financial future with WealthWise.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
              <Link to={currentUser ? '/dashboard' : '/signup'} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 12, background: '#fff', padding: '12px 24px', fontSize: 14, fontWeight: 700, color: '#7C3AED', textDecoration: 'none' }}>
                {currentUser ? 'Open Dashboard' : 'Get Started Free'} <ArrowRight size={14} />
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex' }}>
                  {[['#F97316','A'],['#3B82F6','B'],['#10B981','C']].map(([bg, l], i) => (
                    <span key={i} style={{ display: 'inline-flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '2px solid #7C3AED', background: bg, fontSize: 12, fontWeight: 700, color: '#fff', marginLeft: i > 0 ? -8 : 0 }}>
                      {l}
                    </span>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1 }}>4.9/5</p>
                  <p style={{ fontSize: 14, color: '#FCD34D' }}>★★★★★ <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>4,919</span></p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Trusted by 10,000+ users</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #E5E7EB', background: '#fff', padding: '48px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr', gap: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-flex', height: 28, width: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#8B5CF6)', color: '#fff' }}>
                  <Sparkles size={13} />
                </span>
                <span style={{ fontWeight: 800, fontSize: 15 }}>WealthWise</span>
              </div>
              <p style={{ marginTop: 12, fontSize: 12, lineHeight: 1.7, color: '#6B7280' }}>
                AI-powered personal finance manager that helps you save more, spend wisely, and grow your wealth.
              </p>
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" style={{ display: 'inline-flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '1px solid #E5E7EB', color: '#9CA3AF', textDecoration: 'none' }}>
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>

            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1E1E2D', marginBottom: 16 }}>{section}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {links.map(link => (
                    <li key={link}><a href="#" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none' }}>{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1E1E2D', marginBottom: 6 }}>Stay Updated</p>
              <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>Get the latest tips, insights, and product updates.</p>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
                <input type="email" placeholder="Enter your email" style={{ flex: 1, padding: '8px 12px', fontSize: 12, border: 'none', outline: 'none' }} />
              </div>
              <button style={{ marginTop: 8, width: '100%', borderRadius: 8, background: '#7C3AED', padding: '9px', fontSize: 12, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>
                Subscribe
              </button>
            </div>
          </div>

          <div style={{ marginTop: 40, borderTop: '1px solid #F3F4F6', paddingTop: 20, textAlign: 'center', fontSize: 11, color: '#9CA3AF' }}>
            © 2024 WealthWise. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
};

export default HomePage;
