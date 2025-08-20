
const express = require('express');
const router = express.Router();
const Expert = require('../models/Expert');
const Post = require('../models/Post');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { notifyExpertStatusUpdate, notifyAdminPanelUpdate } = require('../socket/socketHandler');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all unverified experts with enhanced filtering
// GET /api/admin/experts/unverified
router.get('/experts/unverified', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Build query
    let query = { verified: false };
    if (status && status !== 'all_statuses') {
      query.accountStatus = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const experts = await Expert.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);
    
    const total = await Expert.countDocuments(query);
    
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
        }
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get pending experts for approval
// GET /api/admin/experts/pending
router.get('/experts/pending', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const experts = await Expert.find({ accountStatus: 'pending' });
    
    res.json({
      success: true,
      data: experts
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Verify expert with notifications
// PATCH /api/admin/experts/:id/verify
router.patch('/experts/:id/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { verificationLevel, status, feedback, adminNotes } = req.body;
    
    // Validation
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const expert = await Expert.findOne({ id: req.params.id });
    
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found'
      });
    }
    
    // Update expert
    if (verificationLevel) {
      expert.verificationLevel = verificationLevel;
    }
    expert.verified = status === 'approved';
    expert.accountStatus = status;
    expert.lastUpdated = new Date();
    
    // Add admin note
    if (adminNotes || feedback) {
      expert.adminNotes.push({
        id: require('nanoid').nanoid(8),
        note: adminNotes || feedback,
        category: 'verification',
        date: new Date(),
        adminId: req.user.id,
        action: status
      });
    }
    
    // Update all documents to approved/rejected
    expert.verificationDocuments.forEach(doc => {
      doc.status = status === 'approved' ? 'approved' : 'rejected';
    });
    
    await expert.save();

    // Send real-time notifications
    notifyExpertStatusUpdate(expert.id, status, adminNotes || feedback);
    notifyAdminPanelUpdate({
      type: 'expert_verified',
      expertId: expert.id,
      status: status,
      verificationLevel
    });
    
    res.json({
      success: true,
      data: {
        expert: {
          id: expert.id,
          name: expert.name,
          status: expert.accountStatus,
          verificationLevel: expert.verificationLevel,
          verified: expert.verified
        },
        notification: {
          sent: true,
          type: status === 'approved' ? 'approval' : 'rejection'
        }
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get all experts (for admin)
// GET /api/admin/experts
router.get('/experts', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const experts = await Expert.find();
    
    res.json({
      success: true,
      data: experts
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get all flagged content
// GET /api/admin/flagged
router.get('/flagged', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ flagged: true });
    
    res.json({
      success: true,
      data: {
        posts
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Resolve flagged content
// POST /api/admin/flagged/:id
router.post('/flagged/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { action } = req.body;
    
    if (!action || !['approve', 'remove'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Valid action is required (approve or remove)'
      });
    }
    
    const post = await Post.findOne({ id: req.params.id, flagged: true });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Flagged post not found'
      });
    }
    
    if (action === 'approve') {
      // Unflag post
      post.flagged = false;
      post.flagReason = null;
      await post.save();
    } else {
      // Remove post
      await Post.deleteOne({ id: req.params.id });
    }
    
    res.json({
      success: true,
      data: {
        success: true
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Admin login
// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Find user with admin role
    const user = await User.findOne({ 
      email: email.toLowerCase(), 
      role: 'admin' 
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    const payload = {
      user: {
        id: user.id
      }
    };
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          alias: user.alias
        }
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Admin token verification
// GET /api/admin/verify
router.get('/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id, role: 'admin' });
    
    if (!user) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          alias: user.alias
        }
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
