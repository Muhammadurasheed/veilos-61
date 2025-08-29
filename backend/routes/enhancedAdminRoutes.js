const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const Expert = require('../models/Expert');
const Post = require('../models/Post');
const router = express.Router();

// Enhanced expert management with advanced filtering
router.get('/experts/advanced', authMiddleware, async (req, res) => {
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

    let query = {};
    
    // Apply filters
    if (status && status !== 'all_statuses') {
      query.accountStatus = status;
    }
    
    if (verificationLevel && verificationLevel !== 'all_levels') {
      query.verificationLevel = verificationLevel;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const sortObj = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [experts, total] = await Promise.all([
      Expert.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Expert.countDocuments(query)
    ]);

    return res.success('Experts retrieved successfully', {
      experts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Enhanced experts fetch error:', error);
    return res.error('Failed to fetch experts', 500);
  }
});

// Bulk expert actions
router.post('/experts/bulk-action', authMiddleware, async (req, res) => {
  try {
    const { expertIds, action, notes } = req.body;

    if (!expertIds || !Array.isArray(expertIds) || expertIds.length === 0) {
      return res.error('Expert IDs are required', 400);
    }

    if (!['approve', 'reject', 'suspend', 'reactivate'].includes(action)) {
      return res.error('Invalid action', 400);
    }

    const updateData = {};
    
    switch (action) {
      case 'approve':
        updateData.accountStatus = 'approved';
        updateData.verified = true;
        break;
      case 'reject':
        updateData.accountStatus = 'rejected';
        break;
      case 'suspend':
        updateData.accountStatus = 'suspended';
        break;
      case 'reactivate':
        updateData.accountStatus = 'approved';
        break;
    }

    // Add admin note
    if (notes) {
      updateData.$push = {
        adminNotes: {
          id: `note-${Date.now()}`,
          note: notes,
          category: 'bulk_action',
          date: new Date(),
          adminId: req.user.id,
          action
        }
      };
    }

    const result = await Expert.updateMany(
      { id: { $in: expertIds } },
      updateData
    );

    return res.success(`Bulk action completed: ${result.modifiedCount} experts updated`, {
      action,
      modifiedCount: result.modifiedCount,
      expertIds
    });

  } catch (error) {
    console.error('Bulk expert action error:', error);
    return res.error('Failed to perform bulk action', 500);
  }
});

// Platform overview analytics
router.get('/analytics/platform-overview', authMiddleware, async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    // Calculate date range
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
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Aggregate platform stats
    const [
      totalExperts,
      pendingExperts,
      approvedExperts,
      totalPosts,
      recentExperts,
      recentPosts
    ] = await Promise.all([
      Expert.countDocuments(),
      Expert.countDocuments({ accountStatus: 'pending' }),
      Expert.countDocuments({ accountStatus: 'approved' }),
      Post.countDocuments(),
      Expert.countDocuments({ createdAt: { $gte: startDate } }),
      Post.countDocuments({ timestamp: { $gte: startDate.toISOString() } })
    ]);

    const overview = {
      experts: {
        total: totalExperts,
        pending: pendingExperts,
        approved: approvedExperts,
        recent: recentExperts
      },
      content: {
        totalPosts,
        recentPosts
      },
      timeframe,
      generatedAt: new Date().toISOString()
    };

    return res.success('Platform overview retrieved successfully', overview);

  } catch (error) {
    console.error('Platform overview error:', error);
    return res.error('Failed to get platform overview', 500);
  }
});

// Flagged content management
router.get('/content/flagged', authMiddleware, async (req, res) => {
  try {
    const { priority, type, page = 1, limit = 20 } = req.query;
    
    let query = { flagged: true };
    
    if (type) {
      query.type = type; // Assuming posts have a type field
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Post.countDocuments(query)
    ]);

    return res.success('Flagged content retrieved successfully', {
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Flagged content fetch error:', error);
    return res.error('Failed to fetch flagged content', 500);
  }
});

// Resolve flagged content
router.post('/content/:contentId/resolve', authMiddleware, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { action, notes } = req.body;

    if (!['approve', 'remove'].includes(action)) {
      return res.error('Invalid action', 400);
    }

    const updateData = {
      flagged: false,
      status: action === 'approve' ? 'active' : 'hidden',
      resolvedAt: new Date(),
      resolvedBy: req.user.id
    };

    if (notes) {
      updateData.moderationNotes = notes;
    }

    const post = await Post.findOneAndUpdate(
      { id: contentId },
      updateData,
      { new: true }
    );

    if (!post) {
      return res.error('Content not found', 404);
    }

    return res.success(`Content ${action}d successfully`, { post });

  } catch (error) {
    console.error('Content resolution error:', error);
    return res.error('Failed to resolve content', 500);
  }
});

module.exports = router;