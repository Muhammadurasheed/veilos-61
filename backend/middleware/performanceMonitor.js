// Performance Monitoring Middleware - FAANG Level APM
const healthMonitor = require('../services/healthMonitor');

// Request performance tracking middleware
const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const startCpuUsage = process.cpuUsage();
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override res.end to capture metrics
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const cpuUsage = process.cpuUsage(startCpuUsage);
    
    // Record request metrics
    healthMonitor.recordRequestMetric(
      req.method,
      req.route?.path || req.path || req.url,
      responseTime,
      res.statusCode
    );
    
    // Log slow requests (>1000ms)
    if (responseTime > 1000) {
      console.warn(`SLOW REQUEST: ${req.method} ${req.url} - ${responseTime}ms`);
      
      healthMonitor.generateAlert(
        'slow_request',
        `Slow request detected: ${req.method} ${req.url} took ${responseTime}ms`,
        'warning'
      );
    }
    
    // Log high CPU usage requests
    const totalCpuTime = (cpuUsage.user + cpuUsage.system) / 1000; // Convert to ms
    if (totalCpuTime > 100) {
      console.warn(`HIGH CPU REQUEST: ${req.method} ${req.url} - ${totalCpuTime}ms CPU`);
    }
    
    // Add performance headers in development
    if (process.env.NODE_ENV === 'development') {
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      res.setHeader('X-CPU-Time', `${totalCpuTime}ms`);
    }
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error tracking middleware
const errorTrackingMiddleware = (err, req, res, next) => {
  const responseTime = Date.now() - (req.startTime || Date.now());
  
  // Record error
  healthMonitor.recordError(
    req.method,
    req.route?.path || req.path || req.url,
    err.statusCode || 500,
    responseTime,
    err
  );
  
  // Generate alert for critical errors
  if (err.statusCode >= 500) {
    healthMonitor.generateAlert(
      'server_error',
      `Server error: ${err.message} on ${req.method} ${req.url}`,
      'error'
    );
  }
  
  next(err);
};

// Database performance monitoring (Fixed to prevent memory leaks)
let dbMonitoringInitialized = false;

const dbPerformanceMiddleware = () => {
  // Prevent multiple initialization
  if (dbMonitoringInitialized) {
    return;
  }
  
  const mongoose = require('mongoose');
  
  // Monitor slow queries (only in development)
  if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', (collectionName, method, query, doc, options) => {
      console.log(`MongoDB Query: ${collectionName}.${method}`, query);
    });
  }
  
  dbMonitoringInitialized = true;
};

// Memory usage monitoring
const memoryMonitor = () => {
  const checkMemoryUsage = () => {
    const usage = process.memoryUsage();
    const totalMB = Math.round(usage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    
    // Alert on high memory usage (>500MB RSS or >80% heap)
    if (totalMB > 500) {
      healthMonitor.generateAlert(
        'high_memory',
        `High memory usage: ${totalMB}MB RSS`,
        'warning'
      );
    }
    
    if (usage.heapUsed / usage.heapTotal > 0.8) {
      healthMonitor.generateAlert(
        'heap_pressure',
        `High heap usage: ${heapUsedMB}MB (${Math.round(usage.heapUsed / usage.heapTotal * 100)}%)`,
        'warning'
      );
    }
  };
  
  // Check memory every 60 seconds
  setInterval(checkMemoryUsage, 60000);
  
  // Immediate check
  checkMemoryUsage();
};

// Connection monitoring (Lazy-loaded to prevent circular dependencies)
let connectionMonitorInterval = null;

const connectionMonitor = () => {
  // Prevent multiple intervals
  if (connectionMonitorInterval) {
    return;
  }
  
  const checkConnections = () => {
    try {
      // Lazy-load to prevent circular dependency
      const { getIO } = require('../socket/socketHandler');
      const io = getIO();
      const connectedSockets = io.sockets.sockets.size;
      
      // Alert on high connection count
      if (connectedSockets > 1000) {
        // Lazy-load healthMonitor to prevent circular dependency
        const healthMonitor = require('../services/healthMonitor');
        healthMonitor.generateAlert(
          'high_connections',
          `High socket connection count: ${connectedSockets}`,
          'warning'
        );
      }
      
      // Log connection metrics
      if (process.env.NODE_ENV === 'development') {
        console.log(`Active WebSocket connections: ${connectedSockets}`);
      }
    } catch (error) {
      // Socket not initialized yet, silently ignore
    }
  };
  
  // Check connections every 2 minutes
  connectionMonitorInterval = setInterval(checkConnections, 120000);
};

// Initialize all monitoring
const initializeMonitoring = () => {
  dbPerformanceMiddleware();
  memoryMonitor();
  connectionMonitor();
  
  console.log('Performance monitoring initialized');
};

module.exports = {
  performanceMiddleware,
  errorTrackingMiddleware,
  initializeMonitoring
};