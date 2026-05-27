const parseJson = (raw) => {
  const input = String(raw || '').trim();
  try {
    return JSON.parse(input);
  } catch (_error) {
    const deFenced = input.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    try {
      return JSON.parse(deFenced);
    } catch (_error2) {
      const firstBrace = deFenced.indexOf('{');
      const lastBrace = deFenced.lastIndexOf('}');
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const sliced = deFenced.slice(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(sliced);
        } catch (_error3) {
          return null;
        }
      }
      return null;
    }
  }
};

const toArray = (v) => (Array.isArray(v) ? v : []);
const asText = (v) => String(v || '').trim();

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
    return {
      ...fallbackResponse(rawContent),
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
