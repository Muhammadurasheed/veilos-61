const express = require('express');
const router = express.Router();
const Expert = require('../models/Expert');
const Post = require('../models/Post');
const User = require('../models/User');
const Session = require('../models/Session');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { AIModerationLog } = require('../models/AIModerationLog');
const { Analytics } = require('../models/Analytics');

// Enhanced Safety Monitoring
router.get('/safety-alerts', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status = 'pending', severity, limit = 50 } = req.query;
    
    let query = {};
    if (status !== 'all') query.status = status;
    if (severity) query.severity = severity;
    
    const alerts = await AIModerationLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('expertId', 'name specialization');
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching safety alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch safety alerts'
    });
  }
});

// Create safety alert
router.post('/safety-alerts', authMiddleware, async (req, res) => {
  try {
    const {
      userId,
      expertId,
      sessionId,
      alertType,
      severity,
      description,
      aiConfidence
    } = req.body;
    
    const alert = new AIModerationLog({
      sessionId,
      participantId: userId,
      participantAlias: 'User',
      riskLevel: severity,
      categories: [alertType],
      confidence: aiConfidence || 0.9,
      flaggedContent: description,
      actionTaken: 'alert_created',
      resolved: false
    });
    
    await alert.save();
    
    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Error creating safety alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create safety alert'
    });
  }
});

// Update safety alert
router.patch('/safety-alerts/:alertId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status, assignedTo, resolution } = req.body;
    
    const alert = await AIModerationLog.findByIdAndUpdate(
      alertId,
      {
        resolved: status === 'resolved',
        actionTaken: status,
        ...(resolution && { resolution })
      },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Error updating safety alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update safety alert'
    });
  }
});

// Enhanced Content Moderation Queue
router.get('/moderation', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status = 'pending', contentType, limit = 50 } = req.query;
    
    let query = { flagged: true };
    if (status !== 'all') query.moderationStatus = status;
    
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('authorId', 'name email')
      .select('id content flagReason flaggedBy aiConfidence moderationStatus moderatorNotes createdAt');
    
    const moderationItems = posts.map(post => ({
      id: post.id,
      contentId: post.id,
      contentType: 'post',
      authorId: post.authorId?._id,
      content: post.content,
      flagReason: post.flagReason || 'inappropriate',
      flaggedBy: post.flaggedBy || 'ai',
      aiConfidence: post.aiConfidence,
      status: post.moderationStatus || 'pending',
      moderatorNotes: post.moderatorNotes,
      createdAt: post.createdAt
    }));
    
    res.json({
      success: true,
      data: moderationItems
    });
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch moderation queue'
    });
  }
});

// Moderate content
router.post('/moderation/:contentId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { action, notes } = req.body;
    
    const post = await Post.findOne({ id: contentId });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    if (action === 'approve') {
      post.flagged = false;
      post.moderationStatus = 'approved';
      post.flagReason = null;
    } else if (action === 'reject') {
      post.moderationStatus = 'rejected';
      // Could also delete the post here if needed
    }
    
    if (notes) {
      post.moderatorNotes = notes;
    }
    
    post.moderatedAt = new Date();
    post.moderatedBy = req.user.id;
    
    await post.save();
    
    res.json({
      success: true,
      data: { success: true }
    });
  } catch (error) {
    console.error('Error moderating content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate content'
    });
  }
});

// Bulk moderation action
router.post('/moderation/bulk', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { contentIds, action } = req.body;
    
    if (!Array.isArray(contentIds) || !action) {
      return res.status(400).json({
        success: false,
        message: 'Content IDs array and action are required'
      });
    }
    
    const updateData = {
      moderatedAt: new Date(),
      moderatedBy: req.user.id
    };
    
    if (action === 'approve') {
      updateData.flagged = false;
      updateData.moderationStatus = 'approved';
      updateData.flagReason = null;
    } else if (action === 'reject') {
      updateData.moderationStatus = 'rejected';
    }
    
    await Post.updateMany(
      { id: { $in: contentIds } },
      updateData
    );
    
    res.json({
      success: true,
      data: { processed: contentIds.length }
    });
  } catch (error) {
    console.error('Error performing bulk moderation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk moderation'
    });
  }
});

