const { classifyQuery } = require('../services/aiCopilot/analysis/queryClassifier');
const { buildContextPlan } = require('../services/aiCopilot/context/dynamicContextRouter');
const { buildUnifiedContext } = require('../services/aiCopilot/context/contextBuilder');
const { buildPrompt } = require('../services/aiCopilot/prompt/promptBuilder');
const { callWithProviders, getProviderHealth } = require('../services/aiCopilot/providers/providerManager');
const { formatCopilotResponse, fallbackResponse } = require('../services/aiCopilot/response/responseFormatter');
const { getOrCreateSession, addMessage, updateSummary } = require('../services/aiCopilot/memory/memoryManager');
const { summarizeSession } = require('../services/aiCopilot/memory/memorySummarizer');
const logger = require('../services/aiCopilot/utils/logger');

const getUserIdFromRequest = (req) => req.userId || req.user?.userId || req.user?._id || req.user?.id || null;
const getFirebaseUidFromRequest = (req) => req.user?.firebaseUid || req.headers['x-firebase-uid'] || null;

const looksUnavailableReply = (text) => {
  const value = String(text || '').toLowerCase();
  return (
    value.includes("can't tell") ||
    value.includes('cannot tell') ||
    value.includes('not available') ||
    value.includes('isn\'t available') ||
    value.includes('need access to') ||
    value.includes('provide this information')
  );
};

const isTopSpendingQuery = (queryText) => {
  const q = String(queryText || '').toLowerCase();
  return q.includes('top spending') || (q.includes('spending') && q.includes('category'));
};

const chatWithCopilot = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const firebaseUid = getFirebaseUidFromRequest(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { message, sessionId } = req.body || {};
    if (!String(message || '').trim()) {
      return res.status(400).json({ message: 'message is required' });
    }

    const queryText = String(message).trim();
    const classification = classifyQuery(queryText);
    const plan = buildContextPlan({ classification, queryText });
    const session = getOrCreateSession(String(userId), sessionId);

    addMessage(session, 'user', queryText);
    const sessionSummary = summarizeSession(session);
    updateSummary(session, sessionSummary);

    const context = await buildUnifiedContext({
      userId,
      firebaseUid,
      queryText,
      classification,
      plan,
      memory: {
        summary: session.summary,
        recentMessages: session.history.slice(-6),
      },
    });

    const prompt = buildPrompt({ queryText, classification, context });

    let providerOutput;
    try {
      providerOutput = await callWithProviders(prompt);
    } catch (providerError) {
      logger.error('aiCopilotController', 'all providers failed', { error: providerError.message });
      const graceful = fallbackResponse(
        'I could not reach AI providers right now. Please retry in a moment. Meanwhile, I can still help with budgeting and savings basics.'
      );
      return res.status(200).json({
        sessionId: session.sessionId,
        classification,
        contextMode: classification.contextMode,
        provider: 'none',
        response: graceful,
      });
    }

    const response = formatCopilotResponse({
      rawContent: providerOutput.content,
      context,
      classification,
      provider: providerOutput.provider,
    });

    if (isTopSpendingQuery(queryText) && looksUnavailableReply(response.text)) {
      const monthlyTop = context?.analytics?.spending?.currentMonthTopCategory;
      const fallbackTop = context?.analytics?.spending?.topCategories?.[0] || null;
      const top = monthlyTop || fallbackTop;
      if (top) {
        response.text = `Your top spending category is ${top.category} at approximately ${top.total}.`;
        response.executiveSummary = response.text;
        response.insights = [
          `Top category: ${top.category}`,
          `Amount spent: ${top.total}`,
          ...(context?.analytics?.spending?.currentMonthCategories?.[1]
            ? [
                `Second highest category: ${context.analytics.spending.currentMonthCategories[1].category} (${context.analytics.spending.currentMonthCategories[1].total})`,
              ]
            : []),
        ];
        response.recommendations = [
          `Set a category cap for ${top.category} and track weekly progress.`,
          'Use recurring spend review to cut non-essential expenses in this category.',
        ];
        response.warnings = [];
      }
    }

    addMessage(session, 'assistant', response.text);
    updateSummary(session, summarizeSession(session));

    return res.status(200).json({
      sessionId: session.sessionId,
      classification,
      contextMode: classification.contextMode,
      provider: providerOutput.provider,
      response,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to process AI copilot request',
      error: error.message,
    });
  }
};

const getCopilotHealth = async (_req, res) => {
  return res.status(200).json({
    providerHealth: getProviderHealth(),
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  chatWithCopilot,
  getCopilotHealth,
};
