const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const safeDiv = (a, b) => ((Number(b) || 0) === 0 ? 0 : Number(a || 0) / Number(b || 1));

const getDateRangeForMonths = (months = 6) => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  const start = new Date(end.getFullYear(), end.getMonth() - Math.max(1, months), 1, 0, 0, 0, 0);
  return { start, end };
};

module.exports = {
  round2,
  safeDiv,
  getDateRangeForMonths,
};
