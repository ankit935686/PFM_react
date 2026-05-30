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
import ThemeToggle from '../components/ThemeToggle';
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
    <main style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAVBAR ── */}
      <header style={{ width: '100%', background: 'var(--nav-bg)', padding: '14px 32px', backdropFilter: 'blur(16px)' }}>
        <nav style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', height: 28, width: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'linear-gradient(135deg,var(--accent),var(--accent-hover))', color: '#fff' }}>
              <Sparkles size={13} />
            </span>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>WealthWise</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
            {['Home','Features','AI Advisor','Pricing','Blog','About'].map(l => (
              <a
                key={l}
                href={l === 'Features' ? '#features' : l === 'AI Advisor' ? '#advisor' : '#'}
                className="ww-nav-link"
                style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
              >
                {l}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThemeToggle />
            {!currentUser && (
              <>
                <Link to="/login" className="ww-nav-link" style={{ padding: '8px 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>Login</Link>
                <Link to="/signup" className="ww-btn-accent" style={{ borderRadius: 999, padding: '8px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  Get Started Free
                </Link>
              </>
            )}
            {currentUser && (
              <Link to="/dashboard" className="ww-btn-accent" style={{ borderRadius: 999, padding: '8px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, border: '1px solid var(--accent-border)', background: 'var(--pill-bg)', padding: '5px 12px', fontSize: 12, fontWeight: 600, color: 'var(--pill-text)' }}>
            <Sparkles size={11} /> AI-Powered Personal Finance
          </span>
          <h1 style={{ marginTop: 20, fontSize: 56, fontWeight: 900, lineHeight: 1.07, letterSpacing: '-1.5px', color: 'var(--text-primary)' }}>
            <span style={{ background: 'linear-gradient(135deg, var(--accent), #60A5FA)', WebkitBackgroundClip: 'text', color: 'transparent', display: 'inline-block' }}>
              Smarter Money.
            </span>
            <br />Better Future.
          </h1>
          <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: 440 }}>
            WealthWise helps you track, analyze, and grow your money with AI insights and personalized financial guidance.
          </p>

          <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {currentUser ? (
              <Link to="/dashboard" className="ww-btn-accent" style={{ borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Open Dashboard</Link>
            ) : (
              <>
                <Link to="/signup" className="ww-btn-accent" style={{ borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Get Started Free</Link>
                <Link to="/login" className="ww-btn-ghost" style={{ borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Explore Features</Link>
              </>
            )}
          </div>

          <div style={{ marginTop: 28, display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
            {['AI Financial Advisor', 'Smart Analytics', '100% Secure'].map(t => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CircleCheck size={14} style={{ color: 'var(--accent)' }} /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right – Dashboard Mockup */}
        <div className="theme-surface" style={{ borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          {/* Top bar */}
          <div className="theme-surface" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', padding: '12px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-flex', height: 20, width: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: 'var(--accent)', color: '#fff' }}>
                <Sparkles size={10} />
              </span>
              <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>WealthWise</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Dashboard</span>
            <div style={{ display: 'flex', gap: 5 }}>
              <span style={{ height: 10, width: 10, borderRadius: '50%', background: '#F87171', display: 'inline-block' }} />
              <span style={{ height: 10, width: 10, borderRadius: '50%', background: '#FCD34D', display: 'inline-block' }} />
              <span style={{ height: 10, width: 10, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
            </div>
          </div>

          <div style={{ display: 'flex' }}>
            {/* Sidebar */}
            <div className="theme-surface" style={{ width: 130, borderRight: '1px solid var(--border)', padding: '12px 8px', flexShrink: 0 }}>
              {['Dashboard','Transactions','Budgets','Goals','Investments','Reports','Subscriptions','AI Advisor','Settings'].map(item => (
                <div key={item} style={{ borderRadius: 6, padding: '6px 10px', fontSize: 10, fontWeight: 500, marginBottom: 2, background: item === 'Dashboard' ? 'var(--accent-soft)' : 'transparent', color: item === 'Dashboard' ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {item}
                </div>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: '16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Hello, Alex 👋</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>Here's your financial overview.</p>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Total Balance', val: '$8,542.50', sub: '+12.5% this month', subColor: '#10B981' },
                  { label: 'Income', val: '$5,820.00', sub: '+6.2%', subColor: '#10B981' },
                  { label: 'Expenses', val: '$3,256.80', sub: '−1.4%', subColor: '#EF4444' },
                ].map(s => (
                  <div key={s.label} className="theme-surface" style={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '10px' }}>
                    <p style={{ fontSize: 9, color: 'var(--text-muted)' }}>{s.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: '3px 0 2px' }}>{s.val}</p>
                    <p style={{ fontSize: 9, fontWeight: 600, color: s.subColor }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Bottom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {/* Spending */}
                <div className="theme-surface" style={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '10px' }}>
                  <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Spending Overview</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                      <svg viewBox="0 0 56 56" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        <circle cx="28" cy="28" r="22" fill="none" stroke="#E9E7F8" strokeWidth="8" />
                        <circle cx="28" cy="28" r="22" fill="none" stroke="#7C3AED" strokeWidth="8" strokeDasharray="55 83" />
                        <circle cx="28" cy="28" r="22" fill="none" stroke="#A78BFA" strokeWidth="8" strokeDasharray="25 113" strokeDashoffset="-55" />
                        <circle cx="28" cy="28" r="22" fill="none" stroke="#C4B5FD" strokeWidth="8" strokeDasharray="15 123" strokeDashoffset="-80" />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-primary)' }}>$3,256</p>
                        <p style={{ fontSize: 7, color: 'var(--text-muted)' }}>Total</p>
                      </div>
                    </div>
                    <div style={{ fontSize: 8, color: 'var(--text-secondary)', lineHeight: 1.9 }}>
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
                <div className="theme-surface" style={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '10px' }}>
                  <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>AI Financial Health Score</p>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <p style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>78</p>
                      <span style={{ display: 'inline-block', borderRadius: 999, background: '#ECFDF3', padding: '2px 8px', fontSize: 8, fontWeight: 600, color: '#047857', marginTop: 3 }}>Good</span>
                    </div>
                    <p style={{ fontSize: 8, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 2 }}>You're doing great! Keep maintaining your habits</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px 64px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="theme-surface" style={{ borderRadius: 24, border: '1px solid var(--border)', background: 'var(--bg-surface)', padding: 40, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', gap: 6, borderRadius: 999, border: '1px solid var(--accent-border)', background: 'var(--pill-bg)', padding: '5px 12px', fontSize: 12, fontWeight: 600, color: 'var(--pill-text)' }}>
                <Sparkles size={11} /> Why WealthWise?
              </span>
              <h2 style={{ marginTop: 16, fontSize: 32, fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
                Everything You Need<br />To Manage Your Money
              </h2>
              <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                Powerful features designed to help you take control of your finances and build a better future.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {features.map(({ icon: Icon, title, desc }) => (
                <article key={title} className="theme-surface ww-feature-card" style={{ borderRadius: 16, border: '1px solid var(--border)', background: 'var(--bg-card)', padding: 20 }}>
                  <span style={{ display: 'inline-flex', height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                    <Icon size={18} />
                  </span>
                  <h3 style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
                  <p style={{ marginTop: 6, fontSize: 11, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI ADVISOR ── */}
      <section id="advisor" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px 64px' }}>
        <div className="theme-surface" style={{ borderRadius: 24, border: '1px solid var(--border)', background: 'var(--bg-base)', padding: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, border: '1px solid var(--accent-border)', background: 'var(--pill-bg)', padding: '5px 12px', fontSize: 12, fontWeight: 600, color: 'var(--pill-text)' }}>
              <Sparkles size={11} /> AI-Powered Insights
            </span>
            <h2 style={{ marginTop: 16, fontSize: 36, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
              Your Personal<br />AI Financial Advisor
            </h2>
            <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              WealthWise analyzes your financial behavior and gives smart, actionable insights to help you save more, spend wisely, and reach your goals faster.
            </p>
            <ul style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Real-time AI insights','Risk detection & alerts','Smart saving recommendations','Behavioral spending analysis'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <CircleCheck size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} /> {item}
                </li>
              ))}
            </ul>
            <Link to={currentUser ? '/copilot' : '/signup'} className="ww-btn-accent" style={{ marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Try AI Advisor Now
            </Link>
          </div>

          {/* Chat mockup */}
          <div className="theme-surface" style={{ borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-surface)', padding: 20, boxShadow: 'var(--shadow-card)' }}>
            <div className="theme-surface" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-flex', height: 24, width: 24, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--accent)', color: '#fff' }}>
                  <BrainCircuit size={12} />
                </span>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>AI Financial Advisor</p>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>✕</span>
            </div>

            <div className="theme-surface" style={{ borderRadius: 12, background: 'var(--bg-elevated)', padding: '10px 14px', marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Hi Alex! 👋</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Here's what I found about your finances this month.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {advisorMessages.map((msg, i) => (
                <div key={i} className="theme-surface" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '10px 12px' }}>
                  <span style={{ display: 'inline-flex', height: 28, width: 28, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: msg.bg, fontSize: 13, flexShrink: 0 }}>
                    {msg.icon}
                  </span>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{msg.main}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{msg.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="theme-surface" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '8px 12px' }}>
              <input type="text" placeholder="Ask me anything about your finances..." readOnly className="ww-input" style={{ flex: 1, fontSize: 11, border: 'none', outline: 'none', background: 'transparent' }} />
              <button className="ww-btn-accent" style={{ display: 'inline-flex', height: 24, width: 24, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 }}>
                <Send size={11} color="#fff" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px 64px' }}>
        <div className="theme-surface" style={{ borderRadius: 24, border: '1px solid var(--border)', background: 'var(--bg-surface)', padding: 40 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, border: '1px solid var(--accent-border)', background: 'var(--pill-bg)', padding: '5px 12px', fontSize: 12, fontWeight: 600, color: 'var(--pill-text)' }}>
              <Sparkles size={11} /> How It Works
            </span>
            <h2 style={{ marginTop: 16, fontSize: 36, fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
              Simple Steps To Financial Freedom
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 24 }}>
            {steps.map((step, i) => (
              <div key={step.no} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', top: 14, right: -12, zIndex: 10 }}>
                    <ArrowRight size={16} color="var(--border)" />
                  </div>
                )}
                <span style={{ display: 'inline-flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--accent)', fontSize: 13, fontWeight: 700, color: '#fff', boxShadow: '0 0 0 4px var(--accent-soft)' }}>
                  {step.no}
                </span>
                <p style={{ marginTop: 4, fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Step {step.no}</p>
                <h3 style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{step.title}</h3>
                <p style={{ marginTop: 6, fontSize: 11, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px 64px' }}>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, background: 'var(--cta-bg)', padding: 48, boxShadow: 'var(--shadow)' }}>
          <div style={{ position: 'absolute', right: 0, top: 0, width: '30%', height: '100%', background: 'rgba(139,92,246,0.15)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
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
              <Link to={currentUser ? '/dashboard' : '/signup'} className="ww-btn-white" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                {currentUser ? 'Open Dashboard' : 'Get Started Free'} <ArrowRight size={14} />
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex' }}>
                  {[['#F97316','A'],['#3B82F6','B'],['#10B981','C']].map(([bg, l], i) => (
                    <span key={i} style={{ display: 'inline-flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '2px solid var(--accent)', background: bg, fontSize: 12, fontWeight: 700, color: '#fff', marginLeft: i > 0 ? -8 : 0 }}>
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
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)', padding: '48px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr', gap: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-flex', height: 28, width: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'linear-gradient(135deg,var(--accent),var(--accent-hover))', color: '#fff' }}>
                  <Sparkles size={13} />
                </span>
                <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>WealthWise</span>
              </div>
              <p style={{ marginTop: 12, fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                AI-powered personal finance manager that helps you save more, spend wisely, and grow your wealth.
              </p>
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="ww-social-btn" style={{ display: 'inline-flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', textDecoration: 'none' }}>
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>

            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{section}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {links.map(link => (
                    <li key={link}><a href="#" className="ww-footer-link" style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none' }}>{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Stay Updated</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>Get the latest tips, insights, and product updates.</p>
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', display: 'flex', background: 'var(--bg-elevated)' }}>
                <input type="email" placeholder="Enter your email" className="ww-input" style={{ flex: 1, padding: '8px 12px', fontSize: 12, border: 'none', outline: 'none', background: 'transparent' }} />
              </div>
              <button className="ww-btn-accent" style={{ marginTop: 8, width: '100%', borderRadius: 8, padding: '9px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                Subscribe
              </button>
            </div>
          </div>

          <div style={{ marginTop: 40, borderTop: '1px solid var(--border)', paddingTop: 20, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
            © 2024 WealthWise. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
};

export default HomePage;  
