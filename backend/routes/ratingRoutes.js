
const express = require('express');
const router = express.Router();
const Expert = require('../models/Expert');
const { authMiddleware } = require('../middleware/auth');

// Add testimonial
// POST /api/ratings/testimonial
router.post('/testimonial', authMiddleware, async (req, res) => {
  try {
    const { expertId, text } = req.body;
    
    if (!expertId || !text) {
      return res.status(400).json({
        success: false,
        error: 'Expert ID and testimonial text are required'
      });
    }
    
    const expert = await Expert.findOne({ id: expertId });
    
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found'
      });
    }
    
    // Add testimonial
    const testimonial = {
      text,
      user: {
        alias: req.user.alias,
        avatarIndex: req.user.avatarIndex
      }
    };
    
    expert.testimonials.push(testimonial);
    await expert.save();
    
    res.json({
      success: true,
      data: testimonial
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Rate expert
// POST /api/ratings
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { expertId, rating } = req.body;
    
    if (!expertId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Expert ID and valid rating (1-5) are required'
      });
    }
    
    const expert = await Expert.findOne({ id: expertId });
    
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found'
      });
    }
    
    // In a real app, we would track individual ratings per user
    // For now, we'll just update the average rating as a simple implementation
    
    // Calculate new average rating (simple approach)
    const totalRatings = expert.testimonials.length || 1;
    const currentRating = expert.rating || 0;
    
    // New rating is weighted average of current and new rating
    const newRating = ((currentRating * totalRatings) + Number(rating)) / (totalRatings + 1);
    
    expert.rating = Number(newRating.toFixed(1)); // Round to 1 decimal place
    await expert.save();
    
    res.json({
      success: true,
      data: {
        rating: expert.rating
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
