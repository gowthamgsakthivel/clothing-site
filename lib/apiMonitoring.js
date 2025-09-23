/**
 * Simple API performance monitoring utility
 */

const API_METRICS = {
  counts: {},
  durations: {},
  errors: {}
};

/**
 * Measure the performance of an API handler
 * 
 * @param {string} routeName - Name of the API route
 * @param {function} handler - Async API handler function
 * @returns {function} - Wrapped handler with performance monitoring
 */
export function measureApiPerformance(routeName, handler) {
  return async (request, ...rest) => {
    const startTime = performance.now();

    try {
      // Initialize metrics for this route if needed
      if (!API_METRICS.counts[routeName]) {
        API_METRICS.counts[routeName] = 0;
        API_METRICS.durations[routeName] = [];
        API_METRICS.errors[routeName] = 0;
      }

      // Increment request count
      API_METRICS.counts[routeName]++;

      // Execute the original handler
      const response = await handler(request, ...rest);

      // Record duration
      const duration = performance.now() - startTime;
      API_METRICS.durations[routeName].push(duration);

      // Keep only the last 100 measurements
      if (API_METRICS.durations[routeName].length > 100) {
        API_METRICS.durations[routeName].shift();
      }

      return response;

    } catch (error) {
      // Record error
      API_METRICS.errors[routeName] = (API_METRICS.errors[routeName] || 0) + 1;

      // Record duration even for errors
      const duration = performance.now() - startTime;
      API_METRICS.durations[routeName].push(duration);

      // Rethrow the error
      throw error;
    }
  };
}

/**
 * Get API metrics for all monitored routes
 * 
 * @returns {Object} - API performance metrics
 */
export function getApiMetrics() {
  const metrics = {};

  Object.keys(API_METRICS.counts).forEach(route => {
    const durations = API_METRICS.durations[route];
    const avgDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    metrics[route] = {
      requests: API_METRICS.counts[route],
      errors: API_METRICS.errors[route] || 0,
      avgDuration: Math.round(avgDuration * 100) / 100,
      p95Duration: calculatePercentile(durations, 95),
      errorRate: API_METRICS.counts[route] > 0
        ? (API_METRICS.errors[route] || 0) / API_METRICS.counts[route]
        : 0
    };
  });

  return metrics;
}

/**
 * Calculate a percentile value from an array of numbers
 * 
 * @param {Array<number>} values - Array of numeric values
 * @param {number} percentile - Percentile to calculate (0-100)
 * @returns {number} - Percentile value
 */
function calculatePercentile(values, percentile) {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;

  return sorted[Math.max(0, index)];
}

/**
 * Create an API endpoint to expose metrics
 * 
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 */
export function metricsEndpoint(req, res) {
  // Simple security check (should use proper auth in production)
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.METRICS_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({
    metrics: getApiMetrics(),
    timestamp: new Date().toISOString()
  });
}
