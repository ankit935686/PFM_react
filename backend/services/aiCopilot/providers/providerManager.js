const { callGemini } = require('./geminiProvider');
const { callGroq } = require('./groqProvider');
const { isRetryableProviderError } = require('./fallbackManager');
const logger = require('../utils/logger');

const providerHealth = {
  gemini: { success: 0, fail: 0, lastError: null, lastUsedAt: null },
  groq: { success: 0, fail: 0, lastError: null, lastUsedAt: null },
};

const markSuccess = (provider) => {
  providerHealth[provider].success += 1;
  providerHealth[provider].lastError = null;
  providerHealth[provider].lastUsedAt = new Date().toISOString();
};

const markFailure = (provider, error) => {
  providerHealth[provider].fail += 1;
  providerHealth[provider].lastError = String(error?.message || error);
  providerHealth[provider].lastUsedAt = new Date().toISOString();
};

const callWithProviders = async (prompt) => {
  const providerOrder = ['gemini', 'groq'];
  let lastError = null;

  for (const provider of providerOrder) {
    try {
      const content = provider === 'gemini' ? await callGemini(prompt) : await callGroq(prompt);
      markSuccess(provider);
      return { provider, content };
    } catch (error) {
      markFailure(provider, error);
      lastError = error;
      logger.warn('providerManager', `${provider} failed`, { error: error.message });
      if (!isRetryableProviderError(error) && provider === 'gemini') {
        continue;
      }
    }
  }

  throw lastError || new Error('All providers failed');
};

const getProviderHealth = () => providerHealth;

module.exports = {
  callWithProviders,
  getProviderHealth,
};
