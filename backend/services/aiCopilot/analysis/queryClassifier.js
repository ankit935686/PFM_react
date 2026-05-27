const intentRules = [
  { intent: 'spending_analysis', keywords: ['spend', 'spending', 'expense', 'category', 'where money'] },
  { intent: 'savings_analysis', keywords: ['saving', 'savings', 'surplus', 'emergency fund'] },
  { intent: 'budgeting_help', keywords: ['budget', 'allocation', 'limit', 'over budget'] },
  { intent: 'splitwise_analysis', keywords: ['split', 'settlement', 'owe', 'group expense'] },
  { intent: 'financial_health', keywords: ['financial health', 'overall', 'score', 'status'] },
  { intent: 'goal_tracking', keywords: ['goal', 'target', 'milestone', 'progress'] },
  { intent: 'investment_advice', keywords: ['invest', 'investment', 'portfolio', 'allocation'] },
  { intent: 'stock_analysis', keywords: ['stock', 'stocks', 'ticker', 'equity', 'pe ratio'] },
  { intent: 'market_education', keywords: ['etf', 'mutual fund', 'what is', 'explain market'] },
  { intent: 'portfolio_growth', keywords: ['grow portfolio', 'increase returns', 'wealth plan'] },
  { intent: 'recurring_expense_analysis', keywords: ['subscription', 'recurring', 'auto pay'] },
  { intent: 'risk_analysis', keywords: ['risk', 'volatile', 'drawdown', 'safe'] },
  { intent: 'hybrid_financial_reasoning', keywords: ['based on my', 'according to my savings', 'analyze and suggest'] },
  { intent: 'general_finance_question', keywords: ['finance', 'money', 'cashflow'] },
];

const nonFinancialKeywords = ['weather', 'movie', 'song', 'joke', 'football', 'coding', 'javascript', 'python'];

const tokenize = (text) => String(text || '').toLowerCase();

const countMatches = (text, keywords) => keywords.reduce((sum, kw) => sum + (text.includes(kw) ? 1 : 0), 0);

const classifyQuery = (queryText) => {
  const text = tokenize(queryText).trim();
  if (!text) {
    return {
      intent: 'general_finance_question',
      confidence: 0.1,
      contextMode: 'general_ai_mode',
      flags: {
        useUserFinanceData: false,
        usePortfolioData: false,
        useMarketData: false,
        useRealtimeData: false,
        useConversationMemory: true,
        useGeneralReasoningOnly: true,
        useAnalytics: false,
      },
    };
  }

  if (countMatches(text, nonFinancialKeywords) > 0 && !text.includes('finance')) {
    return {
      intent: 'non_financial_question',
      confidence: 0.82,
      contextMode: 'general_ai_mode',
      flags: {
        useUserFinanceData: false,
        usePortfolioData: false,
        useMarketData: false,
        useRealtimeData: false,
        useConversationMemory: true,
        useGeneralReasoningOnly: true,
        useAnalytics: false,
      },
    };
  }

  let best = { intent: 'general_finance_question', score: 0 };
  for (const rule of intentRules) {
    const score = countMatches(text, rule.keywords);
    if (score > best.score) best = { intent: rule.intent, score };
  }

  const intent = best.intent;
  const useMarket = ['stock_analysis', 'investment_advice', 'market_education'].includes(intent);
  const usePortfolio = ['portfolio_growth', 'investment_advice', 'hybrid_financial_reasoning'].includes(intent);
  const useFinance = intent !== 'non_financial_question';
  const useAnalytics = useFinance && intent !== 'market_education';
  const contextMode =
    intent === 'non_financial_question'
      ? 'general_ai_mode'
      : intent === 'stock_analysis'
      ? 'real_time_market_analysis_mode'
      : intent === 'hybrid_financial_reasoning'
      ? 'hybrid_financial_reasoning_mode'
      : usePortfolio
      ? 'investment_intelligence_mode'
      : 'personal_finance_mode';

  return {
    intent,
    confidence: Math.min(0.95, 0.35 + best.score * 0.15),
    contextMode,
    flags: {
      useUserFinanceData: useFinance,
      usePortfolioData: usePortfolio,
      useMarketData: useMarket,
      useRealtimeData: useMarket && (text.includes('today') || text.includes('current') || text.includes('latest')),
      useConversationMemory: true,
      useGeneralReasoningOnly: intent === 'non_financial_question',
      useAnalytics,
    },
  };
};

module.exports = {
  classifyQuery,
};
