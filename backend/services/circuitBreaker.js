// Circuit Breaker Pattern Implementation for High Reliability
class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringWindow = options.monitoringWindow || 120000; // 2 minutes
    this.expectedResponseTime = options.expectedResponseTime || 1000; // 1 second
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = [];
    this.lastFailureTime = null;
    this.nextAttempt = null;
    this.successCount = 0;
    this.requestCount = 0;
    
    // Callbacks
    this.onStateChange = options.onStateChange || (() => {});
    this.onFailure = options.onFailure || (() => {});
    this.onSuccess = options.onSuccess || (() => {});
  }

  async execute(operation, fallback = null) {
    this.requestCount++;
    
    if (this.state === 'OPEN') {
      if (this.canAttemptRetry()) {
        this.state = 'HALF_OPEN';
        this.onStateChange(this.name, 'HALF_OPEN');
        console.log(`Circuit breaker ${this.name} entering HALF_OPEN state`);
      } else {
        // Circuit is open, return fallback or throw
        if (fallback) {
          return await fallback();
        }
        throw new Error(`Circuit breaker ${this.name} is OPEN. Service unavailable.`);
      }
    }
    
    try {
      const startTime = Date.now();
      const result = await operation();
      const responseTime = Date.now() - startTime;
      
      // Check if response time is acceptable
      if (responseTime > this.expectedResponseTime) {
        console.warn(`Circuit breaker ${this.name}: Slow response (${responseTime}ms)`);
      }
      
      this.onSuccess(this.name, responseTime);
      return this.handleSuccess(result);
      
    } catch (error) {
      this.onFailure(this.name, error);
      return this.handleFailure(error, fallback);
    }
  }

  handleSuccess(result) {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      
      // If we have enough successful requests, close the circuit
      if (this.successCount >= 3) {
        this.reset();
        console.log(`Circuit breaker ${this.name} returning to CLOSED state`);
      }
    }
    
    return result;
  }

  async handleFailure(error, fallback) {
    const now = Date.now();
    this.failures.push(now);
    this.lastFailureTime = now;
    
    // Clean old failures outside monitoring window
    this.failures = this.failures.filter(
      timestamp => now - timestamp < this.monitoringWindow
    );
    
    // Check if we should open the circuit
    if (this.failures.length >= this.failureThreshold) {
      this.trip();
    }
    
    // Return fallback or throw
    if (fallback) {
      try {
        return await fallback();
      } catch (fallbackError) {
        console.error(`Circuit breaker ${this.name}: Fallback also failed:`, fallbackError);
        throw error; // Throw original error
      }
    }
    
    throw error;
  }

  trip() {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.recoveryTimeout;
    this.successCount = 0;
    this.onStateChange(this.name, 'OPEN');
    
    console.error(`Circuit breaker ${this.name} OPENED due to ${this.failures.length} failures`);
    
    // Generate alert
    const healthMonitor = require('./healthMonitor');
    healthMonitor.generateAlert(
      'circuit_breaker_open',
      `Circuit breaker ${this.name} opened due to repeated failures`,
      'error'
    );
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = [];
    this.lastFailureTime = null;
    this.nextAttempt = null;
    this.successCount = 0;
    this.onStateChange(this.name, 'CLOSED');
  }

  canAttemptRetry() {
    return this.nextAttempt && Date.now() >= this.nextAttempt;
  }

  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failures.length,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt,
      successCount: this.successCount,
      requestCount: this.requestCount,
      failureRate: this.requestCount > 0 ? 
        Math.round((this.failures.length / this.requestCount) * 100 * 100) / 100 : 0
    };
  }
}

