// FAANG-Level Health & Monitoring Endpoints
const express = require('express');
const router = express.Router();
const healthMonitor = require('../services/healthMonitor');
const cacheService = require('../services/cacheService');
const auditLogger = require('../services/auditLogger');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Basic health check (public)
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Detailed health check (admin only)
router.get('/health/detailed', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const healthData = await healthMonitor.getDetailedHealth();
    
    // Log admin access
    await auditLogger.logAdminAction(
      req.user.id,
      'view_detailed_health',
      'system_health',
      { endpoint: '/health/detailed' },
      req.ip
    );
    
    res.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve health data',
      message: error.message
    });
  }
});

// Performance metrics endpoint
router.get('/metrics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const performanceMetrics = healthMonitor.getPerformanceMetrics();
    const cacheStats = cacheService.getStats();
    
    // Add system-level metrics
    const systemMetrics = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform
    };
    
    await auditLogger.logAdminAction(
      req.user.id,
      'view_metrics',
      'system_metrics',
      { endpoint: '/metrics' },
      req.ip
    );
    
    res.json({
      success: true,
      data: {
        performance: performanceMetrics,
        cache: cacheStats,
        system: systemMetrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
      message: error.message
    });
  }
});

// System alerts endpoint
router.get('/alerts', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const alerts = healthMonitor.getActiveAlerts();
    
    await auditLogger.logAdminAction(
      req.user.id,
      'view_alerts',
      'system_alerts',
      { alertCount: alerts.length },
      req.ip
    );
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts',
      message: error.message
    });
  }
});

// Acknowledge alert
router.post('/alerts/:alertId/acknowledge', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { alertId } = req.params;
    const acknowledged = healthMonitor.acknowledgeAlert(alertId);
    
    await auditLogger.logAdminAction(
      req.user.id,
      'acknowledge_alert',
      'system_alert',
      { alertId, success: acknowledged },
      req.ip
    );
    
    if (acknowledged) {
      res.json({
        success: true,
        message: 'Alert acknowledged successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert',
      message: error.message
    });
  }
});

// Cache statistics and management
router.get('/cache/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = cacheService.getStats();
    
    await auditLogger.logAdminAction(
      req.user.id,
      'view_cache_stats',
      'cache_system',
      stats,
      req.ip
    );
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache stats',
      message: error.message
    });
  }
});

// Clear cache
router.post('/cache/clear', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { pattern } = req.body;
    
    let clearedCount;
    if (pattern) {
      clearedCount = cacheService.invalidatePattern(pattern);
    } else {
      cacheService.clear();
      clearedCount = 'all';
    }
    
    await auditLogger.logAdminAction(
      req.user.id,
      'clear_cache',
      'cache_system',
      { pattern, clearedCount },
      req.ip
    );
    
    res.json({
      success: true,
      message: `Cache cleared successfully`,
      clearedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

// Warm cache
router.post('/cache/warm', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await cacheService.warmCache();
    
    await auditLogger.logAdminAction(
      req.user.id,
      'warm_cache',
      'cache_system',
      { endpoint: '/cache/warm' },
      req.ip
    );
    
    res.json({
      success: true,
      message: 'Cache warming initiated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to warm cache',
      message: error.message
    });
  }
});

// Audit logs endpoint
router.get('/audit-logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      type,
      userId,
      adminId,
      action,
      dateFrom,
      dateTo,
      limit = 100,
      offset = 0
    } = req.query;
    
    const filters = {
      type,
      userId,
      adminId,
      action,
      dateFrom,
      dateTo
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    const auditData = await auditLogger.getAuditLogs(
      filters,
      parseInt(limit),
      parseInt(offset)
    );
    
    await auditLogger.logAdminAction(
      req.user.id,
      'view_audit_logs',
      'audit_system',
      { filters, limit, offset },
      req.ip
    );
    
    res.json({
      success: true,
      data: auditData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit logs',
      message: error.message
    });
  }
});

// Security summary
router.get('/security/summary', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const summary = await auditLogger.getSecuritySummary(timeframe);
    
    await auditLogger.logAdminAction(
      req.user.id,
      'view_security_summary',
      'security_system',
      { timeframe },
      req.ip
    );
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve security summary',
      message: error.message
    });
  }
});

// Export audit logs
router.get('/audit-logs/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      type,
      userId,
      adminId,
      action,
      dateFrom,
      dateTo,
      format = 'json'
    } = req.query;
    
    const filters = {
      type,
      userId,
      adminId,
      action,
      dateFrom,
      dateTo
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    const exportData = await auditLogger.exportLogs(filters, format);
    
    await auditLogger.logAdminAction(
      req.user.id,
      'export_audit_logs',
      'audit_system',
      { filters, format, size: exportData.length },
      req.ip
    );
    
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    const filename = `veilo_audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs',
      message: error.message
    });
  }
});

// Database performance insights
router.get('/database/performance', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connection = mongoose.connection;
    
    // Get connection pool stats
    const poolStats = {
      readyState: connection.readyState,
      host: connection.host,
      port: connection.port,
      name: connection.name
    };
    
    // Get database stats
    const dbStats = await connection.db.stats();
    
    await auditLogger.logAdminAction(
      req.user.id,
      'view_db_performance',
      'database_system',
      { endpoint: '/database/performance' },
      req.ip
    );
    
    res.json({
      success: true,
      data: {
        connection: poolStats,
        statistics: {
          collections: dbStats.collections,
          dataSize: Math.round(dbStats.dataSize / 1024 / 1024 * 100) / 100, // MB
          storageSize: Math.round(dbStats.storageSize / 1024 / 1024 * 100) / 100, // MB
          indexes: dbStats.indexes,
          indexSize: Math.round(dbStats.indexSize / 1024 / 1024 * 100) / 100, // MB
          objects: dbStats.objects,
          avgObjSize: Math.round(dbStats.avgObjSize)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve database performance data',
      message: error.message
    });
  }
});

module.exports = router;