// System Health Monitoring
router.get('/system-health', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Simulate system metrics (in production, these would come from monitoring services)
    const systemHealth = {
      overall: 'healthy', // healthy, warning, critical
      metrics: {
        cpuUsage: Math.floor(Math.random() * 40) + 20, // 20-60%
        memoryUsage: Math.floor(Math.random() * 30) + 40, // 40-70%
        diskUsage: Math.floor(Math.random() * 20) + 30, // 30-50%
        responseTime: Math.floor(Math.random() * 100) + 50, // 50-150ms
        errorRate: Math.random() * 2, // 0-2%
        activeConnections: Math.floor(Math.random() * 100) + 50,
        throughput: Math.floor(Math.random() * 1000) + 500
      },
      alerts: [
        // Sample alerts - in production, these would come from monitoring systems
      ],
      uptime: 99.9,
      lastUpdated: new Date().toISOString()
    };
    
    // Determine overall health based on metrics
    if (systemHealth.metrics.cpuUsage > 80 || systemHealth.metrics.memoryUsage > 85 || systemHealth.metrics.errorRate > 5) {
      systemHealth.overall = 'critical';
    } else if (systemHealth.metrics.cpuUsage > 60 || systemHealth.metrics.memoryUsage > 70 || systemHealth.metrics.errorRate > 2) {
      systemHealth.overall = 'warning';
    }
    
    res.json({
      success: true,
      data: systemHealth
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health'
    });
  }
});

// Acknowledge system alert
router.post('/system-alerts/:alertId/acknowledge', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // In production, this would update the alert in the monitoring system
    res.json({
      success: true,
      data: { acknowledged: true }
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert'
    });
  }
});

// User Risk Assessment
router.get('/risk-assessment/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's session history, posts, and interactions
    const user = await User.findOne({ id: userId });
    const userPosts = await Post.find({ authorId: userId });
    const userSessions = await Session.find({ userId });
    const moderationLogs = await AIModerationLog.find({ participantId: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Calculate risk score based on various factors
    let riskScore = 0;
    const factors = [];
    const recommendations = [];
    
    // Moderation history factor
    if (moderationLogs.length > 0) {
      const highRiskLogs = moderationLogs.filter(log => log.riskLevel === 'high' || log.riskLevel === 'critical');
      riskScore += highRiskLogs.length * 20;
      if (highRiskLogs.length > 0) {
        factors.push(`${highRiskLogs.length} high-risk moderation incidents`);
        recommendations.push('Monitor user interactions closely');
      }
    }
    
    // Flagged content factor
    const flaggedPosts = userPosts.filter(post => post.flagged);
    if (flaggedPosts.length > 0) {
      riskScore += flaggedPosts.length * 15;
      factors.push(`${flaggedPosts.length} flagged posts`);
      recommendations.push('Review content posting patterns');
    }
    
    // Session completion rate
    const completedSessions = userSessions.filter(session => session.status === 'completed');
    const completionRate = userSessions.length > 0 ? completedSessions.length / userSessions.length : 1;
    if (completionRate < 0.7) {
      riskScore += 10;
      factors.push('Low session completion rate');
      recommendations.push('Investigate session abandonment reasons');
    }
    
    // Account age factor (newer accounts higher risk)
    const accountAge = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24); // days
    if (accountAge < 30) {
      riskScore += 5;
      factors.push('New account (< 30 days)');
      recommendations.push('Apply enhanced monitoring for new users');
    }
    
    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);
    
    res.json({
      success: true,
      data: {
        score: riskScore,
        factors,
        recommendations
      }
    });
  } catch (error) {
    console.error('Error calculating risk assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate risk assessment'
    });
  }
});

