const express = require('express');
const router = express.Router();
const HostSession = require('../models/HostSession');
const SanctuarySession = require('../models/SanctuarySession');
const { authMiddleware } = require('../middleware/auth');

// Get all sanctuary sessions - both authenticated and anonymous
router.get('/my-sanctuaries', async (req, res) => {
  try {
    let sanctuaries = [];
    
    // Handle authenticated users
    if (req.headers['x-auth-token']) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(req.headers['x-auth-token'], process.env.JWT_SECRET);
        const userId = decoded.user.id;
        
        const userSanctuaries = await SanctuarySession.find({
          hostId: userId,
          isActive: true
        }).sort({ createdAt: -1 });
        
        sanctuaries = [...sanctuaries, ...userSanctuaries];
      } catch (authErr) {
        console.log('Invalid auth token, proceeding as anonymous');
      }
    }
    
    // Also return anonymous sanctuaries based on host tokens if provided
    const hostTokens = req.query.hostTokens ? req.query.hostTokens.split(',') : [];
    
    if (hostTokens.length > 0) {
      const HostSession = require('../models/HostSession');
      
      for (const token of hostTokens) {
        try {
          const hostSession = await HostSession.findOne({
            hostToken: token,
            isActive: true,
            expiresAt: { $gt: new Date() }
          });
          
          if (hostSession) {
            const sanctuary = await SanctuarySession.findOne({
              id: hostSession.sanctuaryId,
              isActive: true
            });
            
            if (sanctuary && !sanctuaries.find(s => s.id === sanctuary.id)) {
              sanctuaries.push(sanctuary);
            }
          }
        } catch (tokenErr) {
          console.warn('Invalid host token:', token);
        }
      }
    }
    
    // Enhanced stats calculation
    const sanctuariesWithStats = sanctuaries.map(sanctuary => {
      const now = new Date();
      const expiryDate = new Date(sanctuary.expiresAt);
      const isExpired = expiryDate <= now;
      const timeRemainingMs = Math.max(0, expiryDate.getTime() - now.getTime());
      const timeRemainingMinutes = Math.floor(timeRemainingMs / (1000 * 60));
      
      // Calculate engagement metrics
      const submissions = sanctuary.submissions || [];
      const participants = sanctuary.participants || [];
      const uniqueParticipants = new Set(submissions.map(s => s.alias)).size;
      
      // Calculate activity score (submissions in last hour)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const recentActivity = submissions.filter(s => new Date(s.timestamp) > oneHourAgo).length;
      
      return {
        id: sanctuary.id,
        topic: sanctuary.topic,
        description: sanctuary.description,
        emoji: sanctuary.emoji,
        mode: sanctuary.mode,
        createdAt: sanctuary.createdAt,
        expiresAt: sanctuary.expiresAt,
        isExpired,
        submissionCount: submissions.length,
        participantCount: participants.length,
        uniqueParticipants,
        recentActivity,
        lastActivity: submissions.length > 0 ? 
          submissions[submissions.length - 1].timestamp : 
          sanctuary.createdAt,
        timeRemaining: timeRemainingMinutes,
        engagementScore: submissions.length * 2 + uniqueParticipants * 3 + recentActivity * 5,
        averageMessageLength: submissions.length > 0 ? 
          Math.round(submissions.reduce((sum, s) => sum + s.message.length, 0) / submissions.length) : 0,
        hostToken: sanctuary.hostToken, // Include for frontend access
        status: isExpired ? 'expired' : timeRemainingMinutes < 60 ? 'expiring_soon' : 'active'
      };
    });
    
    // Sort by engagement score and recency
    sanctuariesWithStats.sort((a, b) => {
      if (a.status !== b.status) {
        const statusOrder = { active: 0, expiring_soon: 1, expired: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.engagementScore - a.engagementScore || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Calculate platform analytics
    const analytics = {
      total: sanctuariesWithStats.length,
      active: sanctuariesWithStats.filter(s => s.status === 'active').length,
      expiringSoon: sanctuariesWithStats.filter(s => s.status === 'expiring_soon').length,
      expired: sanctuariesWithStats.filter(s => s.status === 'expired').length,
      totalMessages: sanctuariesWithStats.reduce((sum, s) => sum + s.submissionCount, 0),
      totalParticipants: sanctuariesWithStats.reduce((sum, s) => sum + s.uniqueParticipants, 0),
      averageEngagement: sanctuariesWithStats.length > 0 ? 
        Math.round(sanctuariesWithStats.reduce((sum, s) => sum + s.engagementScore, 0) / sanctuariesWithStats.length) : 0,
      mostActiveSession: sanctuariesWithStats.length > 0 ? sanctuariesWithStats[0] : null
    };
    
    res.json({
      success: true,
      data: sanctuariesWithStats,
      analytics,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Error fetching sanctuaries:', err);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving sanctuaries',
      timestamp: new Date().toISOString()
    });
  }
});

// Get sanctuary performance analytics
router.get('/sanctuary-analytics/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const hostToken = req.query.hostToken || req.headers['x-host-token'];
    
    // Verify host authorization
    let authorized = false;
    
    if (hostToken) {
      const HostSession = require('../models/HostSession');
      const hostSession = await HostSession.findOne({
        sanctuaryId: sessionId,
        hostToken,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });
      authorized = !!hostSession;
    }
    
    if (!authorized && req.headers['x-auth-token']) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(req.headers['x-auth-token'], process.env.JWT_SECRET);
        const sanctuary = await SanctuarySession.findOne({
          id: sessionId,
          hostId: decoded.user.id
        });
        authorized = !!sanctuary;
      } catch (authErr) {
        // Continue unauthorized
      }
    }
    
    if (!authorized) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized access to sanctuary analytics'
      });
    }
    
    const sanctuary = await SanctuarySession.findOne({ id: sessionId });
    
    if (!sanctuary) {
      return res.status(404).json({
        success: false,
        error: 'Sanctuary not found'
      });
    }
    
    const submissions = sanctuary.submissions || [];
    const participants = sanctuary.participants || [];
    
    // Time-based analytics
    const now = new Date();
    const createdAt = new Date(sanctuary.createdAt);
    const sessionDuration = now.getTime() - createdAt.getTime();
    const hours = Math.floor(sessionDuration / (1000 * 60 * 60));
    
    // Hourly submission breakdown
    const hourlyStats = {};
    submissions.forEach(submission => {
      const hour = new Date(submission.timestamp).getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });
    
    // Message length analysis
    const messageLengths = submissions.map(s => s.message.length);
    const avgLength = messageLengths.length > 0 ? 
      Math.round(messageLengths.reduce((sum, len) => sum + len, 0) / messageLengths.length) : 0;
    
    // Engagement patterns
    const uniqueAliases = new Set(submissions.map(s => s.alias));
    const repeatParticipants = submissions.reduce((acc, submission) => {
      const count = submissions.filter(s => s.alias === submission.alias).length;
      if (count > 1) acc.add(submission.alias);
      return acc;
    }, new Set());
    
    // Recent activity (last 4 hours)
    const recentCutoff = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const recentSubmissions = submissions.filter(s => new Date(s.timestamp) > recentCutoff);
    
    const analytics = {
      sanctuary: {
        id: sanctuary.id,
        topic: sanctuary.topic,
        status: new Date(sanctuary.expiresAt) > now ? 'active' : 'expired',
        createdAt: sanctuary.createdAt,
        expiresAt: sanctuary.expiresAt,
        sessionDurationHours: hours
      },
      engagement: {
        totalSubmissions: submissions.length,
        uniqueParticipants: uniqueAliases.size,
        repeatParticipants: repeatParticipants.size,
        engagementRate: uniqueAliases.size > 0 ? 
          Math.round((submissions.length / uniqueAliases.size) * 100) / 100 : 0,
        averageMessageLength: avgLength,
        recentActivity: recentSubmissions.length
      },
      timeline: {
        hourlyBreakdown: hourlyStats,
        peakHour: Object.keys(hourlyStats).reduce((peak, hour) => 
          (hourlyStats[hour] > (hourlyStats[peak] || 0)) ? hour : peak, '0'),
        firstSubmission: submissions.length > 0 ? submissions[0].timestamp : null,
        lastSubmission: submissions.length > 0 ? submissions[submissions.length - 1].timestamp : null
      },
      performance: {
        submissionsPerHour: hours > 0 ? Math.round((submissions.length / hours) * 100) / 100 : 0,
        participationRate: participants.length > 0 ? 
          Math.round((uniqueAliases.size / participants.length) * 100) : 0,
        retentionRate: uniqueAliases.size > 0 ? 
          Math.round((repeatParticipants.size / uniqueAliases.size) * 100) : 0
      }
    };
    
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Error fetching sanctuary analytics:', err);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving analytics'
    });
  }
});

