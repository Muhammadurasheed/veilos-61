// Background Job Processing System for High-Performance Operations
const EventEmitter = require('events');

class BackgroundJobQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.workers = new Map();
    this.jobHistory = [];
    this.maxHistorySize = 1000;
    this.processingJobs = new Set();
    this.retryDelays = [1000, 5000, 15000, 60000]; // Exponential backoff
    
    this.isProcessing = false;
    this.concurrency = 5; // Maximum concurrent jobs
    
    // Start job processor
    this.startProcessor();
  }

  // Add job to queue
  add(type, data, options = {}) {
    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      priority: options.priority || 0,
      delay: options.delay || 0,
      maxRetries: options.maxRetries || 3,
      retryCount: 0,
      createdAt: new Date(),
      scheduledAt: new Date(Date.now() + (options.delay || 0)),
      status: 'pending',
      error: null
    };
    
    this.jobs.set(job.id, job);
    
    console.log(`Job ${job.id} (${type}) added to queue`);
    this.emit('job:added', job);
    
    return job.id;
  }

  // Process jobs
  async startProcessor() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    console.log('Background job processor started');
    
    while (this.isProcessing) {
      try {
        await this.processNextJobs();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Check every second
      } catch (error) {
        console.error('Job processor error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds on error
      }
    }
  }

  async processNextJobs() {
    const availableSlots = this.concurrency - this.processingJobs.size;
    if (availableSlots <= 0) return;
    
    // Get ready jobs
    const readyJobs = Array.from(this.jobs.values())
      .filter(job => 
        job.status === 'pending' && 
        job.scheduledAt <= new Date() &&
        !this.processingJobs.has(job.id)
      )
      .sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt)
      .slice(0, availableSlots);
    
    // Process jobs concurrently
    const processingPromises = readyJobs.map(job => this.processJob(job));
    
    if (processingPromises.length > 0) {
      await Promise.allSettled(processingPromises);
    }
  }

  async processJob(job) {
    this.processingJobs.add(job.id);
    job.status = 'processing';
    job.startedAt = new Date();
    
    console.log(`Processing job ${job.id} (${job.type})`);
    this.emit('job:started', job);
    
    try {
      const worker = this.workers.get(job.type);
      if (!worker) {
        throw new Error(`No worker registered for job type: ${job.type}`);
      }
      
      const result = await worker(job.data, job);
      
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      
      console.log(`Job ${job.id} completed successfully`);
      this.emit('job:completed', job);
      
      this.moveToHistory(job);
      
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      await this.handleJobFailure(job, error);
    } finally {
      this.processingJobs.delete(job.id);
    }
  }

  async handleJobFailure(job, error) {
    job.error = error.message;
    job.retryCount++;
    
    if (job.retryCount <= job.maxRetries) {
      // Schedule retry with exponential backoff
      const delayIndex = Math.min(job.retryCount - 1, this.retryDelays.length - 1);
      const delay = this.retryDelays[delayIndex];
      
      job.status = 'pending';
      job.scheduledAt = new Date(Date.now() + delay);
      
      console.log(`Job ${job.id} scheduled for retry ${job.retryCount}/${job.maxRetries} in ${delay}ms`);
      this.emit('job:retry', job);
      
    } else {
      job.status = 'failed';
      job.failedAt = new Date();
      
      console.error(`Job ${job.id} failed permanently after ${job.retryCount} retries`);
      this.emit('job:failed', job);
      
      this.moveToHistory(job);
    }
  }

  moveToHistory(job) {
    this.jobs.delete(job.id);
    this.jobHistory.unshift(job);
    
    // Keep history size manageable
    if (this.jobHistory.length > this.maxHistorySize) {
      this.jobHistory = this.jobHistory.slice(0, this.maxHistorySize);
    }
  }

  // Register job worker
  registerWorker(type, handler) {
    this.workers.set(type, handler);
    console.log(`Worker registered for job type: ${type}`);
  }

  // Remove job from queue
  cancel(jobId) {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'pending') {
      job.status = 'cancelled';
      job.cancelledAt = new Date();
      this.moveToHistory(job);
      this.emit('job:cancelled', job);
      return true;
    }
    return false;
  }

  // Get job status
  getJob(jobId) {
    return this.jobs.get(jobId) || this.jobHistory.find(job => job.id === jobId);
  }

  // Get queue statistics
  getStats() {
    const pendingJobs = Array.from(this.jobs.values()).filter(job => job.status === 'pending');
    const processingJobs = Array.from(this.jobs.values()).filter(job => job.status === 'processing');
    
    const completedJobs = this.jobHistory.filter(job => job.status === 'completed');
    const failedJobs = this.jobHistory.filter(job => job.status === 'failed');
    
    return {
      queue: {
        pending: pendingJobs.length,
        processing: processingJobs.length,
        total: this.jobs.size
      },
      history: {
        completed: completedJobs.length,
        failed: failedJobs.length,
        total: this.jobHistory.length
      },
      workers: Array.from(this.workers.keys()),
      concurrency: this.concurrency,
      uptime: process.uptime()
    };
  }

  // Stop processor
  stop() {
    this.isProcessing = false;
    console.log('Background job processor stopped');
  }
}

