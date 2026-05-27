const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const callGemini = async ({ system, user }) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key not configured');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_MODEL
  )}:generateContent?key=${encodeURIComponent(key)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1400,
        responseMimeType: 'application/json',
      },
      contents: [{ role: 'user', parts: [{ text: `${system}\n\n${user}` }] }],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Gemini API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!String(content).trim()) throw new Error('Gemini empty response');
  return content;
};

module.exports = {
  callGemini,
};
