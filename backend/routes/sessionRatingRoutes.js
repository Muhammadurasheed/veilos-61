const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const SessionRating = require('../models/SessionRating');
const Session = require('../models/Session');
const Expert = require('../models/Expert');
const User = require('../models/User');

// Submit session rating
router.post('/rating', authMiddleware, async (req, res) => {
  try {
    const { sessionId, rating, feedback } = req.body;
    const userId = req.user.id;

    // Validate input
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

    // Check if session exists and user participated
    const session = await Session.findOne({ id: sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Verify user was part of this session
    if (session.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only rate sessions you participated in'
      });
    }

    // Check if rating already exists
    const existingRating = await SessionRating.findOne({ 
      sessionId, 
      userId 
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        error: 'You have already rated this session'
      });
    }

    // Create new rating
    const sessionRating = new SessionRating({
      sessionId,
      userId,
      expertId: session.expertId,
      rating,
      feedback: feedback?.trim() || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await sessionRating.save();

    // Update expert's average rating
    await updateExpertAverageRating(session.expertId);

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        ratingId: sessionRating.id,
        rating: sessionRating.rating,
        feedback: sessionRating.feedback
      }
    });

  } catch (error) {
    console.error('Session rating submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit rating'
    });
  }
});

// Get ratings for a session
router.get('/session/:sessionId/ratings', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const ratings = await SessionRating.find({ sessionId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: ratings
    });

  } catch (error) {
    console.error('Get session ratings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session ratings'
    });
  }
});

// Get ratings for an expert
router.get('/expert/:expertId/ratings', async (req, res) => {
  try {
    const { expertId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const ratings = await SessionRating.find({ expertId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await SessionRating.countDocuments({ expertId });

    // Calculate average rating
    const avgResult = await SessionRating.aggregate([
      { $match: { expertId } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ]);

    const averageRating = avgResult.length > 0 ? avgResult[0].averageRating : 0;

    res.json({
      success: true,
      data: {
        ratings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRatings: total,
          averageRating: Math.round(averageRating * 10) / 10
        }
      }
    });

  } catch (error) {
    console.error('Get expert ratings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expert ratings'
    });
  }
});

// Helper function to update expert's average rating
async function updateExpertAverageRating(expertId) {
  try {
    const avgResult = await SessionRating.aggregate([
      { $match: { expertId } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, totalRatings: { $sum: 1 } } }
    ]);

    if (avgResult.length > 0) {
      const { averageRating, totalRatings } = avgResult[0];
      
      await Expert.updateOne(
        { id: expertId },
        {
          $set: {
            averageRating: Math.round(averageRating * 10) / 10,
            totalRatings,
            updatedAt: new Date()
          }
        }
      );
    }
  } catch (error) {
    console.error('Update expert average rating error:', error);
  }
}

module.exports = router;