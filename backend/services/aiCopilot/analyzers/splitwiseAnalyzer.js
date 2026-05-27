const Group = require('../../../models/groupModel');
const GroupBalanceLedger = require('../../../models/groupBalanceLedgerModel');
const { round2 } = require('../analytics/helpers');

const getSplitwiseAnalysis = async (userId) => {
  const groups = await Group.find({ 'members.userId': userId, archived: false }).lean();
  if (!groups.length) {
    return { groupCount: 0, youOwe: 0, youAreOwed: 0, netBalance: 0, groups: [] };
  }

  const groupIds = groups.map((g) => g._id);
  const ledgerRows = await GroupBalanceLedger.find({ groupId: { $in: groupIds } }).lean();

  let youOwe = 0;
  let youAreOwed = 0;
  for (const row of ledgerRows) {
    if (String(row.fromUserId) === String(userId)) youOwe += Number(row.amount || 0);
    if (String(row.toUserId) === String(userId)) youAreOwed += Number(row.amount || 0);
  }

  return {
    groupCount: groups.length,
    youOwe: round2(youOwe),
    youAreOwed: round2(youAreOwed),
    netBalance: round2(youAreOwed - youOwe),
    groups: groups.map((g) => ({ groupId: g._id, name: g.name, category: g.category })),
  };
};

module.exports = {
  getSplitwiseAnalysis,
};
