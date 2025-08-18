// FAANG-Level Health Monitoring & APM Service
const mongoose = require('mongoose');
const { getIO } = require('../socket/socketHandler');
const os = require('os');
const fs = require('fs').promises;

class HealthMonitor {
  constructor() {
    this.metrics = {
      requests: new Map(),
      errors: new Map(),
      performance: new Map(),
      connections: new Map()
    };
    this.startTime = Date.now();
    this.alerts = [];
    
    // Start monitoring
    this.startMetricsCollection();
  }

  // Enhanced Health Check with detailed system information
  async getDetailedHealth() {
    try {
      const now = Date.now();
      const uptime = now - this.startTime;
      
      // Database health check
      const dbHealth = await this.checkDatabaseHealth();
      
      // Socket health check
      const socketHealth = await this.checkSocketHealth();
      
      // System health check
      const systemHealth = await this.checkSystemHealth();
      
      // Performance metrics
      const performanceMetrics = this.getPerformanceMetrics();
      
      // Overall health assessment
      const overallHealth = this.assessOverallHealth(dbHealth, socketHealth, systemHealth);
      
      return {
        status: overallHealth.status,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime / 1000),
        checks: {
          database: dbHealth,
          websocket: socketHealth,
          system: systemHealth
        },
        metrics: performanceMetrics,
        alerts: this.getActiveAlerts(),
        version: process.env.npm_package_version || '1.0.0'
      };
    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Database health assessment
  async checkDatabaseHealth() {
    try {
      const startTime = Date.now();
      
      // Connection status
      const connectionState = mongoose.connection.readyState;
      const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
      
      // Test query performance
      const testStart = Date.now();
      await mongoose.connection.db.admin().ping();
      const queryTime = Date.now() - testStart;
      
      // Connection pool stats
      const connections = mongoose.connection.db.serverConfig?.connections || {};
      
      // Database size info
      const stats = await mongoose.connection.db.stats();
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: connectionState === 1 ? 'healthy' : 'unhealthy',
        connection: stateMap[connectionState],
        responseTime,
        queryTime,
        connections: {
          available: connections.available || 0,
          created: connections.created || 0,
          destroyed: connections.destroyed || 0
        },
        database: {
          collections: stats.collections,
          dataSize: Math.round(stats.dataSize / 1024 / 1024 * 100) / 100, // MB
          storageSize: Math.round(stats.storageSize / 1024 / 1024 * 100) / 100, // MB
          indexes: stats.indexes
        }
      };
    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        responseTime: null
      };
    }
  }

  // WebSocket health assessment
  async checkSocketHealth() {
    try {
      const io = getIO();
      const sockets = io.sockets.sockets;
      
      const stats = {
        connectedSockets: sockets.size,
        roomCounts: {},
        namespaces: io._nsps.size
      };
      
      // Count participants in different room types
      let chatRooms = 0, sanctuaryRooms = 0, audioRooms = 0;
      
      sockets.forEach(socket => {
        if (socket.currentChatSession) chatRooms++;
        if (socket.currentSanctuary) sanctuaryRooms++;
        if (socket.currentAudioRoom) audioRooms++;
      });
      
      stats.roomCounts = { chatRooms, sanctuaryRooms, audioRooms };
      
      return {
        status: 'healthy',
        ...stats,
        memoryUsage: process.memoryUsage()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // System health assessment
  async checkSystemHealth() {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const systemMem = {
        total: os.totalmem(),
        free: os.freemem()
      };
      
      // Disk usage (if possible)
      let diskUsage = null;
      try {
        const stats = await fs.stat('.');
        diskUsage = { available: stats.size };
      } catch (e) {
        // Disk stats not available on all systems
      }
      
      const loadAvg = os.loadavg();
      
      return {
        status: 'healthy',
        cpu: {
          usage: cpuUsage,
          loadAverage: loadAvg,
          cores: os.cpus().length
        },
        memory: {
          process: {
            rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
            external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100
          },
          system: {
            total: Math.round(systemMem.total / 1024 / 1024 / 1024 * 100) / 100,
            free: Math.round(systemMem.free / 1024 / 1024 / 1024 * 100) / 100,
            used: Math.round((systemMem.total - systemMem.free) / 1024 / 1024 / 1024 * 100) / 100
          }
        },
        disk: diskUsage,
        platform: {
          type: os.type(),
          release: os.release(),
          arch: os.arch(),
          nodeVersion: process.version
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // Performance metrics collection
  recordRequestMetric(method, path, responseTime, statusCode) {
    const key = `${method} ${path}`;
    const minute = Math.floor(Date.now() / 60000);
    
    if (!this.metrics.requests.has(minute)) {
      this.metrics.requests.set(minute, new Map());
    }
    
    const minuteMetrics = this.metrics.requests.get(minute);
    if (!minuteMetrics.has(key)) {
      minuteMetrics.set(key, { count: 0, totalTime: 0, statuses: {} });
    }
    
    const metric = minuteMetrics.get(key);
    metric.count++;
    metric.totalTime += responseTime;
    metric.statuses[statusCode] = (metric.statuses[statusCode] || 0) + 1;
    
    // Record error if status >= 400
    if (statusCode >= 400) {
      this.recordError(method, path, statusCode, responseTime);
    }
    
    // Clean old metrics (keep last hour)
    const cutoff = minute - 60;
    for (const [time] of this.metrics.requests) {
      if (time < cutoff) {
        this.metrics.requests.delete(time);
      }
    }
  }

  // Error tracking
  recordError(method, path, statusCode, responseTime, error = null) {
    const key = `${method} ${path}`;
    const minute = Math.floor(Date.now() / 60000);
    
    if (!this.metrics.errors.has(minute)) {
      this.metrics.errors.set(minute, new Map());
    }
    
    const minuteErrors = this.metrics.errors.get(minute);
    if (!minuteErrors.has(key)) {
      minuteErrors.set(key, { count: 0, statuses: {}, errors: [] });
    }
    
    const errorMetric = minuteErrors.get(key);
    errorMetric.count++;
    errorMetric.statuses[statusCode] = (errorMetric.statuses[statusCode] || 0) + 1;
    
    if (error) {
      errorMetric.errors.push({
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Generate alert for high error rates
    if (errorMetric.count > 10) {
      this.generateAlert('high_error_rate', `High error rate detected for ${key}: ${errorMetric.count} errors in 1 minute`);
    }
  }

  // Get performance metrics summary
  getPerformanceMetrics() {
    const now = Math.floor(Date.now() / 60000);
    const metrics = {
      requests: {
        lastMinute: 0,
        lastHour: 0,
        averageResponseTime: 0,
        errorRate: 0
      },
      topEndpoints: [],
      slowEndpoints: [],
      errorSummary: {}
    };
    
    let totalRequests = 0;
    let totalTime = 0;
    let totalErrors = 0;
    const endpointStats = new Map();
    
    // Analyze last hour of data
    for (let i = 0; i < 60; i++) {
      const minute = now - i;
      const requestsData = this.metrics.requests.get(minute);
      const errorsData = this.metrics.errors.get(minute);
      
      if (requestsData) {
        for (const [endpoint, data] of requestsData) {
          totalRequests += data.count;
          totalTime += data.totalTime;
          
          if (!endpointStats.has(endpoint)) {
            endpointStats.set(endpoint, { requests: 0, totalTime: 0, errors: 0 });
          }
          
          const stat = endpointStats.get(endpoint);
          stat.requests += data.count;
          stat.totalTime += data.totalTime;
          
          if (i === 0) {
            metrics.requests.lastMinute += data.count;
          }
        }
      }
      
      if (errorsData) {
        for (const [endpoint, data] of errorsData) {
          totalErrors += data.count;
          
          if (endpointStats.has(endpoint)) {
            endpointStats.get(endpoint).errors += data.count;
          }
        }
      }
    }
    
    metrics.requests.lastHour = totalRequests;
    metrics.requests.averageResponseTime = totalRequests > 0 ? Math.round(totalTime / totalRequests) : 0;
    metrics.requests.errorRate = totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 100 * 100) / 100 : 0;
    
    // Top endpoints by request count
    metrics.topEndpoints = Array.from(endpointStats.entries())
      .sort((a, b) => b[1].requests - a[1].requests)
      .slice(0, 10)
      .map(([endpoint, data]) => ({
        endpoint,
        requests: data.requests,
        avgResponseTime: Math.round(data.totalTime / data.requests),
        errorRate: Math.round((data.errors / data.requests) * 100 * 100) / 100
      }));
    
    // Slowest endpoints
    metrics.slowEndpoints = Array.from(endpointStats.entries())
      .filter(([, data]) => data.requests > 0)
      .sort((a, b) => (b[1].totalTime / b[1].requests) - (a[1].totalTime / a[1].requests))
      .slice(0, 5)
      .map(([endpoint, data]) => ({
        endpoint,
        avgResponseTime: Math.round(data.totalTime / data.requests),
        requests: data.requests
      }));
    
    return metrics;
  }

  // Alert management
  generateAlert(type, message, severity = 'warning') {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      severity,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };
    
    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    console.log(`ALERT [${severity.toUpperCase()}]: ${message}`);
    
    return alert;
  }

  getActiveAlerts() {
    return this.alerts.filter(alert => !alert.acknowledged).slice(-20);
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  // Overall health assessment
  assessOverallHealth(dbHealth, socketHealth, systemHealth) {
    const issues = [];
    let status = 'healthy';
    
    if (dbHealth.status !== 'healthy') {
      issues.push('Database connectivity issues');
      status = 'critical';
    }
    
    if (socketHealth.status !== 'healthy') {
      issues.push('WebSocket issues');
      if (status !== 'critical') status = 'warning';
    }
    
    if (systemHealth.status !== 'healthy') {
      issues.push('System resource issues');
      if (status !== 'critical') status = 'warning';
    }
    
    // Check system resource thresholds
    if (systemHealth.memory?.system?.used > systemHealth.memory?.system?.total * 0.9) {
      issues.push('High memory usage');
      if (status === 'healthy') status = 'warning';
    }
    
    if (systemHealth.cpu?.loadAverage?.[0] > systemHealth.cpu?.cores * 2) {
      issues.push('High CPU load');
      if (status === 'healthy') status = 'warning';
    }
    
    return { status, issues };
  }

  // Start metrics collection
  startMetricsCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);
    
    // Clean old data every 5 minutes
    setInterval(() => {
      this.cleanOldMetrics();
    }, 300000);
  }

  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const minute = Math.floor(Date.now() / 60000);
    
    if (!this.metrics.performance.has(minute)) {
      this.metrics.performance.set(minute, {
        memory: memUsage,
        cpu: process.cpuUsage(),
        timestamp: new Date().toISOString()
      });
    }
  }

  cleanOldMetrics() {
    const cutoff = Math.floor(Date.now() / 60000) - 120; // Keep 2 hours
    
    for (const metricMap of [this.metrics.requests, this.metrics.errors, this.metrics.performance]) {
      for (const [time] of metricMap) {
        if (time < cutoff) {
          metricMap.delete(time);
        }
      }
    }
  }
}

module.exports = new HealthMonitor();
