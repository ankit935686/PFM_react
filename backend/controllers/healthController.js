const mongoose = require('mongoose');

const stateLabelMap = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

const getHealth = (_req, res) => {
  const readyState = mongoose.connection.readyState;

  res.status(200).json({
    status: 'ok',
    service: 'pfm-backend',
    database: {
      connected: readyState === 1,
      state: readyState,
      stateLabel: stateLabelMap[readyState] || 'unknown',
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getHealth,
};
