
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const Expert = require('../models/Expert');
const User = require('../models/User');
const { notifyExpertStatusUpdate } = require('../socket/socketHandler');

// Admin login route (backup route)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.error('Email and password are required', 400);
    }

    // Find admin user
    const user = await User.findOne({ 
      email, 
      role: 'admin' 
    });

    if (!user || !user.passwordHash) {
      return res.error('Invalid admin credentials', 401);
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.error('Invalid admin credentials', 401);
    }

    // Generate tokens
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      { expiresIn: '7d' }
    );

    // Update user with refresh token and last login
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    res.success('Admin login successful', {
      user: {
        id: user.id,
        alias: user.alias,
        email: user.email,
        role: user.role,
        avatarIndex: user.avatarIndex,
        avatarUrl: user.avatarUrl
      },
      token,
      refreshToken
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.error('Admin login failed: ' + error.message, 500);
  }
});

// Get all experts with enhanced details for admin management
router.get('/experts/advanced', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      verificationLevel, 
      specialization,
      search 
    } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.accountStatus = status;
    if (verificationLevel && verificationLevel !== 'all') filter.verificationLevel = verificationLevel;
    if (specialization && specialization !== 'all') filter.specialization = new RegExp(specialization, 'i');
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { specialization: new RegExp(search, 'i') }
      ];
    }

    const experts = await Expert.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Expert.countDocuments(filter);

    // Enhance expert data with additional computed fields
    const enhancedExperts = experts.map(expert => ({
      ...expert,
      documentsCount: expert.verificationDocuments?.length || 0,
      approvedDocuments: expert.verificationDocuments?.filter(doc => doc.status === 'approved')?.length || 0,
      pendingDocuments: expert.verificationDocuments?.filter(doc => doc.status === 'pending')?.length || 0,
      completionScore: calculateProfileCompletion(expert),
      riskLevel: calculateRiskLevel(expert)
    }));

    res.json({
      success: true,
      data: {
        experts: enhancedExperts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          total: await Expert.countDocuments(),
          pending: await Expert.countDocuments({ accountStatus: 'pending' }),
          approved: await Expert.countDocuments({ accountStatus: 'approved' }),
          rejected: await Expert.countDocuments({ accountStatus: 'rejected' })
        }
      }
    });
  } catch (error) {
    console.error('Enhanced experts fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch experts data'
    });
  }
});

// Secure document viewer with proper CORS handling
router.get('/documents/view/:filename', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadsDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadsDir, filename);

    // Security check - ensure file is within uploads directory
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - invalid file path'
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileExtension = path.extname(filename).toLowerCase();
    
    // Set appropriate content type
    let contentType = 'application/octet-stream';
    switch (fileExtension) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
    }

    // Set CORS headers for frontend access
    res.set({
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:8080',
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error reading document'
        });
      }
    });

  } catch (error) {
    console.error('Document view error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load document'
    });
  }
});

// Update expert verification status with comprehensive handling
router.patch('/experts/:expertId/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { expertId } = req.params;
    const { verificationLevel, status, feedback, documentUpdates } = req.body;

    const expert = await Expert.findOne({ id: expertId });
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found'
      });
    }

    // Update expert verification
    expert.verificationLevel = verificationLevel || expert.verificationLevel;
    expert.accountStatus = status || expert.accountStatus;
    expert.verified = status === 'approved';
    
    // Add admin note
    if (feedback) {
      expert.adminNotes = expert.adminNotes || [];
      expert.adminNotes.push({
        id: `note-${Date.now()}`,
        note: feedback,
        category: 'verification',
        date: new Date(),
        adminId: req.user.id,
        action: status
      });
    }

    // Update individual documents if provided
    if (documentUpdates && Array.isArray(documentUpdates)) {
      documentUpdates.forEach(update => {
        const docIndex = expert.verificationDocuments.findIndex(doc => doc.id === update.documentId);
        if (docIndex !== -1) {
          expert.verificationDocuments[docIndex].status = update.status;
        }
      });
    }

    expert.lastUpdated = new Date();
    await expert.save();

    // Send real-time notification
    notifyExpertStatusUpdate(expertId, status, feedback);

    res.json({
      success: true,
      message: 'Expert verification updated successfully',
      data: expert
    });

  } catch (error) {
    console.error('Expert verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update expert verification'
    });
  }
});

// Bulk expert actions for efficiency
router.post('/experts/bulk-action', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { expertIds, action, notes } = req.body;

    if (!expertIds || !Array.isArray(expertIds) || expertIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Expert IDs are required'
      });
    }

    const updates = {};
    const adminNote = {
      id: `note-${Date.now()}`,
      note: notes || `Bulk ${action} action`,
      category: 'bulk_action',
      date: new Date(),
      adminId: req.user.id,
      action
    };

    switch (action) {
      case 'approve':
        updates.accountStatus = 'approved';
        updates.verified = true;
        updates.verificationLevel = 'blue';
        break;
      case 'reject':
        updates.accountStatus = 'rejected';
        updates.verified = false;
        break;
      case 'suspend':
        updates.accountStatus = 'suspended';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

    updates.lastUpdated = new Date();
    updates.$push = { adminNotes: adminNote };

    const result = await Expert.updateMany(
      { id: { $in: expertIds } },
      updates
    );

    // Send notifications to each expert
    expertIds.forEach(expertId => {
      notifyExpertStatusUpdate(expertId, action, notes);
    });

    res.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk action'
    });
  }
});

