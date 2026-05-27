const extractTickerCandidates = (queryText) => {
  const text = String(queryText || '');
  const explicit = text.match(/\b[A-Z]{1,5}\b/g) || [];
  const knownWords = ['ETF', 'SIP', 'NIFTY', 'SENSEX'];
  return explicit.filter((t) => !knownWords.includes(t)).slice(0, 4);
};

const fetchYahooQuote = async (symbol) => {
  const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`);
  if (!response.ok) throw new Error(`Yahoo quote failed: ${response.status}`);
  const json = await response.json();
  const row = json?.quoteResponse?.result?.[0];
  if (!row) return null;

  return {
    symbol,
    name: row.shortName || row.longName || symbol,
    price: row.regularMarketPrice || null,
    changePercent: row.regularMarketChangePercent || null,
    marketCap: row.marketCap || null,
    currency: row.currency || null,
    exchange: row.fullExchangeName || row.exchange || null,
  };
};

const fetchFinnhubQuote = async (symbol) => {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(key)}`);
  if (!response.ok) throw new Error(`Finnhub quote failed: ${response.status}`);
  const row = await response.json();
  if (!row || typeof row.c !== 'number') return null;
  return {
    symbol,
    name: symbol,
    price: row.c || null,
    changePercent: row.dp || null,
    marketCap: null,
    currency: null,
    exchange: null,
  };
};

const fetchAlphaOverview = async (symbol) => {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return null;
  const response = await fetch(
    `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`
  );
  if (!response.ok) throw new Error(`Alpha overview failed: ${response.status}`);
  const row = await response.json();
  if (!row || !row.Symbol) return null;
  return {
    peRatio: row.PERatio || null,
    sector: row.Sector || null,
    industry: row.Industry || null,
  };
};

const getMarketData = async ({ queryText, realtime = false }) => {
  const symbols = extractTickerCandidates(queryText);
  if (!symbols.length) {
    return {
      used: false,
      symbols: [],
      quotes: [],
      note: 'No explicit ticker symbols detected in query.',
    };
  }

  const quotes = [];
  for (const symbol of symbols) {
    let quote = null;
    try {
      quote = await fetchYahooQuote(symbol);
    } catch (_error) {
      quote = null;
    }
    if (!quote) {
      try {
        quote = await fetchFinnhubQuote(symbol);
      } catch (_error) {
        quote = null;
      }
    }

    if (quote && realtime) {
      try {
        const overview = await fetchAlphaOverview(symbol);
        if (overview) {
          quote = { ...quote, ...overview };
        }
      } catch (_error) {}
    }

    if (quote) quotes.push(quote);
  }

  return {
    used: quotes.length > 0,
    symbols,
    quotes,
    fetchedAt: new Date().toISOString(),
  };
};

module.exports = {
  getMarketData,
};
