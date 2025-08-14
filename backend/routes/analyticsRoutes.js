const express = require('express');
const router = express.Router();
const { SessionMetric, ExpertAnalytics, PlatformHealth } = require('../models/Analytics');
const Expert = require('../models/Expert');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get expert analytics
router.get('/expert/:expertId', authMiddleware, async (req, res) => {
  try {
    const { expertId } = req.params;
    const { timeframe = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) } };
        break;
      case '1y':
        dateFilter = { createdAt: { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) } };
        break;
    }

    // Get session metrics
    const sessionMetrics = await SessionMetric.find({
      expertId,
      ...dateFilter
    });

    // Get or create expert analytics
    let expertAnalytics = await ExpertAnalytics.findOne({ expertId });
    if (!expertAnalytics) {
      expertAnalytics = new ExpertAnalytics({ expertId });
      await expertAnalytics.save();
    }

    // Calculate real-time metrics
    const totalSessions = sessionMetrics.length;
    const completedSessions = sessionMetrics.filter(s => s.completed).length;
    const averageRating = sessionMetrics.reduce((acc, s) => acc + (s.satisfactionScore || 0), 0) / totalSessions || 0;
    const totalRevenue = sessionMetrics.reduce((acc, s) => acc + s.revenue, 0);
    const averageResponseTime = sessionMetrics.reduce((acc, s) => acc + s.responseTime, 0) / totalSessions || 0;
    const totalHours = sessionMetrics.reduce((acc, s) => acc + s.duration, 0) / 60;

    const analytics = {
      expertId,
      totalSessions,
      completedSessions,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalRevenue,
      averageResponseTime: parseFloat(averageResponseTime.toFixed(2)),
      totalHours: parseFloat(totalHours.toFixed(2)),
      sessionMetrics,
      timeframe
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching expert analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expert analytics'
    });
  }
});

// Get platform analytics (admin only)
router.get('/platform', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) } };
        break;
    }

    // Get platform metrics
    const totalUsers = await User.countDocuments();
    const totalExperts = await Expert.countDocuments();
    const verifiedExperts = await Expert.countDocuments({ verified: true });
    const sessionMetrics = await SessionMetric.find(dateFilter);
    
    // Calculate platform health
    const totalSessions = sessionMetrics.length;
    const totalRevenue = sessionMetrics.reduce((acc, s) => acc + s.revenue, 0);
    const averageRating = sessionMetrics.reduce((acc, s) => acc + (s.satisfactionScore || 0), 0) / totalSessions || 0;
    const completionRate = sessionMetrics.filter(s => s.completed).length / totalSessions * 100 || 0;

    // Get platform health metrics
    const healthMetrics = await PlatformHealth.find(dateFilter).sort({ date: -1 }).limit(30);

    const analytics = {
      overview: {
        totalUsers,
        totalExperts,
        verifiedExperts,
        totalSessions,
        totalRevenue,
        averageRating: parseFloat(averageRating.toFixed(2)),
        completionRate: parseFloat(completionRate.toFixed(2))
      },
      healthMetrics,
      timeframe
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform analytics'
    });
  }
});

// Record session metric
router.post('/session-metric', authMiddleware, async (req, res) => {
  try {
    const {
      sessionId,
      expertId,
      userId,
      duration,
      responseTime,
      messageCount,
      satisfactionScore,
      completed,
      revenue,
      category
    } = req.body;

    const sessionMetric = new SessionMetric({
      sessionId,
      expertId,
      userId,
      duration,
      responseTime,
      messageCount,
      satisfactionScore,
      completed,
      revenue,
      category
    });

    await sessionMetric.save();

    // Update expert analytics
    let expertAnalytics = await ExpertAnalytics.findOne({ expertId });
    if (!expertAnalytics) {
      expertAnalytics = new ExpertAnalytics({ expertId });
    }

    expertAnalytics.totalSessions += 1;
    if (completed) {
      expertAnalytics.completedSessions += 1;
    }
    expertAnalytics.totalRevenue += revenue || 0;
    expertAnalytics.totalHours += duration / 60;
    expertAnalytics.lastUpdated = new Date();

    // Recalculate averages
    const allMetrics = await SessionMetric.find({ expertId });
    expertAnalytics.averageRating = allMetrics.reduce((acc, m) => acc + (m.satisfactionScore || 0), 0) / allMetrics.length;
    expertAnalytics.averageResponseTime = allMetrics.reduce((acc, m) => acc + m.responseTime, 0) / allMetrics.length;

    await expertAnalytics.save();

    res.json({
      success: true,
      data: sessionMetric
    });
  } catch (error) {
    console.error('Error recording session metric:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record session metric'
    });
  }
});

// Get expert performance ranking
router.get('/rankings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { sortBy = 'rating', limit = 10 } = req.query;
    
    let sortField = {};
    switch (sortBy) {
      case 'rating':
        sortField = { averageRating: -1 };
        break;
      case 'revenue':
        sortField = { totalRevenue: -1 };
        break;
      case 'sessions':
        sortField = { totalSessions: -1 };
        break;
      case 'responseTime':
        sortField = { averageResponseTime: 1 };
        break;
      default:
        sortField = { averageRating: -1 };
    }

    const rankings = await ExpertAnalytics.find()
      .sort(sortField)
      .limit(parseInt(limit))
      .populate('expertId', 'name specialization avatarUrl');

    res.json({
      success: true,
      data: rankings
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rankings'
    });
  }
});

// Update platform health metrics
router.post('/platform-health', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      activeUsers,
      activeSessions,
      flaggedContent,
      moderatedContent,
      serverLoad,
      responseTime,
      errorRate
    } = req.body;

    const healthMetric = new PlatformHealth({
      activeUsers,
      activeSessions,
      flaggedContent,
      moderatedContent,
      serverLoad,
      responseTime,
      errorRate
    });

    await healthMetric.save();

    res.json({
      success: true,
      data: healthMetric
    });
  } catch (error) {
    console.error('Error updating platform health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update platform health'
    });
  }
});

module.exports = router;