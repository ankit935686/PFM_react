const GroupActivityLog = require('../../models/groupActivityLogModel');
const GroupNotification = require('../../models/groupNotificationModel');

const createActivity = async ({ groupId, actorUserId, type, title, description, metadata, session }) => {
  await GroupActivityLog.create(
    [
      {
        groupId,
        actorUserId,
        type,
        title,
        description: description || '',
        metadata: metadata || null,
      },
    ],
    { session }
  );
};

const createNotifications = async ({ userIds, groupId, type, title, description, payload, session }) => {
  if (!Array.isArray(userIds) || userIds.length === 0) return;
  const docs = userIds.map((userId) => ({
    userId,
    groupId,
    type,
    title,
    description: description || '',
    payload: payload || null,
  }));
  await GroupNotification.insertMany(docs, { session });
};

module.exports = {
  createActivity,
  createNotifications,
};