// Enhanced statistics and analytics
router.get('/dashboard/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [
      totalExperts,
      pendingExperts,
      approvedExperts,
      rejectedExperts,
      totalUsers,
      activeUsers,
      recentApplications,
      topSpecializations
    ] = await Promise.all([
      Expert.countDocuments(),
      Expert.countDocuments({ accountStatus: 'pending' }),
      Expert.countDocuments({ accountStatus: 'approved' }),
      Expert.countDocuments({ accountStatus: 'rejected' }),
      User.countDocuments(),
      User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      Expert.find({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).countDocuments(),
      Expert.aggregate([
        { $group: { _id: '$specialization', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        experts: {
          total: totalExperts,
          pending: pendingExperts,
          approved: approvedExperts,
          rejected: rejectedExperts,
          recentApplications
        },
        users: {
          total: totalUsers,
          active: activeUsers
        },
        specializations: topSpecializations,
        trends: {
          approvalRate: totalExperts > 0 ? ((approvedExperts / totalExperts) * 100).toFixed(1) : 0,
          rejectionRate: totalExperts > 0 ? ((rejectedExperts / totalExperts) * 100).toFixed(1) : 0
        }
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

// Admin verify route for authentication check
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-auth-token'];
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ id: decoded.userId });
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied - admin role required' });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          alias: user.alias,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ success: false, error: 'Token verification failed' });
  }
});

// Platform analytics overview
router.get('/analytics/platform-overview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const days = timeframe === '30d' ? 30 : timeframe === '24h' ? 1 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      expertStats,
      userStats,
      sessionStats,
      recentActivity
    ] = await Promise.all([
      Expert.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            byStatus: [
              { $group: { _id: "$accountStatus", count: { $sum: 1 } } }
            ],
            byVerification: [
              { $group: { _id: "$verificationLevel", count: { $sum: 1 } } }
            ],
            recent: [
              { $match: { createdAt: { $gte: startDate } } },
              { $count: "count" }
            ]
          }
        }
      ]),
      User.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            active: [
              { $match: { lastActive: { $gte: startDate } } },
              { $count: "count" }
            ],
            recent: [
              { $match: { createdAt: { $gte: startDate } } },
              { $count: "count" }
            ]
          }
        }
      ]),
      // Session stats would go here when Session model is available
      Promise.resolve({ bookings: 0, completed: 0 }),
      Expert.find({ createdAt: { $gte: startDate } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name specialization accountStatus createdAt')
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          experts: {
            total: expertStats[0]?.total[0]?.count || 0,
            recent: expertStats[0]?.recent[0]?.count || 0,
            byStatus: expertStats[0]?.byStatus || [],
            byVerification: expertStats[0]?.byVerification || []
          },
          users: {
            total: userStats[0]?.total[0]?.count || 0,
            active: userStats[0]?.active[0]?.count || 0,
            recent: userStats[0]?.recent[0]?.count || 0
          },
          sessions: sessionStats,
          timeframe: timeframe
        },
        recentActivity
      }
    });

  } catch (error) {
    console.error('Platform overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform overview'
    });
  }
});

// Helper functions
function calculateProfileCompletion(expert) {
  let score = 0;
  const maxScore = 100;

  // Basic info (30%)
  if (expert.name) score += 5;
  if (expert.email) score += 5;
  if (expert.bio) score += 10;
  if (expert.specialization) score += 10;

  // Documents (25%)
  if (expert.verificationDocuments?.length > 0) score += 15;
  if (expert.verificationDocuments?.some(doc => doc.status === 'approved')) score += 10;

  // Experience (20%)
  if (expert.workExperience?.length > 0) score += 10;
  if (expert.education?.length > 0) score += 10;

  // Availability & Preferences (15%)
  if (expert.availability?.length > 0) score += 8;
  if (expert.sessionPreferences) score += 7;

  // Additional info (10%)
  if (expert.skills?.length > 0) score += 5;
  if (expert.certifications?.length > 0) score += 5;

  return Math.min(score, maxScore);
}

function calculateRiskLevel(expert) {
  let riskScore = 0;

  // No documents submitted
  if (!expert.verificationDocuments?.length) riskScore += 30;

  // All documents rejected
  if (expert.verificationDocuments?.length > 0 && 
      expert.verificationDocuments.every(doc => doc.status === 'rejected')) {
    riskScore += 40;
  }

  // Incomplete profile
  if (!expert.bio || expert.bio.length < 50) riskScore += 10;
  if (!expert.workExperience?.length) riskScore += 10;
  if (!expert.education?.length) riskScore += 10;

  if (riskScore >= 50) return 'high';
  if (riskScore >= 25) return 'medium';
  return 'low';
}

module.exports = router;
