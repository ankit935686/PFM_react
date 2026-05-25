import { useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const expenseCategories = ['Food', 'Transport', 'Shopping', 'Rent', 'Utilities', 'Health', 'Education', 'Entertainment', 'Travel', 'Groceries', 'Bills', 'Other'];

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
        } catch (scanError) {
          URL.revokeObjectURL(objectUrl);
          reject(scanError);
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
    <div className="max-h-[34vh] overflow-y-auto rounded-xl border border-[#E2E4EF] bg-[#F8F8FC] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1E1E2D]">Scan receipt</h3>
        <button type="button" onClick={onClose} className="text-sm text-gray-400">Close</button>
      </div>

      <div className="grid gap-2">
        <label className="mb-1 text-[11px] uppercase tracking-wider text-gray-400">Upload or take photo</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="text-[12px] font-medium text-[#5B5BD6] file:mr-3 file:rounded-lg file:border file:border-[#E2E4EF] file:bg-white file:px-2 file:py-1 file:text-[12px] file:text-gray-500"
        />
        {fileName && <p className="truncate text-[12px] font-medium text-[#5B5BD6]">{fileName}</p>}

        {loading && <p className="text-sm text-gray-500">Analyzing image...</p>}
        {error && <p className="text-sm text-rose-500">{error}</p>}

        {result && (
          <div className="mt-2 rounded-lg border border-[#E8EAF6] bg-white p-3">
            <p className="text-[13px] font-semibold text-[#1E1E2D]">{result.parsed?.merchant || 'Unknown merchant'}</p>
            <p className="mt-1 text-[12px] text-gray-500">Date: <strong>{result.parsed?.date || 'Unknown'}</strong></p>
            <p className="text-[12px] text-gray-500">Total: <strong className="text-[15px] font-bold text-[#1E1E2D]">{result.parsed?.total ?? 'Unknown'}</strong></p>

            <label className="mt-3 grid gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-gray-400">Detected category</span>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="h-[38px] rounded-lg border border-[#E2E4EF] bg-[#F8F8FC] px-3 text-[13px] text-[#1E1E2D] outline-none transition focus:border-[#5B5BD6] focus:bg-white focus:ring-2 focus:ring-[#5B5BD6]/10"
              >
                {expenseCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            {Array.isArray(result.parsed?.items) && result.parsed.items.length > 0 && (
              <div className="mt-2 text-[11px] text-gray-500">
                <p className="font-medium text-gray-600">Items:</p>
                <ul className="mt-1 space-y-1">
                  {result.parsed.items.slice(0, 5).map((it, idx) => (
                    <li key={idx} className="truncate text-gray-500">
                      <span className="text-gray-700">{it.name}</span>
                      <span className="float-right font-medium text-[#5B5BD6]">{it.totalPrice ?? it.unitPrice ?? ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3">
              <button
                type="button"
                onClick={addTransaction}
                disabled={saving}
                className="mt-3 h-[38px] w-full rounded-lg bg-[#5B5BD6] text-[13px] font-medium text-white hover:bg-[#4848C2] disabled:opacity-70"
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