// Circuit Breaker Manager
class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
  }

  createBreaker(name, options = {}) {
    if (this.breakers.has(name)) {
      return this.breakers.get(name);
    }
    
    const breaker = new CircuitBreaker(name, {
      ...options,
      onStateChange: (name, state) => {
        console.log(`Circuit Breaker ${name} state changed to ${state}`);
        if (options.onStateChange) {
          options.onStateChange(name, state);
        }
      }
    });
    
    this.breakers.set(name, breaker);
    return breaker;
  }

  getBreaker(name) {
    return this.breakers.get(name);
  }

  getAllBreakers() {
    const states = {};
    for (const [name, breaker] of this.breakers) {
      states[name] = breaker.getState();
    }
    return states;
  }

  // Database circuit breaker wrapper
  wrapDatabaseOperation(operation, collectionName = 'database') {
    const breaker = this.createBreaker(`db_${collectionName}`, {
      failureThreshold: 3,
      recoveryTimeout: 30000,
      expectedResponseTime: 500
    });
    
    return breaker.execute(operation, async () => {
      // Fallback: return cached data or empty result
      const cacheService = require('./cacheService');
      const cached = cacheService.get(`fallback_${collectionName}`);
      
      if (cached) {
        console.log(`Using cached fallback for ${collectionName}`);
        return cached;
      }
      
      // Return empty result structure
      return { data: [], success: false, fallback: true };
    });
  }

  // External API circuit breaker wrapper
  wrapExternalAPI(operation, serviceName) {
    const breaker = this.createBreaker(`api_${serviceName}`, {
      failureThreshold: 5,
      recoveryTimeout: 60000,
      expectedResponseTime: 2000
    });
    
    return breaker.execute(operation, async () => {
      console.log(`${serviceName} API unavailable, using fallback`);
      return { success: false, fallback: true, service: serviceName };
    });
  }

  // WebSocket circuit breaker wrapper
  wrapSocketOperation(operation, socketType = 'websocket') {
    const breaker = this.createBreaker(`socket_${socketType}`, {
      failureThreshold: 10,
      recoveryTimeout: 15000,
      expectedResponseTime: 100
    });
    
    return breaker.execute(operation, async () => {
      console.log(`Socket ${socketType} operation failed, using fallback`);
      return { success: false, fallback: true };
    });
  }

  // Graceful degradation middleware
  gracefulDegradationMiddleware(serviceName, fallbackResponse = null) {
    return async (req, res, next) => {
      const breaker = this.createBreaker(`middleware_${serviceName}`, {
        failureThreshold: 5,
        recoveryTimeout: 30000
      });
      
      try {
        await breaker.execute(async () => {
          // Execute next middleware
          return new Promise((resolve, reject) => {
            const originalSend = res.send.bind(res);
            const originalJson = res.json.bind(res);
            
            // Intercept response to detect failures
            res.send = function(data) {
              if (res.statusCode >= 500) {
                reject(new Error(`HTTP ${res.statusCode}`));
              } else {
                resolve(data);
              }
              return originalSend(data);
            };
            
            res.json = function(data) {
              if (res.statusCode >= 500) {
                reject(new Error(`HTTP ${res.statusCode}`));
              } else {
                resolve(data);
              }
              return originalJson(data);
            };
            
            next();
          });
        }, async () => {
          // Fallback response
          if (fallbackResponse) {
            return res.status(503).json({
              success: false,
              error: `${serviceName} temporarily unavailable`,
              fallback: true,
              data: fallbackResponse
            });
          }
          
          return res.status(503).json({
            success: false,
            error: `${serviceName} temporarily unavailable`,
            fallback: true
          });
        });
      } catch (error) {
        console.error(`Circuit breaker middleware error for ${serviceName}:`, error);
        
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            error: 'Service temporarily unavailable',
            fallback: true
          });
        }
      }
    };
  }

  // Health check for all circuit breakers
  getHealthStatus() {
    const breakers = this.getAllBreakers();
    const openBreakers = Object.values(breakers).filter(b => b.state === 'OPEN');
    const halfOpenBreakers = Object.values(breakers).filter(b => b.state === 'HALF_OPEN');
    
    let overallHealth = 'healthy';
    
    if (openBreakers.length > 0) {
      overallHealth = 'degraded';
    }
    
    if (openBreakers.length > Object.keys(breakers).length * 0.5) {
      overallHealth = 'critical';
    }
    
    return {
      overall: overallHealth,
      totalBreakers: Object.keys(breakers).length,
      openBreakers: openBreakers.length,
      halfOpenBreakers: halfOpenBreakers.length,
      closedBreakers: Object.keys(breakers).length - openBreakers.length - halfOpenBreakers.length,
      breakers
    };
  }
}

module.exports = new CircuitBreakerManager();