const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const callGroq = async ({ system, user }) => {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('Groq API key not configured');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 1300,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Groq API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '';
  if (!String(content).trim()) throw new Error('Groq empty response');
  return content;
};

module.exports = {
  callGroq,
};
