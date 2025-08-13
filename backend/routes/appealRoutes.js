const express = require('express');
const router = express.Router();
const ContentAppeal = require('../models/ContentAppeal');
const Post = require('../models/Post');
const { authMiddleware } = require('../middleware/auth');

// Submit content appeal
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { postId, appealReason } = req.body;
    const userId = req.user.id;
    const userAlias = req.user.alias;
    
    if (!postId || !appealReason) {
      return res.status(400).json({
        success: false,
        error: 'Post ID and appeal reason are required'
      });
    }
    
    // Find the flagged post
    const post = await Post.findOne({ id: postId, userId, flagged: true });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Flagged post not found or you do not have permission to appeal it'
      });
    }
    
    // Check if appeal already exists
    const existingAppeal = await ContentAppeal.findOne({ postId, userId });
    
    if (existingAppeal) {
      return res.status(400).json({
        success: false,
        error: 'Appeal for this content already exists'
      });
    }
    
    const appeal = new ContentAppeal({
      postId,
      userId,
      userAlias,
      originalContent: post.content,
      flagReason: post.flagReason,
      appealReason
    });
    
    await appeal.save();
    
    res.status(201).json({
      success: true,
      data: appeal
    });
  } catch (err) {
    console.error('Submit appeal error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to submit appeal'
    });
  }
});

// Get user's appeals
router.get('/my-appeals', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const appeals = await ContentAppeal.find({ userId })
      .sort({ timestamp: -1 });
    
    res.json({
      success: true,
      data: appeals
    });
  } catch (err) {
    console.error('Get user appeals error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appeals'
    });
  }
});

// Get appeal details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const appeal = await ContentAppeal.findOne({ id, userId });
    
    if (!appeal) {
      return res.status(404).json({
        success: false,
        error: 'Appeal not found'
      });
    }
    
    res.json({
      success: true,
      data: appeal
    });
  } catch (err) {
    console.error('Get appeal error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appeal'
    });
  }
});

// Admin routes for managing appeals
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    // In a real app, check if user is admin
    const { status = 'pending', limit = 20, offset = 0 } = req.query;
    
    let query = {};
    if (status !== 'all') {
      query.status = status;
    }
    
    const appeals = await ContentAppeal.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await ContentAppeal.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        appeals,
        total,
        hasMore: (parseInt(offset) + appeals.length) < total
      }
    });
  } catch (err) {
    console.error('Get all appeals error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appeals'
    });
  }
});

// Admin: Review appeal
router.put('/admin/:id/review', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;
    const reviewerId = req.user.id;
    
    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    const appeal = await ContentAppeal.findOneAndUpdate(
      { id },
      {
        status,
        reviewedBy: reviewerId,
        reviewDate: new Date(),
        reviewNotes
      },
      { new: true }
    );
    
    if (!appeal) {
      return res.status(404).json({
        success: false,
        error: 'Appeal not found'
      });
    }
    
    // If appeal is approved, unflag the original post
    if (status === 'approved') {
      await Post.findOneAndUpdate(
        { id: appeal.postId },
        { 
          flagged: false,
          flagReason: null
        }
      );
    }
    
    res.json({
      success: true,
      data: appeal
    });
  } catch (err) {
    console.error('Review appeal error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to review appeal'
    });
  }
});

module.exports = router;