import { useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const expenseCategories = ['Food', 'Transport', 'Shopping', 'Rent', 'Utilities', 'Health', 'Education', 'Entertainment', 'Travel', 'Groceries', 'Bills', 'Other'];

const ReceiptScanner = ({ onClose, onAdd, onSaved }) => {
  const { currentUser } = useAuth();
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Other');

  const pickBestSuggestedCategory = (suggestedTransactions) => {
    if (!Array.isArray(suggestedTransactions) || suggestedTransactions.length === 0) {
      return 'Uncategorized';
    }

    const totals = suggestedTransactions.reduce((acc, item) => {
      const category = String(item?.category || 'Uncategorized').trim();
      const amount = Number(item?.amount) || 0;
      if (!category || category === 'Uncategorized') {
        return acc;
      }
      acc[category] = (acc[category] || 0) + Math.max(amount, 0.01);
      return acc;
    }, {});

    const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (ranked.length > 0) {
      return ranked[0][0];
    }

    return String(suggestedTransactions[0]?.category || 'Uncategorized');
  };

  const toCompressedBase64 = (file) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        try {
          const maxWidth = 1400;
          const scale = Math.min(1, maxWidth / image.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));

          const context = canvas.getContext('2d');
          if (!context) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Unable to process image'));
            return;
          }

          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.72);
          URL.revokeObjectURL(objectUrl);
          resolve(compressed.split(',')[1]);
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Invalid image file'));
      };

      image.src = objectUrl;
    });

  const handleFile = async (e) => {
    setError('');
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFileName(file.name || 'file');

    try {
      setLoading(true);
      const base64 = await toCompressedBase64(file);
      const payload = { imageBase64: base64, imageMimeType: 'image/jpeg', commit: false };

      const headers = {};
      if (currentUser?.uid) headers['x-firebase-uid'] = currentUser.uid;

      const resp = await api.post('/api/receipts/parse', payload, { headers });
      const nextResult = resp.data || null;
      setResult(nextResult);
      setSelectedCategory(
        mapDetectedToAppCategory(nextResult?.suggestedCategory || pickBestSuggestedCategory(nextResult?.suggestedTransactions))
      );
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to parse receipt');
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async () => {
    if (!result) return;
    // Prefer parsed.total and dominant category across all suggested items
    const parsed = result.parsed || {};
    const suggested = (result.suggestedTransactions && result.suggestedTransactions[0]) || null;
    const amount = parsed.total || (suggested ? suggested.amount : null) || '';
    const category = selectedCategory || mapDetectedToAppCategory(result.suggestedCategory);
    const hasParsedDate = Boolean(parsed.date);
    const notes = parsed.merchant
      ? `Scanned: ${parsed.merchant}${hasParsedDate ? ` (receipt date: ${parsed.date})` : ''}`
      : '';

    if (!amount) {
      setError('Could not detect a total amount. Please apply and edit manually.');
      return;
    }

    try {
      setSaving(true);
      if (onAdd) {
        await onAdd({
          amount,
          category,
          // Use today's date for ledger entry so it appears in current period dashboards.
          date: new Date().toISOString().slice(0, 10),
          notes,
        });
      }
      if (onSaved) {
        onSaved();
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save scanned transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F19] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Scan receipt</h3>
        <button type="button" onClick={onClose} className="text-sm text-slate-400">Close</button>
      </div>

      <div className="grid gap-2">
        <label className="text-xs text-slate-300">Upload or take photo</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="text-sm text-slate-300"
        />

        {loading && <p className="text-sm text-slate-400">Analyzing image...</p>}
        {error && <p className="text-sm text-rose-300">{error}</p>}

        {result && (
          <div className="mt-2 rounded-lg border border-white/5 bg-white/2 p-3 text-slate-100">
            <p className="text-sm">Merchant: <strong>{result.parsed?.merchant || 'Unknown'}</strong></p>
            <p className="text-sm">Date: <strong>{result.parsed?.date || 'Unknown'}</strong></p>
            <p className="text-sm">Total: <strong>{result.parsed?.total ?? 'Unknown'}</strong></p>
            <label className="mt-2 grid gap-1 text-xs text-slate-300">
              <span>Detected category (review before adding)</span>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="rounded-lg border border-[#1F2937] bg-[#0B0F19] px-2.5 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              >
                {expenseCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            {Array.isArray(result.parsed?.items) && result.parsed.items.length > 0 && (
              <div className="mt-2 text-xs text-slate-300">
                <p className="font-medium">Items:</p>
                <ul className="ml-3 list-disc">
                  {result.parsed.items.slice(0, 5).map((it, idx) => (
                    <li key={idx} className="truncate">{it.name} — {it.totalPrice ?? it.unitPrice ?? ''}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={addTransaction}
                disabled={saving}
                className="rounded-xl bg-linear-to-r from-cyan-400 to-blue-500 px-3 py-1 text-sm font-semibold text-slate-950 disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Add transaction'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptScanner;
  const mapDetectedToAppCategory = (rawCategory) => {
    const normalized = String(rawCategory || '').trim().toLowerCase();
    const map = {
      dining: 'Food',
      grocery: 'Groceries',
      groceries: 'Groceries',
      food: 'Food',
      transport: 'Transport',
      shopping: 'Shopping',
      rent: 'Rent',
      utilities: 'Utilities',
      health: 'Health',
      education: 'Education',
      entertainment: 'Entertainment',
      travel: 'Travel',
      bills: 'Bills',
      other: 'Other',
      uncategorized: 'Other',
    };

    const mapped = map[normalized] || 'Other';
    return expenseCategories.includes(mapped) ? mapped : 'Other';
  };
