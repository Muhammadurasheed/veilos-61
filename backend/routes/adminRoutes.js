
const express = require('express');
const router = express.Router();
const Expert = require('../models/Expert');
const Post = require('../models/Post');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all unverified experts
// GET /api/admin/experts/unverified
router.get('/experts/unverified', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const experts = await Expert.find({ verified: false });
    
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

// Verify expert
// PATCH /api/admin/experts/:id/verify
router.patch('/experts/:id/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { verificationLevel, status, feedback } = req.body;
    
    // Validation
    if (!verificationLevel || !status) {
      return res.status(400).json({
        success: false,
        error: 'Verification level and status are required'
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
    expert.verificationLevel = verificationLevel;
    expert.verified = status === 'approved';
    expert.accountStatus = status;
    
    // Update all documents to approved/rejected
    expert.verificationDocuments.forEach(doc => {
      doc.status = status;
    });
    
    await expert.save();
    
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
    // Note: In a real app, we'd verify the password with bcrypt
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
    
    // For demo purposes, we'll return a token without proper password validation
    // In a real app, you would verify the password with bcrypt
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
        token
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
