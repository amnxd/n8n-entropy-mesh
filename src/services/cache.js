/**
 * Redis Caching Layer
 * 
 * Optional caching system for:
 * - Provider availability (5 min)
 * - User session state (backup to DB)
 * - Quote rankings (1 min)
 * 
 * Falls back gracefully if Redis not available
 */

let redis;
let enabled = false;

function initRedis(redisUrl) {
  try {
    const { createClient } = require('redis');
    
    const client = createClient({
      url: redisUrl || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
    });

    client.on('connect', () => {
      console.log('✅ Redis connected');
      enabled = true;
    });

    client.on('error', (error) => {
      console.warn('⚠️  Redis error:', error.message);
      enabled = false;
    });

    client.connect().catch(error => {
      console.warn('⚠️  Could not connect to Redis:', error.message);
      enabled = false;
    });

    redis = client;
    return client;
  } catch (error) {
    console.warn('⚠️  Redis not available:', error.message);
    enabled = false;
    return null;
  }
}

/**
 * Get cached value
 */
async function get(key) {
  if (!enabled || !redis) return null;
  
  try {
    const value = await redis.get(key);
    if (value) {
      console.log(`✓ Cache hit: ${key}`);
      return JSON.parse(value);
    }
    return null;
  } catch (error) {
    console.warn(`Cache get error (${key}):`, error.message);
    return null;
  }
}

/**
 * Set cached value with TTL
 */
async function set(key, value, ttlSeconds = 300) {
  if (!enabled || !redis) return false;

  try {
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
    console.log(`📌 Cached: ${key} (TTL: ${ttlSeconds}s)`);
    return true;
  } catch (error) {
    console.warn(`Cache set error (${key}):`, error.message);
    return false;
  }
}

/**
 * Delete cached value
 */
async function del(key) {
  if (!enabled || !redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.warn(`Cache delete error (${key}):`, error.message);
    return false;
  }
}

/**
 * Clear all cache (use with caution!)
 */
async function flush() {
  if (!enabled || !redis) return false;

  try {
    await redis.flushDb();
    console.log('🗑️  Cache cleared');
    return true;
  } catch (error) {
    console.warn('Cache flush error:', error.message);
    return false;
  }
}

/**
 * Cache keys helper functions
 */
const keys = {
  provider: (type) => `provider:available:${type}`,
  providers: (type) => `providers:list:${type}`,
  userState: (phone) => `user:state:${phone}`,
  request: (requestId) => `request:${requestId}`,
  quoteRank: (requestId) => `quotes:ranked:${requestId}`
};

/**
 * Cache provider availability by type
 */
async function cacheProvidersByType(type, providers, ttl = 300) {
  return set(keys.providers(type), providers, ttl);
}

/**
 * Get cached providers by type
 */
async function getCachedProvidersByType(type) {
  return get(keys.providers(type));
}

/**
 * Cache user conversation state
 */
async function cacheUserState(phone, state, ttl = 3600) {
  return set(keys.userState(phone), state, ttl);
}

/**
 * Get cached user state
 */
async function getCachedUserState(phone) {
  return get(keys.userState(phone));
}

/**
 * Cache ranked quotes
 */
async function cacheRankedQuotes(requestId, quotes, ttl = 60) {
  return set(keys.quoteRank(requestId), quotes, ttl);
}

/**
 * Get cached ranked quotes
 */
async function getCachedRankedQuotes(requestId) {
  return get(keys.quoteRank(requestId));
}

/**
 * Invalidate all caches for a request
 */
async function invalidateRequest(requestId) {
  await del(keys.request(requestId));
  await del(keys.quoteRank(requestId));
}

/**
 * Invalidate provider cache by type
 */
async function invalidateProviders(type) {
  await del(keys.providers(type));
}

/**
 * Get cache stats
 */
async function getStats() {
  if (!enabled || !redis) return null;

  try {
    const info = await redis.info('stats');
    return info;
  } catch (error) {
    console.warn('Cache stats error:', error.message);
    return null;
  }
}

/**
 * Graceful shutdown
 */
async function close() {
  if (redis) {
    await redis.quit();
    console.log('Redis connection closed');
  }
}

module.exports = {
  initRedis,
  get,
  set,
  del,
  flush,
  keys,
  cacheProvidersByType,
  getCachedProvidersByType,
  cacheUserState,
  getCachedUserState,
  cacheRankedQuotes,
  getCachedRankedQuotes,
  invalidateRequest,
  invalidateProviders,
  getStats,
  close,
  isEnabled: () => enabled
};
