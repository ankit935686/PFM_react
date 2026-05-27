const logWithLevel = (level, scope, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const payload = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  console.log(`[${timestamp}] [${level}] [${scope}] ${message}${payload}`);
};

const logger = {
  info: (scope, message, meta) => logWithLevel('INFO', scope, message, meta),
  warn: (scope, message, meta) => logWithLevel('WARN', scope, message, meta),
  error: (scope, message, meta) => logWithLevel('ERROR', scope, message, meta),
};

module.exports = logger;
