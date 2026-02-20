const shouldLog = () => process.env.NODE_ENV !== 'test';

const log = (level, message, meta = {}) => {
  if (!shouldLog()) return;
  const payload = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  if (level === 'error') {
    console.error(`[${level.toUpperCase()}] ${message}${payload}`);
    return;
  }
  if (level === 'warn') {
    console.warn(`[${level.toUpperCase()}] ${message}${payload}`);
    return;
  }
  console.log(`[${level.toUpperCase()}] ${message}${payload}`);
};

const logger = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta)
};

export default logger;
