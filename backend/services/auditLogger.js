// Enterprise-Grade Audit Logging Service
const fs = require('fs').promises;
const path = require('path');

class AuditLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
    this.auditLogs = [];
    this.maxInMemoryLogs = 1000;
  }

  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Error creating log directory:', error);
    }
  }

  // Log admin actions
  async logAdminAction(adminId, action, target, details = {}, ipAddress = null) {
    const logEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'admin_action',
      adminId,
      action,
      target,
      details,
      ipAddress,
      userAgent: details.userAgent || null,
      success: true
    };

    await this.writeAuditLog(logEntry);
    return logEntry;
  }

  // Log authentication events
  async logAuthEvent(userId, event, success, details = {}, ipAddress = null) {
    const logEntry = {
      id: `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'authentication',
      userId,
      event, // 'login', 'logout', 'login_failed', 'password_change', etc.
      success,
      details,
      ipAddress,
      userAgent: details.userAgent || null
    };

    await this.writeAuditLog(logEntry);
    
    // Generate security alerts for suspicious activities
    if (!success && event === 'login') {
      await this.checkForBruteForce(userId, ipAddress);
    }

    return logEntry;
  }

  // Log data access events
  async logDataAccess(userId, resource, action, success, details = {}) {
    const logEntry = {
      id: `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'data_access',
      userId,
      resource, // 'expert_profile', 'user_data', 'sanctuary_messages', etc.
      action, // 'view', 'create', 'update', 'delete'
      success,
      details
    };

    await this.writeAuditLog(logEntry);
    return logEntry;
  }

  // Log security events
  async logSecurityEvent(eventType, severity, description, details = {}, ipAddress = null) {
    const logEntry = {
      id: `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'security',
      eventType, // 'rate_limit_exceeded', 'suspicious_request', 'injection_attempt', etc.
      severity, // 'low', 'medium', 'high', 'critical'
      description,
      details,
      ipAddress
    };

    await this.writeAuditLog(logEntry);
    
    // Auto-alert on high severity events
    if (severity === 'high' || severity === 'critical') {
      const healthMonitor = require('./healthMonitor');
      healthMonitor.generateAlert(
        'security_event',
        `${severity.toUpperCase()} security event: ${description}`,
        severity === 'critical' ? 'error' : 'warning'
      );
    }

    return logEntry;
  }

  // Log system events
  async logSystemEvent(event, success, details = {}) {
    const logEntry = {
      id: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      event, // 'startup', 'shutdown', 'backup', 'migration', etc.
      success,
      details
    };

    await this.writeAuditLog(logEntry);
    return logEntry;
  }

  // Write audit log to file and memory
  async writeAuditLog(logEntry) {
    try {
      // Add to in-memory storage
      this.auditLogs.push(logEntry);
      
      // Keep only recent logs in memory
      if (this.auditLogs.length > this.maxInMemoryLogs) {
        this.auditLogs = this.auditLogs.slice(-this.maxInMemoryLogs);
      }

      // Write to daily log file
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `audit_${date}.json`);
      
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(logFile, logLine, 'utf8');

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`AUDIT: ${logEntry.type} - ${logEntry.action || logEntry.event}`, logEntry);
      }
    } catch (error) {
      console.error('Error writing audit log:', error);
    }
  }

  // Check for brute force attempts
  async checkForBruteForce(userId, ipAddress) {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    // Count failed login attempts in last 5 minutes
    const recentFailures = this.auditLogs.filter(log => 
      log.type === 'authentication' &&
      log.event === 'login' &&
      !log.success &&
      (log.userId === userId || log.ipAddress === ipAddress) &&
      new Date(log.timestamp).getTime() > fiveMinutesAgo
    );

    if (recentFailures.length >= 5) {
      await this.logSecurityEvent(
        'brute_force_attempt',
        'high',
        `Multiple failed login attempts detected for user ${userId} from IP ${ipAddress}`,
        { attemptCount: recentFailures.length, timeWindow: '5 minutes' },
        ipAddress
      );
    }
  }

  // Get audit logs with filtering
  async getAuditLogs(filters = {}, limit = 100, offset = 0) {
    let filteredLogs = [...this.auditLogs];

    // Apply filters
    if (filters.type) {
      filteredLogs = filteredLogs.filter(log => log.type === filters.type);
    }
    
    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }
    
    if (filters.adminId) {
      filteredLogs = filteredLogs.filter(log => log.adminId === filters.adminId);
    }
    
    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= toDate);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const total = filteredLogs.length;
    const logs = filteredLogs.slice(offset, offset + limit);

    return {
      logs,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };
  }

  // Get security summary
  async getSecuritySummary(timeframe = '24h') {
    const now = Date.now();
    let cutoffTime;
    
    switch (timeframe) {
      case '1h':
        cutoffTime = now - (60 * 60 * 1000);
        break;
      case '24h':
        cutoffTime = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = now - (24 * 60 * 60 * 1000);
    }

    const recentLogs = this.auditLogs.filter(log => 
      new Date(log.timestamp).getTime() > cutoffTime
    );

    const summary = {
      timeframe,
      totalEvents: recentLogs.length,
      adminActions: recentLogs.filter(log => log.type === 'admin_action').length,
      authEvents: recentLogs.filter(log => log.type === 'authentication').length,
      securityEvents: recentLogs.filter(log => log.type === 'security').length,
      failedLogins: recentLogs.filter(log => 
        log.type === 'authentication' && 
        log.event === 'login' && 
        !log.success
      ).length,
      uniqueUsers: new Set(recentLogs.map(log => log.userId).filter(Boolean)).size,
      uniqueIPs: new Set(recentLogs.map(log => log.ipAddress).filter(Boolean)).size,
      topActions: this.getTopActions(recentLogs),
      securityAlerts: recentLogs.filter(log => 
        log.type === 'security' && 
        (log.severity === 'high' || log.severity === 'critical')
      ).length
    };

    return summary;
  }

  // Get top actions
  getTopActions(logs) {
    const actionCounts = {};
    
    logs.forEach(log => {
      const action = log.action || log.event;
      if (action) {
        actionCounts[action] = (actionCounts[action] || 0) + 1;
      }
    });

    return Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));
  }

  // Export logs for compliance
  async exportLogs(filters = {}, format = 'json') {
    const { logs } = await this.getAuditLogs(filters, 10000, 0);
    
    if (format === 'csv') {
      return this.exportAsCSV(logs);
    }
    
    return JSON.stringify(logs, null, 2);
  }

  // Export as CSV
  exportAsCSV(logs) {
    if (logs.length === 0) return '';
    
    const headers = Object.keys(logs[0]);
    const csvContent = [
      headers.join(','),
      ...logs.map(log => 
        headers.map(header => {
          const value = log[header];
          if (typeof value === 'object' && value !== null) {
            return `\"${JSON.stringify(value).replace(/\"/g, '\"\"')}\"`;
          }
          return `\"${String(value || '').replace(/\"/g, '\"\"')}\"`;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }
}

module.exports = new AuditLogger();
