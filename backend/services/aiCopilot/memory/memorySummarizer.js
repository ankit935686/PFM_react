const summarizeSession = (session) => {
  const recent = (session?.history || []).slice(-8);
  if (!recent.length) return '';

  const userQuestions = recent.filter((m) => m.role === 'user').map((m) => m.content);
  const assistantReplies = recent.filter((m) => m.role === 'assistant').map((m) => m.content);

  return [
    `Recent user topics: ${userQuestions.slice(-4).join(' | ').slice(0, 700)}`,
    `Recent assistant guidance: ${assistantReplies.slice(-3).join(' | ').slice(0, 700)}`,
  ].join('\n');
};

module.exports = {
  summarizeSession,
};
