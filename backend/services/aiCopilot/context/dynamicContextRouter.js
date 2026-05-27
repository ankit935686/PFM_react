const buildContextPlan = ({ classification, queryText = '' }) => {
  const flags = classification?.flags || {};
  const text = String(queryText || '').toLowerCase();
  const asksSpendingBreakdown =
    text.includes('food') ||
    text.includes('category') ||
    text.includes('breakdown') ||
    text.includes('how much') ||
    text.includes('spent') ||
    text.includes('spending');

  return {
    useMemory: flags.useConversationMemory !== false,
    useUserProfile: flags.useUserFinanceData,
    useAnalytics: flags.useAnalytics,
    usePortfolio: flags.usePortfolioData,
    useMarketData: flags.useMarketData,
    useRealtimeMarketData: flags.useRealtimeData,
    useGeneralReasoningOnly: flags.useGeneralReasoningOnly,
    sections: (() => {
      if (flags.useGeneralReasoningOnly) return [];
      const sections = ['core'];
      if (classification.intent.includes('spending') || classification.intent === 'budgeting_help') {
        sections.push('spending', 'budgets', 'recurring');
      }
      if (classification.intent.includes('saving') || classification.intent === 'goal_tracking') {
        sections.push('savings', 'goals', 'trends');
      }
      if (classification.intent.includes('splitwise')) sections.push('splitwise');
      if (classification.intent.includes('risk') || classification.intent.includes('investment')) sections.push('risk');
      if (classification.intent.includes('portfolio') || classification.intent.includes('investment')) sections.push('portfolio');
      // Hybrid investment + spending questions must carry category-level spend context.
      if (asksSpendingBreakdown) {
        sections.push('spending', 'budgets', 'recurring');
      }
      if (!sections.includes('trends')) sections.push('trends');
      return Array.from(new Set(sections));
    })(),
    months: classification.intent === 'spending_trends' ? 12 : 6,
  };
};

module.exports = {
  buildContextPlan,
};
