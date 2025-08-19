// High-Performance Caching Service (Redis-style in-memory)
class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttlCache = new Map();
    this.accessTimes = new Map();
    this.hitCount = 0;
    this.missCount = 0;
    this.maxSize = 10000; // Maximum number of cached items
    
    // Start cleanup interval
    this.startCleanup();
  }

  // Set cache with TTL
  set(key, value, ttl = 3600) { // Default 1 hour TTL
    try {
      // Remove old entry if it exists
      this.delete(key);
      
      // Check cache size and evict if necessary
      if (this.cache.size >= this.maxSize) {
        this.evictLRU();
      }
      
      const serializedValue = JSON.stringify(value);
      const expiresAt = Date.now() + (ttl * 1000);
      
      this.cache.set(key, serializedValue);
      this.ttlCache.set(key, expiresAt);
      this.accessTimes.set(key, Date.now());
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Get from cache
  get(key) {
    try {
      if (!this.cache.has(key)) {
        this.missCount++;
        return null;
      }
      
      // Check if expired
      const expiresAt = this.ttlCache.get(key);
      if (expiresAt && Date.now() > expiresAt) {
        this.delete(key);
        this.missCount++;
        return null;
      }
      
      // Update access time for LRU
      this.accessTimes.set(key, Date.now());
      this.hitCount++;
      
      const serializedValue = this.cache.get(key);
      return JSON.parse(serializedValue);
    } catch (error) {
      console.error('Cache get error:', error);
      this.missCount++;
      return null;
    }
  }

  // Delete from cache
  delete(key) {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    this.ttlCache.delete(key);
    this.accessTimes.delete(key);
    return existed;
  }

  // Check if key exists and is not expired
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    const expiresAt = this.ttlCache.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.ttlCache.clear();
    this.accessTimes.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  // Get cache statistics
  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total > 0 ? Math.round((this.hitCount / total) * 100 * 100) / 100 : 0,
      memoryUsage: this.getMemoryUsage()
    };
  }

  // Estimate memory usage
  getMemoryUsage() {
    let totalSize = 0;
    for (const [key, value] of this.cache) {
      totalSize += key.length * 2; // String keys (UTF-16)
      totalSize += value.length * 2; // String values
    }
    return Math.round(totalSize / 1024); // Return in KB
  }

  // LRU eviction
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, accessTime] of this.accessTimes) {
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, expiresAt] of this.ttlCache) {
      if (expiresAt && now > expiresAt) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
    
    return expiredKeys.length;
  }

  // Start automatic cleanup
  startCleanup() {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const cleaned = this.cleanup();
      if (cleaned > 0) {
        console.log(`Cache cleanup: removed ${cleaned} expired entries`);
      }
    }, 5 * 60 * 1000);
  }

  // Cache middleware for Express
  middleware(options = {}) {
    const defaultTTL = options.ttl || 300; // 5 minutes default
    const keyGenerator = options.keyGenerator || ((req) => `${req.method}:${req.originalUrl}`);
    
    return (req, res, next) => {
      // Skip caching for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }
      
      const cacheKey = keyGenerator(req);
      const cachedData = this.get(cacheKey);
      
      if (cachedData) {
        // Add cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        
        return res.json(cachedData);
      }
      
      // Capture original json method
      const originalJson = res.json.bind(res);
      
      res.json = (data) => {
        // Cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.set(cacheKey, data, defaultTTL);
        }
        
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);
        
        return originalJson(data);
      };
      
      next();
    };
  }

  // Invalidate cache by pattern
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }

  // Bulk operations
  mget(keys) {
    const results = {};
    keys.forEach(key => {
      const value = this.get(key);
      if (value !== null) {
        results[key] = value;
      }
    });
    return results;
  }

  mset(keyValuePairs, ttl = 3600) {
    let successCount = 0;
    for (const [key, value] of Object.entries(keyValuePairs)) {
      if (this.set(key, value, ttl)) {
        successCount++;
      }
    }
    return successCount;
  }

  // Get keys by pattern
  keys(pattern) {
    const regex = new RegExp(pattern);
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  // Cache warming for frequently accessed data (non-blocking)
  warmCache() {
    console.log('Starting cache warm-up...');
    
    // Use setTimeout to make warming non-blocking and avoid immediate database queries
    setTimeout(async () => {
      try {
        // Warm up expert data
        await this.warmExpertData();
        
        // Warm up platform stats
        await this.warmPlatformStats();
        
        console.log('Cache warm-up completed');
      } catch (error) {
        console.error('Cache warm-up failed:', error.message);
      }
    }, 1000); // Wait 1 second for DB to be ready
  }

  async warmExpertData() {
    try {
      const Expert = require('../models/Expert');
      const experts = await Expert.find({ verified: true }).limit(50);
      
      experts.forEach(expert => {
        this.set(`expert:${expert.id}`, expert.toObject(), 1800); // 30 minutes
      });
      
      console.log(`Warmed cache with ${experts.length} expert profiles`);
    } catch (error) {
      console.error('Error warming expert cache:', error);
    }
  }

  async warmPlatformStats() {
    try {
      const User = require('../models/User');
      const Expert = require('../models/Expert');
      
      const totalUsers = await User.countDocuments();
      const totalExperts = await Expert.countDocuments();
      const verifiedExperts = await Expert.countDocuments({ verified: true });
      
      this.set('stats:users:total', totalUsers, 300); // 5 minutes
      this.set('stats:experts:total', totalExperts, 300);
      this.set('stats:experts:verified', verifiedExperts, 300);
      
      console.log('Warmed cache with platform statistics');
    } catch (error) {
      console.error('Error warming platform stats cache:', error);
    }
  }
}

module.exports = new CacheService();