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

// Platform analytics overview
router.get('/analytics/platform-overview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [totalExperts, pendingExperts, approvedExperts, totalUsers, totalPosts, flaggedPosts] = await Promise.all([
      Expert.countDocuments(),
      Expert.countDocuments({ accountStatus: 'pending' }),
      Expert.countDocuments({ accountStatus: 'approved' }),
      User.countDocuments(),
      Post.countDocuments(),
      Post.countDocuments({ flagged: true })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalExperts,
          pendingExperts,
          approvedExperts,
          expertApprovalRate: totalExperts > 0 ? (approvedExperts / totalExperts * 100) : 0,
          totalUsers,
          userGrowthRate: 15.2, // Mock data
          totalPosts,
          postGrowthRate: 8.5, // Mock data
          flaggedPosts,
          flaggedContentRate: totalPosts > 0 ? (flaggedPosts / totalPosts * 100) : 0
        },
        sessions: {
          total: 150, // Mock data
          averageDuration: 35,
          completionRate: 87,
          totalRevenue: 12500
        },
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