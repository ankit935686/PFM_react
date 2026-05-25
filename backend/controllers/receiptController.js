const Expense = require('../models/expenseModel');
const { parseReceiptWithGroq } = require('../services/groqReceiptService');

const getUserIdFromRequest = (req) => {
  return req.userId || req.user?.userId || req.user?._id || req.user?.id || null;
};

// Very small keyword-based mapper; can be extended later or replaced by a ML model
const keywordCategoryMap = [
  { keywords: ['grocery', 'groceries', 'supermarket', 'mart', 'grocer', 'kirana', 'provision', 'fresh', 'vegetable', 'veggie', 'fruit', 'dairy', 'milk', 'curd', 'paneer', 'rice', 'atta', 'flour', 'dal', 'lentil', 'pulses', 'oil', 'spices'], category: 'Groceries' },
  { keywords: ['restaurant', 'resto', 'hotel', 'cafe', 'coffee', 'diner', 'eatery', 'biryani', 'pizza', 'burger', 'meal', 'thali', 'naan', 'masala'], category: 'Dining' },
  { keywords: ['uber', 'ola', 'taxi', 'cab', 'ride'], category: 'Transport' },
  { keywords: ['pharmacy', 'chemist', 'health', 'clinic'], category: 'Health' },
  { keywords: ['petrol', 'fuel', 'gas station', 'fuelpump'], category: 'Transport' },
  { keywords: ['amazon', 'flipkart', 'shop', 'store', 'retail', 'mall'], category: 'Shopping' },
  { keywords: ['electricity', 'water', 'phone', 'internet', 'bill'], category: 'Utilities' },
];

const detectCategory = (text) => {
  if (!text) return 'Uncategorized';
  const lower = text.toLowerCase();
  for (const mapping of keywordCategoryMap) {
    for (const kw of mapping.keywords) {
      if (lower.includes(kw)) return mapping.category;
    }
  }
  return 'Uncategorized';
};

const pickDominantCategory = (entries, fallbackText = '') => {
  const totals = {};

  for (const entry of entries) {
    if (!entry) continue;
    const category = detectCategory(entry.name || '');
    const amount = Number(entry.amount) || 0;
    if (category === 'Uncategorized') continue;
    totals[category] = (totals[category] || 0) + Math.max(amount, 0.01);
  }

  const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  if (ranked.length > 0) {
    return ranked[0][0];
  }

  return detectCategory(fallbackText || '');
};

const buildReceiptContextText = (parsed, entries) => {
  const merchant = String(parsed?.merchant || '');
  const itemNames = Array.isArray(entries) ? entries.map((item) => String(item?.name || '')).filter(Boolean) : [];
  return [merchant, ...itemNames].join(' ').trim();
};

// POST /api/receipts/parse
const parseReceipt = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { imageBase64, imageMimeType, commit = false, aggregate = true } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ message: 'imageBase64 is required in the request body.' });
    }

    const parsed = await parseReceiptWithGroq({ imageBase64, imageMimeType });

    // Map categories for items
    const suggestedTransactions = [];

    if (Array.isArray(parsed.items) && parsed.items.length > 0) {
      for (const it of parsed.items) {
        const name = it.name || '';
        const amount = it.totalPrice || it.unitPrice || 0;
        const category = detectCategory(name);
        suggestedTransactions.push({ name, amount, category, quantity: it.quantity || null });
      }
    }

    // If no items found, fallback to mapping merchant + total
    if (suggestedTransactions.length === 0) {
      const category = detectCategory(parsed.merchant || '');
      suggestedTransactions.push({ name: parsed.merchant || 'Purchase', amount: parsed.total || 0, category });
    }

    const receiptContextText = buildReceiptContextText(parsed, suggestedTransactions);
    const dominantCategory = pickDominantCategory(suggestedTransactions, receiptContextText);
    if (dominantCategory !== 'Uncategorized') {
      for (const item of suggestedTransactions) {
        if (!item.category || item.category === 'Uncategorized') {
          item.category = dominantCategory;
        }
      }
    }

    const results = { parsed, suggestedTransactions, suggestedCategory: dominantCategory };

    // If commit=true, save to DB. If aggregate=true, save one expense with total; otherwise save each item as separate expense.
    if (commit) {
      if (aggregate) {
        const item = results.suggestedTransactions.reduce((acc, cur) => ({
          name: acc.name || cur.name,
          amount: (acc.amount || 0) + (Number(cur.amount) || 0),
          category: acc.category === 'Uncategorized' ? cur.category : acc.category,
        }), { name: null, amount: 0, category: 'Uncategorized' });

        const expense = await Expense.create({
          userId,
          amount: Number(item.amount) || 0,
          category: item.category || 'Uncategorized',
          date: parsed.date ? new Date(parsed.date) : new Date(),
          paymentMethod: 'Card',
          notes: `Scanned receipt - ${parsed.merchant || 'unknown'}`,
        });

        results.committed = [expense];
      } else {
        const created = [];
        for (const t of results.suggestedTransactions) {
          const expense = await Expense.create({
            userId,
            amount: Number(t.amount) || 0,
            category: t.category || 'Uncategorized',
            date: parsed.date ? new Date(parsed.date) : new Date(),
            paymentMethod: 'Card',
            notes: `Scanned item - ${t.name}`,
          });
          created.push(expense);
        }
        results.committed = created;
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to parse receipt', error: error.message });
  }
};

module.exports = {
  parseReceipt,
};
