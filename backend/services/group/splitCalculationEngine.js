const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const round2 = (value) => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const distributeRemainder = (rows, total) => {
  const sum = round2(rows.reduce((acc, row) => acc + row.amount, 0));
  const delta = round2(total - sum);
  if (!rows.length || delta === 0) return rows;
  rows[rows.length - 1].amount = round2(rows[rows.length - 1].amount + delta);
  return rows;
};

const buildEqualSplit = ({ amount, participantUserIds }) => {
  const count = participantUserIds.length;
  const base = count > 0 ? round2(amount / count) : 0;
  const rows = participantUserIds.map((userId) => ({ userId, amount: base, percent: null, shares: null }));
  return distributeRemainder(rows, amount);
};

const buildExactSplit = ({ amount, splitInputs = [], participantUserIds }) => {
  const byUser = new Map(splitInputs.map((item) => [String(item.userId), round2(item.amount)]));
  const rows = participantUserIds.map((userId) => ({
    userId,
    amount: round2(byUser.get(String(userId)) || 0),
    percent: null,
    shares: null,
  }));

  const sum = round2(rows.reduce((acc, row) => acc + row.amount, 0));
  if (sum !== round2(amount)) {
    throw new Error('Exact split total must equal expense amount.');
  }
  return rows;
};

const buildPercentageSplit = ({ amount, splitInputs = [], participantUserIds }) => {
  const byUserPercent = new Map(splitInputs.map((item) => [String(item.userId), toNumber(item.percent)]));
  const rows = participantUserIds.map((userId) => {
    const percent = toNumber(byUserPercent.get(String(userId)));
    return {
      userId,
      amount: round2((amount * percent) / 100),
      percent,
      shares: null,
    };
  });

  const percentTotal = round2(rows.reduce((acc, row) => acc + toNumber(row.percent), 0));
  if (percentTotal !== 100) {
    throw new Error('Percentage split must sum to 100.');
  }
  return distributeRemainder(rows, amount);
};

const buildShareSplit = ({ amount, splitInputs = [], participantUserIds }) => {
  const byUserShares = new Map(splitInputs.map((item) => [String(item.userId), toNumber(item.shares)]));
  const totalShares = participantUserIds.reduce((acc, userId) => acc + toNumber(byUserShares.get(String(userId))), 0);
  if (totalShares <= 0) {
    throw new Error('Share split requires at least one share.');
  }

  const rows = participantUserIds.map((userId) => {
    const shares = toNumber(byUserShares.get(String(userId)));
    return {
      userId,
      amount: round2((amount * shares) / totalShares),
      percent: null,
      shares,
    };
  });
  return distributeRemainder(rows, amount);
};

const calculateSplits = ({ splitType, amount, participantUserIds, splitInputs }) => {
  const normalizedAmount = round2(amount);
  if (normalizedAmount <= 0) throw new Error('Expense amount must be greater than zero.');
  if (!Array.isArray(participantUserIds) || participantUserIds.length === 0) {
    throw new Error('At least one participant is required.');
  }

  if (splitType === 'equal') {
    return buildEqualSplit({ amount: normalizedAmount, participantUserIds });
  }
  if (splitType === 'exact') {
    return buildExactSplit({ amount: normalizedAmount, splitInputs, participantUserIds });
  }
  if (splitType === 'percentage') {
    return buildPercentageSplit({ amount: normalizedAmount, splitInputs, participantUserIds });
  }
  if (splitType === 'shares') {
    return buildShareSplit({ amount: normalizedAmount, splitInputs, participantUserIds });
  }
  throw new Error('Unsupported split type.');
};

module.exports = {
  calculateSplits,
  round2,
};