// Create singleton instance
const jobQueue = new BackgroundJobQueue();

// Register common workers
jobQueue.registerWorker('email_notification', async (data) => {
  console.log('Sending email notification:', data);
  // Email sending logic would go here
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate email sending
  return { sent: true, recipient: data.email };
});

jobQueue.registerWorker('cache_refresh', async (data) => {
  console.log('Refreshing cache:', data);
  const cacheService = require('./cacheService');
  
  if (data.key && data.value) {
    cacheService.set(data.key, data.value, data.ttl || 3600);
  }
  
  if (data.warmUp) {
    await cacheService.warmCache();
  }
  
  return { refreshed: true };
});

jobQueue.registerWorker('cleanup_expired_data', async (data) => {
  console.log('Cleaning up expired data:', data);
  
  // Clean up expired sanctuary sessions
  const SanctuarySession = require('../models/SanctuarySession');
  const cutoffDate = new Date(Date.now() - (data.retentionDays || 30) * 24 * 60 * 60 * 1000);
  
  const result = await SanctuarySession.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: 'completed'
  });
  
  return { deletedSessions: result.deletedCount };
});

jobQueue.registerWorker('generate_analytics_report', async (data) => {
  console.log('Generating analytics report:', data);
  
  const { ExpertAnalytics, PlatformHealth } = require('../models/Analytics');
  
  // Generate daily analytics summary
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expertStats = await ExpertAnalytics.aggregate([
    {
      $group: {
        _id: null,
        totalExperts: { $sum: 1 },
        totalSessions: { $sum: '$totalSessions' },
        totalRevenue: { $sum: '$totalRevenue' },
        avgRating: { $avg: '$averageRating' }
      }
    }
  ]);
  
  const report = {
    date: today,
    experts: expertStats[0] || {},
    generated: new Date()
  };
  
  // Cache the report
  const cacheService = require('./cacheService');
  cacheService.set('daily_analytics_report', report, 86400); // 24 hours
  
  return report;
});

jobQueue.registerWorker('backup_audit_logs', async (data) => {
  console.log('Backing up audit logs:', data);
  
  const auditLogger = require('./auditLogger');
  const fs = require('fs').promises;
  const path = require('path');
  
  // Export audit logs for backup
  const logs = await auditLogger.exportLogs({
    dateFrom: data.dateFrom,
    dateTo: data.dateTo
  }, 'json');
  
  // Save to backup directory
  const backupDir = path.join(__dirname, '../backups');
  await fs.mkdir(backupDir, { recursive: true });
  
  const filename = `audit_backup_${data.dateFrom}_${data.dateTo}.json`;
  const filepath = path.join(backupDir, filename);
  
  await fs.writeFile(filepath, logs);
  
  return { backupFile: filename, size: logs.length };
});

// Schedule recurring jobs
const scheduleRecurringJobs = () => {
  // Daily cleanup
  setInterval(() => {
    jobQueue.add('cleanup_expired_data', { retentionDays: 30 });
  }, 24 * 60 * 60 * 1000); // Daily
  
  // Hourly cache refresh
  setInterval(() => {
    jobQueue.add('cache_refresh', { warmUp: true });
  }, 60 * 60 * 1000); // Hourly
  
  // Daily analytics report
  setInterval(() => {
    jobQueue.add('generate_analytics_report', {});
  }, 24 * 60 * 60 * 1000); // Daily
  
  console.log('Recurring jobs scheduled');
};

// Start recurring jobs
setTimeout(scheduleRecurringJobs, 10000); // Start after 10 seconds

module.exports = jobQueue;
