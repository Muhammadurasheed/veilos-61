const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const Expert = require('../models/Expert');
const User = require('../models/User');
const Booking = require('../models/Booking');

// Real-time monitoring endpoints for admin dashboard

// Get real-time expert applications
router.get('/expert-applications/realtime', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pendingApplications = await Expert.find({ 
      accountStatus: 'pending' 
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('id name email specialization createdAt verificationDocuments')
    .lean();

    const recentApplications = await Expert.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).countDocuments();

    res.json({
      success: true,
      data: {
        pending: pendingApplications,
        recentCount: recentApplications,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Real-time applications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time applications'
    });
  }
});

// Crisis detection monitoring
router.get('/crisis-detection', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // This would integrate with AI monitoring in production
    // For now, return mock data structure
    res.json({
      success: true,
      data: {
        alerts: [],
        riskLevel: 'low',
        monitoredSessions: 0,
        lastScan: new Date()
      }
    });
  } catch (error) {
    console.error('Crisis detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch crisis detection data'
    });
  }
});

// Live sanctuary session monitoring
router.get('/sanctuary-monitoring', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // This would connect to live sanctuary data
    res.json({
      success: true,
      data: {
        activeSessions: [],
        totalParticipants: 0,
        moderationAlerts: [],
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Sanctuary monitoring error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sanctuary monitoring data'
    });
  }
});

// Content moderation queue
router.get('/moderation-queue', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { priority, type } = req.query;
    
    // This would integrate with content moderation system
    res.json({
      success: true,
      data: {
        queue: [],
        counts: {
          high: 0,
          medium: 0,
          low: 0
        },
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Moderation queue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch moderation queue'
    });
  }
});

// Expert performance analytics
router.get('/expert-performance', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const topExperts = await Expert.find({ accountStatus: 'approved' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('id name specialization verificationLevel createdAt')
      .lean();

    // In production, this would include actual performance metrics
    const expertPerformance = topExperts.map(expert => ({
      ...expert,
      sessionsCount: 0,
      averageRating: 0,
      responseTime: '< 1 hour',
      completionRate: 100
    }));

    res.json({
      success: true,
      data: {
        experts: expertPerformance,
        metrics: {
          averageRating: 4.8,
          averageResponseTime: '45 minutes',
          completionRate: 98.5
        },
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Expert performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expert performance data'
    });
  }
});

module.exports = router;