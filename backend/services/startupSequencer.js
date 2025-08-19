// Startup Sequencing Service to prevent restart loops
const mongoose = require('mongoose');

class StartupSequencer {
  constructor() {
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.runInitializationSequence();
    return this.initializationPromise;
  }

  async runInitializationSequence() {
    try {
      console.log('Starting server initialization sequence...');

      // Step 1: Wait for database connection
      await this.waitForDatabase();
      console.log('✓ Database connection established');

      // Step 2: Initialize audit logging (production only)
      if (process.env.NODE_ENV === 'production') {
        const auditLogger = require('./auditLogger');
        await auditLogger.initializeFileLogging();
        console.log('✓ Audit logging initialized');
      }

      // Step 3: Initialize performance monitoring
      const { initializeMonitoring } = require('../middleware/performanceMonitor');
      initializeMonitoring();
      console.log('✓ Performance monitoring initialized');

      // Step 4: Start cache warming (non-blocking)
      const cacheService = require('./cacheService');
      cacheService.warmCache();
      console.log('✓ Cache warming started');

      // Step 5: Log startup event
      setTimeout(async () => {
        try {
          const auditLogger = require('./auditLogger');
          await auditLogger.logSystemEvent('startup', true, {
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || 'development'
          });
        } catch (error) {
          // Ignore audit logging errors during startup
        }
      }, 1000);

      this.isInitialized = true;
      console.log('✓ Server initialization completed successfully');

    } catch (error) {
      console.error('Server initialization failed:', error.message);
      throw error;
    }
  }

  async waitForDatabase(maxAttempts = 30, delay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (mongoose.connection.readyState === 1) {
        return true;
      }

      console.log(`Waiting for database connection... (${attempt}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    throw new Error('Database connection timeout');
  }

  isReady() {
    return this.isInitialized;
  }
}

module.exports = new StartupSequencer();