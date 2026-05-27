const isRetryableProviderError = (error) => {
  const msg = String(error?.message || '').toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('rate') ||
    msg.includes('quota') ||
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('500')
  );
};

module.exports = {
  isRetryableProviderError,
};
