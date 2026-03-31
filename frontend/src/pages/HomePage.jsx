import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { currentUser } = useAuth();

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-56 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      <header className="relative z-10 px-4 pb-5 pt-6 md:px-10">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="inline-grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-cyan-400 to-indigo-500 font-bold text-slate-950">
              W
            </span>
            <span className="text-lg font-semibold tracking-wide">WealthWise</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Link className="rounded-lg px-3 py-2 transition hover:bg-white/10" to="/">
              Home
            </Link>
            {!currentUser && (
              <Link className="rounded-lg px-3 py-2 transition hover:bg-white/10" to="/login">
                Login
              </Link>
            )}
            {!currentUser && (
              <Link
                className="rounded-lg bg-white px-3 py-2 font-semibold text-slate-900 transition hover:bg-slate-200"
                to="/signup"
              >
                Sign up
              </Link>
            )}
            {currentUser && (
              <Link
                className="rounded-lg bg-white px-3 py-2 font-semibold text-slate-900 transition hover:bg-slate-200"
                to="/dashboard"
              >
                Dashboard
              </Link>
            )}
          </div>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-4 pb-20 pt-8 md:grid-cols-2 md:px-10 md:pt-14">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-cyan-300">
            Next-Gen Personal Finance
          </p>

          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            Master money with
            <span className="bg-linear-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              {' '}
              WealthWise
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
            A modern, intelligent finance workspace to track budgets, monitor spending, and build
            long-term wealth with clarity.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {currentUser ? (
              <Link
                className="rounded-xl bg-linear-to-r from-cyan-400 to-indigo-500 px-6 py-3 font-semibold text-slate-950 transition hover:scale-[1.03]"
                to="/dashboard"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  className="rounded-xl bg-linear-to-r from-cyan-400 to-indigo-500 px-6 py-3 font-semibold text-slate-950 transition hover:scale-[1.03]"
                  to="/signup"
                >
                  Start Free
                </Link>
                <Link
                  className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold transition hover:border-white/40 hover:bg-white/10"
                  to="/login"
                >
                  I already have an account
                </Link>
              </>
            )}
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 md:max-w-lg">
            {[
              { label: 'Active users', value: '14k+' },
              { label: 'Monthly tracked', value: '$2.9M' },
              { label: 'Goal completion', value: '87%' },
              { label: 'Avg. savings lift', value: '+21%' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:bg-white/10"
              >
                <p className="text-xl font-bold text-cyan-300">{item.value}</p>
                <p className="text-sm text-slate-300">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Live finance overview</h2>
              <span className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                Updated now
              </span>
            </div>

            <div className="grid gap-3">
              {[
                { title: 'Available budget', amount: '$6,842.00', change: '+12.2%' },
                { title: 'Savings this month', amount: '$1,920.30', change: '+8.4%' },
                { title: 'Investments growth', amount: '$523.10', change: '+3.1%' },
              ].map((card) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-white/10 bg-linear-to-r from-white/5 to-transparent p-4 transition hover:border-cyan-400/40"
                >
                  <p className="text-sm text-slate-300">{card.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-2xl font-bold">{card.amount}</p>
                    <p className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">
                      {card.change}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