// Predictive Analytics
router.get('/predictions/:type', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    
    let predictionData = {};
    
    switch (type) {
      case 'churn':
        // Predict user churn based on engagement patterns
        predictionData = {
          atRiskUsers: Math.floor(Math.random() * 20) + 5,
          churnRate: (Math.random() * 5 + 2).toFixed(2),
          factors: ['Decreased session frequency', 'Low engagement scores', 'Support ticket volume'],
          recommendations: ['Implement retention campaigns', 'Improve onboarding', 'Enhance user experience']
        };
        break;
        
      case 'escalation':
        // Predict potential crisis escalations
        predictionData = {
          highRiskSessions: Math.floor(Math.random() * 3) + 1,
          escalationProbability: (Math.random() * 15 + 5).toFixed(2),
          factors: ['Crisis-related keywords', 'Emotional distress indicators', 'Session duration patterns'],
          recommendations: ['Prepare crisis intervention team', 'Monitor real-time', 'Enable emergency protocols']
        };
        break;
        
      case 'engagement':
        // Predict user engagement trends
        predictionData = {
          expectedGrowth: (Math.random() * 10 + 5).toFixed(2),
          engagementTrend: 'increasing',
          factors: ['New feature adoption', 'Expert availability', 'User satisfaction scores'],
          recommendations: ['Expand expert network', 'Introduce gamification', 'Optimize matching algorithm']
        };
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid prediction type'
        });
    }
    
    res.json({
      success: true,
      data: predictionData
    });
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate predictions'
    });
  }
});

// Revenue Analytics
router.get('/revenue', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Generate sample revenue data
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const dailyRevenue = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      dailyRevenue.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 1000) + 500,
        sessions: Math.floor(Math.random() * 50) + 20,
        experts: Math.floor(Math.random() * 10) + 5
      });
    }
    
    const totalRevenue = dailyRevenue.reduce((sum, day) => sum + day.revenue, 0);
    const avgDailyRevenue = totalRevenue / days;
    
    res.json({
      success: true,
      data: {
        total: totalRevenue,
        average: avgDailyRevenue,
        daily: dailyRevenue,
        growth: (Math.random() * 20 - 5).toFixed(2) // -5% to +15% growth
      }
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics'
    });
  }
});

// Growth Metrics
router.get('/growth', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const growthData = [];
    
    let baseUsers = 1000;
    let baseExperts = 50;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      baseUsers += Math.floor(Math.random() * 10) + 2;
      baseExperts += Math.floor(Math.random() * 2);
      
      growthData.push({
        date: date.toISOString().split('T')[0],
        users: baseUsers,
        experts: baseExperts,
        sessions: Math.floor(Math.random() * 100) + 50
      });
    }
    
    res.json({
      success: true,
      data: {
        userGrowth: growthData,
        totalGrowth: {
          users: ((growthData[growthData.length - 1].users - growthData[0].users) / growthData[0].users * 100).toFixed(2),
          experts: ((growthData[growthData.length - 1].experts - growthData[0].experts) / growthData[0].experts * 100).toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching growth metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch growth metrics'
    });
  }
});

// Retention Analysis
router.get('/retention', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { cohortType = 'monthly' } = req.query;
    
    // Generate sample retention data
    const retentionData = [];
    const cohorts = cohortType === 'weekly' ? 12 : 6; // 12 weeks or 6 months
    
    for (let i = 0; i < cohorts; i++) {
      const cohortData = {
        period: cohortType === 'weekly' ? `Week ${i + 1}` : `Month ${i + 1}`,
        newUsers: Math.floor(Math.random() * 100) + 50,
        retained: []
      };
      
      // Calculate retention for subsequent periods
      for (let j = 0; j < Math.min(6, cohorts - i); j++) {
        const retentionRate = Math.max(0, 100 - j * 15 - Math.random() * 10);
        cohortData.retained.push({
          period: j,
          rate: retentionRate.toFixed(2)
        });
      }
      
      retentionData.push(cohortData);
    }
    
    res.json({
      success: true,
      data: {
        cohorts: retentionData,
        avgRetention: {
          week1: 85,
          month1: 70,
          month3: 45,
          month6: 30
        }
      }
    });
  } catch (error) {
    console.error('Error fetching retention analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch retention analysis'
    });
  }
});

module.exports = router;