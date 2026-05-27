import { motion } from 'framer-motion';
import { AlertTriangle, BriefcaseBusiness, CheckCircle2, Compass, HeartPulse, Lightbulb, ShieldAlert, Sparkles } from 'lucide-react';

const MotionSection = motion.section;

const sectionsConfig = [
  { key: 'executiveSummary', title: 'Executive Summary', icon: Sparkles, type: 'text' },
  { key: 'insights', title: 'Financial Insights', icon: Lightbulb, type: 'list' },
  { key: 'recommendations', title: 'Recommendations', icon: CheckCircle2, type: 'list' },
  { key: 'risks', title: 'Risks', icon: ShieldAlert, type: 'list' },
  { key: 'opportunities', title: 'Opportunities', icon: Compass, type: 'list' },
  { key: 'portfolioAnalysis', title: 'Portfolio Analysis', icon: BriefcaseBusiness, type: 'list' },
  { key: 'financialHealth', title: 'Financial Health', icon: HeartPulse, type: 'list' },
  { key: 'warnings', title: 'Warnings', icon: AlertTriangle, type: 'list' },
  { key: 'actionItems', title: 'Action Items', icon: CheckCircle2, type: 'list' },
  { key: 'educationalExplanations', title: 'Learn', icon: Lightbulb, type: 'list' },
];

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(String(value || '').trim());
};

const renderSection = (section, value) => {
  if (section.type === 'text') {
    return <p className="text-sm leading-relaxed text-[#374151]">{value}</p>;
  }
  return (
    <ul className="space-y-1.5">
      {value.map((item, index) => (
        <li key={`${section.key}-${index}`} className="rounded-lg border border-[#E8EAF6] bg-[#F8F9FF] px-3 py-2 text-sm text-[#374151]">
          {typeof item === 'string' ? item : JSON.stringify(item)}
        </li>
      ))}
    </ul>
  );
};

const StructuredResponse = ({ response, contextMode }) => {
  if (!response) return null;

  const activeSections = sectionsConfig.filter((section) => hasValue(response[section.key]));
  const compactMode = contextMode === 'general_ai_mode' && activeSections.length <= 2;

  return (
    <MotionSection
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`grid gap-3 ${compactMode ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'}`}
    >
      {activeSections.map((section) => {
        const Icon = section.icon;
        return (
          <article key={section.key} className="rounded-2xl border border-[#E8EAF6] bg-white p-4 shadow-[0_8px_26px_-20px_rgba(30,30,45,0.22)]">
            <header className="mb-3 flex items-center gap-2 text-[#1E1E2D]">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#D9DCFF] bg-[#EEF0FF] text-[#5B5BD6]">
                <Icon size={14} />
              </span>
              <h3 className="text-sm font-semibold">{section.title}</h3>
            </header>
            {renderSection(section, response[section.key])}
          </article>
        );
      })}
    </MotionSection>
  );
};

export default StructuredResponse;
