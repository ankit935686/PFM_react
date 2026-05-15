import ChartsSection from '../components/dashboard/ChartsSection';

const AnalyticsPage = () => {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-bold text-slate-100">Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">Deep dive into trends and category distribution.</p>
      </header>

      <article className="rounded-2xl border border-[#1F2937] bg-[#111827] p-5 text-slate-300">
        Analytics view builds on the dashboard chart APIs and can be expanded with advanced filters.
      </article>
    </section>
  );
};

export default AnalyticsPage;
