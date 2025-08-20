const express = require('express');
const router = express.Router();
const Expert = require('../models/Expert');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { nanoid } = require('nanoid');

// Enhanced Admin API Routes for flagship admin panel

// Get experts with advanced filtering and pagination
// GET /api/admin/experts/advanced
router.get('/experts/advanced', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      verificationLevel, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      dateFrom,
      dateTo
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Build query
    let query = {};
    
    // Status filter
    if (status && status !== 'all_statuses') {
      query.accountStatus = status;
    }
    
    // Verification level filter
    if (verificationLevel && verificationLevel !== 'all_levels') {
      query.verificationLevel = verificationLevel;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with aggregation for enhanced data
    const experts = await Expert.aggregate([
      { $match: query },
      { $sort: sort },
      { $skip: skip },
      { $limit: limitNum },
      {
        $addFields: {
          documentCount: { $size: '$verificationDocuments' },
          approvedDocuments: {
            $size: {
              $filter: {
                input: '$verificationDocuments',
                cond: { $eq: ['$$this.status', 'approved'] }
              }
            }
          },
          pendingDocuments: {
            $size: {
              $filter: {
                input: '$verificationDocuments',
                cond: { $eq: ['$$this.status', 'pending'] }
              }
            }
          },
          daysSinceApplication: {
            $divide: [
              { $subtract: [new Date(), '$createdAt'] },
              86400000
            ]
          }
        }
      }
    ]);
    
    const total = await Expert.countDocuments(query);
    
    // Calculate additional statistics
    const stats = await Expert.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalExperts: { $sum: 1 },
          pendingApplications: {
            $sum: { $cond: [{ $eq: ['$accountStatus', 'pending'] }, 1, 0] }
          },
          approvedExperts: {
            $sum: { $cond: [{ $eq: ['$accountStatus', 'approved'] }, 1, 0] }
          },
          rejectedApplications: {
            $sum: { $cond: [{ $eq: ['$accountStatus', 'rejected'] }, 1, 0] }
          },
          averageDocuments: { $avg: { $size: '$verificationDocuments' } }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        experts,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: skip + limitNum < total,
          hasPrev: parseInt(page) > 1
        },
        statistics: stats[0] || {
          totalExperts: 0,
          pendingApplications: 0,
          approvedExperts: 0,
          rejectedApplications: 0,
          averageDocuments: 0
        }
      }
    });
  } catch (err) {
    console.error('Enhanced experts query error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch experts data'
    });
  }
});

// Bulk actions on experts
// POST /api/admin/experts/bulk-action
router.post('/experts/bulk-action', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { expertIds, action, notes } = req.body;
    
    if (!expertIds || !Array.isArray(expertIds) || expertIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Expert IDs array is required'
      });
    }
    
    if (!action || !['approve', 'reject', 'suspend', 'reactivate'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Valid action is required'
      });
    }
    
    const updateData = {
      lastUpdated: new Date()
    };
    
    // Set status based on action
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
      case 'reactivate':
        updateData.accountStatus = 'approved';
        updateData.verified = true;
        break;
    }
    
    // Update experts
    const result = await Expert.updateMany(
      { id: { $in: expertIds } },
      {
        $set: updateData,
        $push: {
          adminNotes: {
            id: nanoid(8),
            note: notes || `Bulk action: ${action}`,
            category: 'bulk_action',
            date: new Date(),
            adminId: req.user.id,
            action: action
          }
        }
      }
    );
    
    // Send real-time notifications
    try {
      const io = req.app.get('io');
      if (io) {
        const experts = await Expert.find({ id: { $in: expertIds } });
        
        experts.forEach(expert => {
          // Notify each expert
          io.to(`expert_${expert.userId}`).emit('application_update', {
            type: 'bulk_action',
            action,
            message: `Your application status has been updated: ${action}`,
            timestamp: new Date()
          });
        });
        
        // Notify admin panel
        io.to('admin_panel').emit('bulk_action_completed', {
          action,
          expertCount: expertIds.length,
          adminId: req.user.id,
          timestamp: new Date()
        });
      }
    } catch (notificationError) {
      console.warn('Bulk notification failed:', notificationError.message);
    }
    
    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        action,
        expertIds,
        timestamp: new Date()
      }
    });
  } catch (err) {
    console.error('Bulk action error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Bulk action failed'
    });
  }
});

// Platform analytics overview
// GET /api/admin/analytics/platform-overview
router.get('/analytics/platform-overview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '24h':
        startDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
    
    // Get comprehensive analytics
    const analytics = await Promise.all([
      // Expert statistics
      Expert.aggregate([
        {
          $group: {
            _id: null,
            totalExperts: { $sum: 1 },
            pendingApplications: {
              $sum: { $cond: [{ $eq: ['$accountStatus', 'pending'] }, 1, 0] }
            },
            approvedExperts: {
              $sum: { $cond: [{ $eq: ['$accountStatus', 'approved'] }, 1, 0] }
            },
            rejectedApplications: {
              $sum: { $cond: [{ $eq: ['$accountStatus', 'rejected'] }, 1, 0] }
            },
            suspendedExperts: {
              $sum: { $cond: [{ $eq: ['$accountStatus', 'suspended'] }, 1, 0] }
            }
          }
        }
      ]),
      
      // Recent applications (last 7 days)
      Expert.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // User statistics
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            adminUsers: {
              $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
            },
            expertUsers: {
              $sum: { $cond: [{ $eq: ['$role', 'beacon'] }, 1, 0] }
            },
            regularUsers: {
              $sum: { $cond: [{ $eq: ['$role', 'shadow'] }, 1, 0] }
            }
          }
        }
      ])
    ]);
    
    const [expertStats, applicationTrend, userStats] = analytics;
    
    res.json({
      success: true,
      data: {
        timeframe,
        experts: expertStats[0] || {
          totalExperts: 0,
          pendingApplications: 0,
          approvedExperts: 0,
          rejectedApplications: 0,
          suspendedExperts: 0
        },
        users: userStats[0] || {
          totalUsers: 0,
          adminUsers: 0,
          expertUsers: 0,
          regularUsers: 0
        },
        applicationTrend: applicationTrend || [],
        generatedAt: new Date()
      }
    });
  } catch (err) {
    console.error('Platform analytics error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform analytics'
    });
  }
});

// Real-time expert application monitoring
// GET /api/admin/monitoring/expert-applications
router.get('/monitoring/expert-applications', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get recent applications requiring attention
    const urgentApplications = await Expert.find({
      accountStatus: 'pending',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('id name email specialization createdAt verificationDocuments');
    
    // Get application statistics for the dashboard
    const stats = await Expert.aggregate([
      {
        $group: {
          _id: '$accountStatus',
          count: { $sum: 1 },
          avgProcessingTime: {
            $avg: {
              $cond: [
                { $ne: ['$lastUpdated', '$createdAt'] },
                { $subtract: ['$lastUpdated', '$createdAt'] },
                null
              ]
            }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        urgentApplications,
        statistics: stats,
        lastUpdated: new Date()
      }
    });
  } catch (err) {
    console.error('Application monitoring error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application monitoring data'
    });
  }
});

module.exports = router;