const express = require('express');
const router = express.Router();
const SessionRating = require('../models/SessionRating');
const Session = require('../models/Session');
const Expert = require('../models/Expert');
const { authMiddleware } = require('../middleware/auth');

// Create session rating
// POST /api/session-ratings
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      sessionId,
      rating,
      feedback,
      categories,
      wouldRecommend,
      isAnonymous
    } = req.body;

    // Validation
    if (!sessionId || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // Verify session exists and user has permission
    const session = await Session.findOne({ id: sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Only the user who had the session can rate it
    if (session.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to rate this session'
      });
    }

    // Check if rating already exists
    const existingRating = await SessionRating.findOne({ sessionId, userId: req.user.id });
    if (existingRating) {
      return res.status(409).json({
        success: false,
        error: 'Rating already exists for this session'
      });
    }

    // Create rating
    const sessionRating = new SessionRating({
      sessionId,
      expertId: session.expertId,
      userId: req.user.id,
      userAlias: req.user.alias,
      rating,
      feedback,
      categories,
      wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : true,
      isAnonymous: isAnonymous || false
    });

    await sessionRating.save();

    // Update expert's overall rating
    await updateExpertRating(session.expertId);

    res.json({
      success: true,
      data: sessionRating
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get ratings for expert
// GET /api/session-ratings/expert/:expertId
router.get('/expert/:expertId', async (req, res) => {
  try {
    const { page = 1, limit = 10, includeAnonymous = true } = req.query;
    
    let query = { expertId: req.params.expertId };
    
    if (includeAnonymous === 'false') {
      query.isAnonymous = false;
    }

    const ratings = await SessionRating.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SessionRating.countDocuments(query);

    // Calculate average ratings
    const avgRatings = await SessionRating.aggregate([
      { $match: { expertId: req.params.expertId } },
      {
        $group: {
          _id: null,
          avgOverall: { $avg: "$rating" },
          avgProfessionalism: { $avg: "$categories.professionalism" },
          avgExpertise: { $avg: "$categories.expertise" },
          avgCommunication: { $avg: "$categories.communication" },
          avgHelpfulness: { $avg: "$categories.helpfulness" },
          totalRatings: { $sum: 1 },
          recommendationRate: { $avg: { $cond: ["$wouldRecommend", 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        ratings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        statistics: avgRatings[0] || {
          avgOverall: 0,
          avgProfessionalism: 0,
          avgExpertise: 0,
          avgCommunication: 0,
          avgHelpfulness: 0,
          totalRatings: 0,
          recommendationRate: 0
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

// Get ratings for user
// GET /api/session-ratings/user/:userId
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const ratings = await SessionRating.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: ratings
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get rating for specific session
// GET /api/session-ratings/session/:sessionId
router.get('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({ id: req.params.sessionId });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check authorization
    const expert = await Expert.findOne({ id: session.expertId });
    
    if (session.userId !== req.user.id && 
        (!expert || expert.userId !== req.user.id) && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const rating = await SessionRating.findOne({ sessionId: req.params.sessionId });

    res.json({
      success: true,
      data: rating
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update rating
// PUT /api/session-ratings/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const rating = await SessionRating.findOne({ id: req.params.id });
    
    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found'
      });
    }

    // Only the user who created the rating can update it
    if (rating.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const {
      rating: newRating,
      feedback,
      categories,
      wouldRecommend,
      isAnonymous
    } = req.body;

    // Update fields
    if (newRating !== undefined) {
      if (newRating < 1 || newRating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5'
        });
      }
      rating.rating = newRating;
    }
    
    if (feedback !== undefined) rating.feedback = feedback;
    if (categories !== undefined) rating.categories = categories;
    if (wouldRecommend !== undefined) rating.wouldRecommend = wouldRecommend;
    if (isAnonymous !== undefined) rating.isAnonymous = isAnonymous;

    await rating.save();

    // Update expert's overall rating
    await updateExpertRating(rating.expertId);

    res.json({
      success: true,
      data: rating
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Helper function to update expert's overall rating
async function updateExpertRating(expertId) {
  try {
    const avgRating = await SessionRating.aggregate([
      { $match: { expertId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" }
        }
      }
    ]);

    if (avgRating.length > 0) {
      await Expert.findOneAndUpdate(
        { id: expertId },
        { rating: Math.round(avgRating[0].avgRating * 10) / 10 } // Round to 1 decimal place
      );
    }
  } catch (err) {
    console.error('Error updating expert rating:', err);
  }
}

module.exports = router;