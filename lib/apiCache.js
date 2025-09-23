/**
 * Simple in-memory API response cache
 * Provides TTL-based caching to reduce database hits
 */
const memoryCache = new Map();

/**
 * Get a cached API response or execute the handler function
 * 
 * @param {string} key - Unique cache key
 * @param {function} handler - Async function to execute if cache miss
 * @param {number} ttlSeconds - Time to live in seconds (default: 60)
 * @returns {Promise<any>} - Cached or fresh result
 */
export async function getCachedResponse(key, handler, ttlSeconds = 60) {
  // Skip cache in development to avoid stale data during development
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_API_CACHE !== 'true') {
    return await handler();
  }

  const cacheEntry = memoryCache.get(key);
  const now = Date.now();

  if (cacheEntry && cacheEntry.expiry > now) {
    console.log(`[Cache Hit] ${key}`);
    return cacheEntry.data;
  }

  console.log(`[Cache Miss] ${key}`);
  
  try {
    // Execute handler to get fresh data
    const result = await handler();
    
    // Store in cache
    memoryCache.set(key, {
      data: result,
      expiry: now + (ttlSeconds * 1000)
    });

    // Return fresh result
    return result;
  } catch (error) {
    console.error(`[Cache Error] ${key}:`, error);
    throw error;
  }
}

/**
 * Invalidate a specific cache entry
 * 
 * @param {string} key - Cache key to invalidate
 */
export function invalidateCache(key) {
  memoryCache.delete(key);
  console.log(`[Cache Invalidated] ${key}`);
}

/**
 * Invalidate all cache entries with a specific prefix
 * 
 * @param {string} prefix - Prefix to match against cache keys
 */
export function invalidateCacheByPrefix(prefix) {
  let invalidatedCount = 0;
  
  memoryCache.forEach((_, key) => {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
      invalidatedCount++;
    }
  });
  
  console.log(`[Cache Invalidated] ${invalidatedCount} entries with prefix "${prefix}"`);
}

/**
 * Clear the entire cache
 */
export function clearCache() {
  const count = memoryCache.size;
  memoryCache.clear();
  console.log(`[Cache Cleared] ${count} entries removed`);
}
