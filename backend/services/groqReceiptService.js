const parseNumber = (val) => {
  if (val === undefined || val === null) return null;
  const parsed = Number(String(val).replace(/[^0-9.\-]/g, ''));
  return Number.isNaN(parsed) ? null : parsed;
};

const stripCodeFences = (value) => { 
  if (!value) return '';

  return String(value)
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
};

const extractJsonObject = (value) => {
  const cleaned = stripCodeFences(value);

  try {
    return JSON.parse(cleaned);
  } catch (_error) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(candidate);
    }

    throw new Error('Failed to parse JSON from Groq response');
  }
};

const normalizeReceiptResult = (parsed) => {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Groq response did not contain a JSON object');
  }

  if (parsed.total !== undefined && parsed.total !== null) parsed.total = parseNumber(parsed.total);
  if (parsed.subtotal !== undefined && parsed.subtotal !== null) parsed.subtotal = parseNumber(parsed.subtotal);
  if (parsed.tax !== undefined && parsed.tax !== null) parsed.tax = parseNumber(parsed.tax);

  if (Array.isArray(parsed.items)) {
    parsed.items = parsed.items.map((it) => ({
      name: it?.name || '',
      quantity: parseNumber(it?.quantity) || null,
      unitPrice: parseNumber(it?.unitPrice) || null,
      totalPrice: parseNumber(it?.totalPrice) || null,
    }));
  } else {
    parsed.items = [];
  }

  return {
    merchant: parsed.merchant || null,
    date: parsed.date || null,
    currency: parsed.currency || null,
    total: parsed.total ?? null,
    subtotal: parsed.subtotal ?? null,
    tax: parsed.tax ?? null,
    items: parsed.items,
  };
};

const parseReceiptWithGroq = async ({ imageBase64, imageMimeType = 'image/jpeg' }) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const safeMimeType = String(imageMimeType || 'image/jpeg').startsWith('image/') ? String(imageMimeType) : 'image/jpeg';
  const imageDataUrl = `data:${safeMimeType};base64,${imageBase64}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.0,
        max_completion_tokens: 1200,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a receipt OCR and extraction engine. Extract structured data from the receipt image and return JSON only. Never wrap the JSON in markdown or code fences.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text:
                  'Extract this receipt into JSON with exactly these fields: merchant, date (YYYY-MM-DD), currency, total, subtotal, tax, items. items must be an array of objects with name, quantity, unitPrice, totalPrice. If a field is missing, use null. If there are no line items, return an empty array. Return only valid JSON.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Groq API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty response from Groq');

    try {
      return normalizeReceiptResult(extractJsonObject(content));
    } catch (parseErr) {
      throw new Error(`Failed to parse JSON from Groq response: ${parseErr.message}`);
    }
  } catch (err) {
    throw err;
  }
};

module.exports = {
  parseReceiptWithGroq,
};
