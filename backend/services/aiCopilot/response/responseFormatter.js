const stripCodeFence = (input) => input.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

const stripToJsonObject = (input) => {
  const firstBrace = input.indexOf('{');
  const lastBrace = input.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return input.slice(firstBrace, lastBrace + 1);
  }
  return input;
};

const repairJson = (input) => {
  const withoutTrailingCommas = input.replace(/,\s*([}\]])/g, '$1');
  return withoutTrailingCommas;
};

const parseJson = (raw) => {
  const input = String(raw || '').trim();
  if (!input) return null;
  const attempts = [
    input,
    stripCodeFence(input),
    stripToJsonObject(stripCodeFence(input)),
    repairJson(stripToJsonObject(stripCodeFence(input))),
  ];

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch (_error) {
      continue;
    }
  }

  return null;
};

const toArray = (v) => (Array.isArray(v) ? v : []);
const asText = (v) => String(v || '').trim();

const extractTextField = (raw) => {
  const input = String(raw || '');
  const match = input.match(/"text"\s*:\s*"([\s\S]*?)"\s*(,|})/i);
  if (!match) return '';
  return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
};

const fallbackResponse = (text) => ({
  executiveSummary: '',
  insights: [],
  recommendations: [],
  forecasts: [],
  risks: [],
  opportunities: [],
  portfolioAnalysis: [],
  marketAnalysis: [],
  financialHealth: [],
  projections: [],
  educationalExplanations: [],
  actionItems: [],
  warnings: [],
  text: String(text || 'I am here to help with your financial questions.'),
  renderMeta: {
    showPortfolioCards: false,
    showSavingsProjection: false,
    showMarketInsights: false,
    showBudgetWarnings: false,
  },
});

const formatCopilotResponse = ({ rawContent, context, classification, provider }) => {
  const parsed = parseJson(rawContent);
  if (!parsed) {
    const extractedText = extractTextField(rawContent);
    return {
      ...fallbackResponse(extractedText || rawContent),
      meta: {
        provider,
        intent: classification.intent,
        contextMode: classification.contextMode,
      },
    };
  }

  const renderMeta = parsed.renderMeta || {};
  const summary = asText(parsed.executiveSummary);
  const plainText = asText(parsed.text);
  const firstInsight = asText((toArray(parsed.insights)[0] || ''));
  const fallbackText = plainText || summary || firstInsight || 'I prepared your financial copilot response.';

  return {
    executiveSummary: summary,
    insights: toArray(parsed.insights),
    recommendations: toArray(parsed.recommendations),
    forecasts: toArray(parsed.forecasts),
    risks: toArray(parsed.risks),
    opportunities: toArray(parsed.opportunities),
    portfolioAnalysis: toArray(parsed.portfolioAnalysis),
    marketAnalysis: toArray(parsed.marketAnalysis),
    financialHealth: toArray(parsed.financialHealth),
    projections: toArray(parsed.projections),
    educationalExplanations: toArray(parsed.educationalExplanations),
    actionItems: toArray(parsed.actionItems),
    warnings: toArray(parsed.warnings),
    text: fallbackText,
    renderMeta: {
      showPortfolioCards: Boolean(renderMeta.showPortfolioCards || context?.analytics?.portfolio),
      showSavingsProjection: Boolean(renderMeta.showSavingsProjection || context?.analytics?.savings),
      showMarketInsights: Boolean(renderMeta.showMarketInsights || context?.marketData?.used),
      showBudgetWarnings: Boolean(renderMeta.showBudgetWarnings || (context?.analytics?.budgets?.utilizationPercent || 0) > 85),
    },
    meta: {
      provider,
      intent: classification.intent,
      contextMode: classification.contextMode,
    },
  };
};

module.exports = {
  formatCopilotResponse,
  fallbackResponse,
};
