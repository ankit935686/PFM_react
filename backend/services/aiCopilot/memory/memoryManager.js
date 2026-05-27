const crypto = require('crypto');

const sessionStore = new Map();
const MAX_HISTORY = 20;

const getOrCreateSession = (userId, sessionId) => {
  const key = `${String(userId)}:${sessionId || 'default'}`;
  if (!sessionStore.has(key)) {
    sessionStore.set(key, {
      sessionId: sessionId || crypto.randomUUID(),
      summary: '',
      activeTopics: [],
      history: [],
      updatedAt: new Date().toISOString(),
    });
  }
  return sessionStore.get(key);
};

const addMessage = (session, role, content) => {
  session.history.push({ role, content: String(content || ''), timestamp: new Date().toISOString() });
  if (session.history.length > MAX_HISTORY) {
    session.history = session.history.slice(-MAX_HISTORY);
  }
  session.updatedAt = new Date().toISOString();
};

const updateSummary = (session, summary) => {
  session.summary = String(summary || '').slice(0, 1400);
};

module.exports = {
  getOrCreateSession,
  addMessage,
  updateSummary,
};
