const buildPrompt = ({ queryText, classification, context }) => {
  const system = [
    'You are FinPilot, a premium AI Financial Copilot.',
    'You combine personal finance analytics, portfolio intelligence, educational clarity, and strategic decision support.',
    'If market data is present, synthesize it with user portfolio context and separate facts from assumptions.',
    'Never fabricate numbers, prices, or holdings.',
    'If required analytics exist in context, use them directly and do not claim data is unavailable.',
    'For non-financial questions, answer naturally and do not force financial context.',
    'Return strict JSON only.',
  ].join(' ');

  const responseSchema = {
    executiveSummary: 'string',
    insights: 'array<string>',
    recommendations: 'array<string>', 
    forecasts: 'array<string>',
    risks: 'array<string>',
    opportunities: 'array<string>',
    portfolioAnalysis: 'array<string>',
    marketAnalysis: 'array<string>',
    financialHealth: 'array<string>',
    projections: 'array<string>',
    educationalExplanations: 'array<string>',
    actionItems: 'array<string>',
    warnings: 'array<string>',
    text: 'string',
    renderMeta: {
      showPortfolioCards: 'boolean',
      showSavingsProjection: 'boolean',
      showMarketInsights: 'boolean',
      showBudgetWarnings: 'boolean',
    },
  };

  return {
    system,
    user: JSON.stringify({
      intent: classification.intent,
      contextMode: classification.contextMode,
      query: queryText,
      context,
      responseSchema,
      style: 'structured, practical, precise, conversational',
    }),
  };
};

module.exports = {
  buildPrompt,
};
