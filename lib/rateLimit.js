/**
 * Simple in-memory rate limiter for production
 * Protects APIs from abuse and bot attacks
 */

const rateLimitMap = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
        if (now - value.resetTime > value.window * 1000) {
            rateLimitMap.delete(key);
        }
    }
}, 300000);

/**
 * Rate limit a request based on identifier (IP, user ID, etc)
 * @param {Object} options - Rate limit configuration
 * @param {number} options.limit - Maximum requests allowed
 * @param {number} options.window - Time window in seconds
 * @returns {Object} - { success: boolean, remaining: number }
 */
export function rateLimit({ limit = 60, window = 60 } = {}) {
    return {
        limit: async (identifier) => {
            const key = `${identifier}`;
            const now = Date.now();
            const windowMs = window * 1000;

            const record = rateLimitMap.get(key);

            if (!record) {
                // First request from this identifier
                rateLimitMap.set(key, {
                    count: 1,
                    resetTime: now + windowMs,
                    window
                });
                return { success: true, remaining: limit - 1 };
            }

            // Check if window has expired
            if (now > record.resetTime) {
                // Reset the window
                rateLimitMap.set(key, {
                    count: 1,
                    resetTime: now + windowMs,
                    window
                });
                return { success: true, remaining: limit - 1 };
            }

            // Within the same window
            if (record.count >= limit) {
                return {
                    success: false,
                    remaining: 0,
                    resetTime: record.resetTime
                };
            }

            // Increment count
            record.count++;
            return {
                success: true,
                remaining: limit - record.count
            };
        }
    };
}

/**
 * Helper to escape regex special characters
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
