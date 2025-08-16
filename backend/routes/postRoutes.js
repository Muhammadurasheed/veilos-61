
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const { moderateContent } = require('../middleware/contentModeration');
const { aiModerateContent } = require('../middleware/aiContentModeration');

// Create post
// POST /api/posts
router.post('/', authMiddleware, aiModerateContent, moderateContent, async (req, res) => {
  try {
    const {
      content,
      feeling,
      topic,
      wantsExpertHelp
    } = req.body;
    
    // Enhanced logging for debugging
    console.log('Creating post:', {
      userId: req.user.id,
      userAlias: req.user.alias,
      contentLength: content?.length || 0,
      feeling,
      topic,
      wantsExpertHelp: Boolean(wantsExpertHelp)
    });
    
    // Validation
    if (!content) {
      console.log('Post creation failed: Missing content');
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    // Create post
    const post = new Post({
      userId: req.user.id,
      userAlias: req.user.alias,
      userAvatarIndex: req.user.avatarIndex,
      content,
      feeling,
      topic,
      wantsExpertHelp: wantsExpertHelp || false,
      likes: [],
      comments: []
    });
    
    // Check if content was flagged by AI moderation (priority)
    if (req.aiModeration?.flagged || req.aiModeration?.recommendedAction === 'flag') {
      post.flagged = true;
      post.flagReason = req.aiModeration.flagReason || 'ai_flagged_content';
    }
    // Fallback to basic moderation if AI didn't flag
    else if (req.contentModeration?.flagged) {
      post.flagged = true;
      post.flagReason = req.contentModeration.flagReason;
    }
    
    // Handle urgent cases
    if (req.urgentFlag || req.aiModeration?.severity === 'urgent') {
      post.flagged = true;
      post.flagReason = 'urgent_review_needed';
      // In production, trigger immediate alert to moderation team
      console.log('URGENT: Post requires immediate review:', post.id);
    }
    
    await post.save();
    
    console.log('Post created successfully:', {
      postId: post.id,
      userId: req.user.id,
      flagged: post.flagged
    });
    
    res.json({
      success: true,
      data: post
    });
  } catch (err) {
    console.error('Post creation error:', {
      error: err.message,
      stack: err.stack,
      userId: req.user?.id,
      userAlias: req.user?.alias,
      contentLength: req.body?.content?.length || 0
    });
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get all posts
// GET /api/posts
router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    let query = {};
    
    if (req.user) {
      // For authenticated users, show:
      // - All non-flagged posts 
      // - Their own posts (even if flagged)
      const isAdmin = req.user.role === 'admin';
      
      if (isAdmin) {
        // Admins see everything
        query = {};
      } else {
        // Regular users see non-flagged posts OR their own posts
        query = {
          $or: [
            { flagged: { $ne: true } },
            { userId: req.user.id }
          ]
        };
      }
    } else {
      // Anonymous users only see non-flagged posts
      query = { flagged: { $ne: true } };
    }
    
    const posts = await Post.find(query)
      .sort({ timestamp: -1 });
    
    res.json({
      success: true,
      data: posts
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get single post
// GET /api/posts/:id
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    // Check if post is flagged and user is not admin or author
    if (post.flagged && (!req.user || (req.user.role !== 'admin' && req.user.id !== post.userId))) {
      return res.status(403).json({
        success: false,
        error: 'This content has been flagged for review'
      });
    }
    
    res.json({
      success: true,
      data: post
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Like post
// POST /api/posts/:id/like
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    // Check if post already liked by user
    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'Post already liked'
      });
    }
    
    // Add user to likes
    post.likes.push(req.user.id);
    await post.save();
    
    res.json({
      success: true,
      data: {
        likes: post.likes
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

// Unlike post
// POST /api/posts/:id/unlike
router.post('/:id/unlike', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    // Remove user from likes
    const likeIndex = post.likes.indexOf(req.user.id);
    
    if (likeIndex === -1) {
      return res.status(400).json({
        success: false,
        error: 'Post not liked'
      });
    }
    
    post.likes.splice(likeIndex, 1);
    await post.save();
    
    res.json({
      success: true,
      data: {
        likes: post.likes
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

// Add comment to post
// POST /api/posts/:id/comment
router.post('/:id/comment', authMiddleware, aiModerateContent, moderateContent, async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }
    
    // Create comment
    const comment = {
      userId: req.user.id,
      userAlias: req.user.alias,
      userAvatarIndex: req.user.avatarIndex,
      isExpert: req.user.role === 'beacon',
      expertId: req.user.role === 'beacon' ? req.user.expertId : null,
      content,
      timestamp: new Date()
    };
    
    // Check if comment content was flagged by AI moderation (priority)
    if (req.aiModeration?.flagged || req.aiModeration?.recommendedAction === 'flag') {
      return res.status(400).json({
        success: false,
        error: 'Comment content violates community guidelines',
        flagReason: req.aiModeration.flagReason || 'inappropriate_content',
        aiModerated: true
      });
    }
    // Fallback to basic moderation
    else if (req.contentModeration?.flagged) {
      return res.status(400).json({
        success: false,
        error: 'Comment content violates community guidelines',
        flagReason: req.contentModeration.flagReason
      });
    }
    
    // Add comment to post
    post.comments.push(comment);
    await post.save();
    
    res.json({
      success: true,
      data: post
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Flag post
// POST /api/posts/:id/flag
router.post('/:id/flag', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required'
      });
    }
    
    // Flag post
    post.flagged = true;
    post.flagReason = reason;
    await post.save();
    
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

// Translate post - Mock implementation
// POST /api/posts/:id/translate
router.post('/:id/translate', async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    const { targetLanguage } = req.body;
    
    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Target language is required'
      });
    }
    
    // Mock translation (in real app, would use a translation API)
    const translatedContent = `[${targetLanguage}] ${post.content}`;
    
    res.json({
      success: true,
      data: {
        translatedContent
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
