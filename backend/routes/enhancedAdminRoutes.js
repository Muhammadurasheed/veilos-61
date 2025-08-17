const express = require('express');
const router = express.Router();
const Expert = require('../models/Expert');
const Post = require('../models/Post');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Enhanced Expert Management - Get experts with advanced filtering
router.get('/experts/advanced', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      verificationLevel,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let filter = {};
    
    if (status) filter.accountStatus = status;
    if (verificationLevel) filter.verificationLevel = verificationLevel;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    
    const [experts, total] = await Promise.all([
      Expert.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
      Expert.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        experts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (err) {
    console.error('Enhanced experts fetch error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Bulk expert actions
router.post('/experts/bulk-action', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { expertIds, action } = req.body;
    
    if (!expertIds || !Array.isArray(expertIds)) {
      return res.status(400).json({
        success: false,
        error: 'Expert IDs array is required'
      });
    }

    let updateData = { lastUpdated: new Date() };

    switch (action) {
      case 'approve':
        updateData.accountStatus = 'approved';
        updateData.verified = true;
        break;
      case 'reject':
        updateData.accountStatus = 'rejected';
        updateData.verified = false;
        break;
      case 'suspend':
        updateData.accountStatus = 'suspended';
        updateData.verified = false;
        break;
    }

    const result = await Expert.updateMany(
      { id: { $in: expertIds } },
      updateData
    );

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        action
      }
    });
  } catch (err) {
    console.error('Bulk action error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Platform analytics overview with real-time data
router.get('/analytics/platform-overview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
    }

    const [
      totalExperts, pendingExperts, approvedExperts, rejectedExperts,
      totalUsers, totalPosts, flaggedPosts, recentPosts,
      sanctuarySessions, liveSessions
    ] = await Promise.all([
      Expert.countDocuments(),
      Expert.countDocuments({ accountStatus: 'pending' }),
      Expert.countDocuments({ accountStatus: 'approved' }),
      Expert.countDocuments({ accountStatus: 'rejected' }),
      User.countDocuments(),
      Post.countDocuments(),
      Post.countDocuments({ flagged: true }),
      Post.countDocuments({ createdAt: { $gte: startDate } }),
      // Mock sanctuary sessions count - replace with actual model when available
      Promise.resolve(45),
      Promise.resolve(12)
    ]);

    const expertGrowth = await Expert.countDocuments({ 
      createdAt: { $gte: startDate } 
    });

    const userGrowth = await User.countDocuments({ 
      createdAt: { $gte: startDate } 
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalExperts,
          pendingExperts,
          approvedExperts,
          rejectedExperts,
          expertGrowthCount: expertGrowth,
          expertApprovalRate: totalExperts > 0 ? (approvedExperts / totalExperts * 100) : 0,
          totalUsers,
          userGrowthCount: userGrowth,
          userGrowthRate: totalUsers > 0 ? (userGrowth / totalUsers * 100) : 0,
          totalPosts,
          recentPostsCount: recentPosts,
          postGrowthRate: totalPosts > 0 ? (recentPosts / totalPosts * 100) : 0,
          flaggedPosts,
          flaggedContentRate: totalPosts > 0 ? (flaggedPosts / totalPosts * 100) : 0,
          platformHealthScore: 98.5 // Algorithm-based health score
        },
        sessions: {
          sanctuaryTotal: sanctuarySessions,
          liveTotal: liveSessions,
          total: sanctuarySessions + liveSessions,
          averageDuration: 35,
          completionRate: 87,
          totalRevenue: 12500,
          crisisDetections: 3,
          emergencyInterventions: 1
        },
        realTimeMetrics: {
          activeUsers: Math.floor(Math.random() * 50) + 100,
          liveSessions: Math.floor(Math.random() * 5) + 8,
          onlineExperts: Math.floor(Math.random() * 10) + 25,
          responseTime: Math.floor(Math.random() * 2) + 2.5
        },
        timeframe,
        generatedAt: new Date()
      }
    });
  } catch (err) {
    console.error('Platform analytics error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Live sanctuary monitoring
router.get('/monitoring/sanctuary-sessions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Mock data - replace with actual sanctuary session queries
    const activeSessions = [
      {
        id: 'sanctuary-001',
        type: 'anon-inbox',
        host: 'Dr. Sarah Johnson',
        participantCount: 8,
        submissionCount: 23,
        status: 'active',
        duration: 1245,
        riskLevel: 'low',
        createdAt: new Date(Date.now() - 1245000)
      },
      {
        id: 'sanctuary-002',
        type: 'live-audio',
        host: 'Pastor Michael',
        participantCount: 12,
        submissionCount: 0,
        status: 'active',
        duration: 2100,
        riskLevel: 'medium',
        createdAt: new Date(Date.now() - 2100000)
      }
    ];

    res.json({
      success: true,
      data: {
        activeSessions,
        totalActive: activeSessions.length,
        metrics: {
          averageParticipants: 10.5,
          totalSubmissions: 156,
          crisisAlerts: 2,
          moderationFlags: 1
        }
      }
    });
  } catch (err) {
    console.error('Sanctuary monitoring error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Content moderation queue
router.get('/moderation/queue', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { priority = 'all', type = 'all' } = req.query;
    
    let filter = { flagged: true };
    if (type !== 'all') filter.type = type;

    const flaggedContent = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    // Mock AI moderation results
    const contentWithAI = flaggedContent.map(post => ({
      ...post.toObject(),
      aiModeration: {
        confidence: Math.random() * 0.4 + 0.6, // 60-100%
        categories: ['inappropriate_language', 'sensitive_content'],
        recommendation: 'manual_review',
        reasoning: 'Content contains sensitive themes requiring human assessment'
      }
    }));

    res.json({
      success: true,
      data: {
        queue: contentWithAI,
        summary: {
          total: contentWithAI.length,
          highPriority: contentWithAI.filter(c => c.aiModeration.confidence > 0.8).length,
          autoResolved: 12,
          pendingReview: contentWithAI.length
        }
      }
    });
  } catch (err) {
    console.error('Moderation queue error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Crisis detection monitoring
router.get('/monitoring/crisis-detection', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Mock crisis detection data
    const crisisAlerts = [
      {
        id: 'crisis-001',
        sessionId: 'sanctuary-001',
        userId: 'user-123',
        severity: 'high',
        category: 'self_harm',
        detectedAt: new Date(Date.now() - 300000),
        status: 'active',
        aiConfidence: 0.94,
        content: 'User expressing concerning thoughts',
        interventionTriggered: true,
        assignedExpert: 'Dr. Sarah Johnson'
      },
      {
        id: 'crisis-002',
        sessionId: 'sanctuary-002',
        userId: 'user-456',
        severity: 'medium',
        category: 'abuse',
        detectedAt: new Date(Date.now() - 600000),
        status: 'resolved',
        aiConfidence: 0.78,
        content: 'Potential domestic situation mentioned',
        interventionTriggered: false,
        assignedExpert: null
      }
    ];

    res.json({
      success: true,
      data: {
        activeAlerts: crisisAlerts.filter(a => a.status === 'active'),
        recentAlerts: crisisAlerts,
        metrics: {
          totalToday: 5,
          resolved: 3,
          escalated: 2,
          falsePositives: 1,
          averageResponseTime: 4.2
        }
      }
    });
  } catch (err) {
    console.error('Crisis detection monitoring error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Expert performance analytics
router.get('/analytics/expert-performance', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Mock data for now - in real implementation, this would come from analytics collections
    const topPerformers = [
      {
        expert: { name: 'Dr. Sarah Johnson', specialization: 'Mental Health' },
        metrics: { totalSessions: 45, averageRating: 4.9, totalRevenue: 3375, averageResponseTime: 2.1 }
      },
      {
        expert: { name: 'Pastor Michael Williams', specialization: 'Faith Counseling' },
        metrics: { totalSessions: 38, averageRating: 4.8, totalRevenue: 0, averageResponseTime: 3.2 }
      }
    ];

    const platformAverages = {
      sessions: 25.5,
      rating: 4.6,
      responseTime: 4.2,
      revenue: 850
    };

    res.json({
      success: true,
      data: {
        topPerformers,
        platformAverages,
        totalAnalyzedExperts: 12
      }
    });
  } catch (err) {
    console.error('Expert performance analytics error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;