// Recover sanctuary access by host token  
router.post('/recover-by-token', async (req, res) => {
  try {
    const { hostToken, sanctuaryId } = req.body;
    
    if (!hostToken || !sanctuaryId) {
      return res.status(400).json({
        success: false,
        error: 'Host token and sanctuary ID are required'
      });
    }
    
    // Find the host session
    const hostSession = await HostSession.findOne({
      hostToken,
      sanctuaryId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!hostSession) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired host token'
      });
    }
    
    // Find the sanctuary
    const sanctuary = await SanctuarySession.findOne({
      id: sanctuaryId,
      isActive: true
    });
    
    if (!sanctuary) {
      return res.status(404).json({
        success: false,
        error: 'Sanctuary not found or expired'
      });
    }
    
    // Update last accessed time
    await hostSession.updateAccess();
    
    res.json({
      success: true,
      sanctuary: {
        id: sanctuary.id,
        topic: sanctuary.topic,
        description: sanctuary.description,
        emoji: sanctuary.emoji,
        mode: sanctuary.mode,
        submissionCount: sanctuary.submissions?.length || 0
      }
    });
    
  } catch (err) {
    console.error('Host token recovery error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during recovery'
    });
  }
});

// Recover sanctuary access by email (placeholder for future implementation)
router.post('/recover-by-email', async (req, res) => {
  try {
    const { email, sanctuaryId } = req.body;
    
    // This would typically send an email with recovery link
    // For now, return success message
    res.json({
      success: true,
      message: 'Recovery instructions sent to email (feature coming soon)'
    });
    
  } catch (err) {
    console.error('Email recovery error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during email recovery'
    });
  }
});

module.exports = router;