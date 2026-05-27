const Profile = require('../../../models/profileModel');
const { buildAnalyticsPacket } = require('../analytics/analyticsAggregator');
const { getMarketData } = require('../market/marketDataService');

const buildProfileSummary = async (firebaseUid) => {
  if (!firebaseUid) return null;
  const profile = await Profile.findOne({ firebaseUid }).lean();
  if (!profile) return null;

  return {
    fullName: profile.fullName || '',
    country: profile.country || '',
    currency: profile.currency || 'INR',
    monthlyIncome: Number(profile.monthlyIncome || 0),
    monthlyBudget: Number(profile.monthlyBudget || 0),
    savingsGoal: Number(profile.savingsGoal || 0),
    occupation: profile.occupation || '',
  };
};

const buildUnifiedContext = async ({ userId, firebaseUid, queryText, classification, plan, memory }) => {
  if (plan.useGeneralReasoningOnly) {
    return {
      mode: classification.contextMode,
      query: queryText,
      memory: plan.useMemory ? memory : null,
    };
  }

  const [profile, analytics, marketData] = await Promise.all([
    plan.useUserProfile ? buildProfileSummary(firebaseUid) : Promise.resolve(null),
    buildAnalyticsPacket({ userId, plan }),
    plan.useMarketData
      ? getMarketData({ queryText, realtime: plan.useRealtimeMarketData })
      : Promise.resolve({ used: false, symbols: [], quotes: [] }),
  ]);

  return {
    mode: classification.contextMode,
    intent: classification.intent,
    query: queryText,
    profile,
    analytics,
    marketData,
    memory: plan.useMemory ? memory : null,
  };
};

module.exports = {
  buildUnifiedContext,
};
