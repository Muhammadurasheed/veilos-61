const express = require('express');
const router = express.Router();
const Expert = require('../models/Expert');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// Follow an expert
router.post('/:expertId/follow', authMiddleware, async (req, res) => {
  try {
    const { expertId } = req.params;
    const userId = req.user.id;

    // Check if expert exists
    const expert = await Expert.findOne({ id: expertId });
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found'
      });
    }

    // Check if user exists
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already following
    if (user.followedExperts && user.followedExperts.includes(expertId)) {
      return res.status(400).json({
        success: false,
        error: 'Already following this expert'
      });
    }

    // Add expert to user's followed list
    if (!user.followedExperts) {
      user.followedExperts = [];
    }
    user.followedExperts.push(expertId);

    // Add user to expert's followers list
    if (!expert.followers) {
      expert.followers = [];
    }
    expert.followers.push(userId);

    await user.save();
    await expert.save();

    res.json({
      success: true,
      message: 'Successfully followed expert'
    });

  } catch (error) {
    console.error('Follow expert error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Unfollow an expert
router.post('/:expertId/unfollow', authMiddleware, async (req, res) => {
  try {
    const { expertId } = req.params;
    const userId = req.user.id;

    // Check if expert exists
    const expert = await Expert.findOne({ id: expertId });
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found'
      });
    }

    // Check if user exists
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Remove expert from user's followed list
    if (user.followedExperts) {
      user.followedExperts = user.followedExperts.filter(id => id !== expertId);
    }

    // Remove user from expert's followers list
    if (expert.followers) {
      expert.followers = expert.followers.filter(id => id !== userId);
    }

    await user.save();
    await expert.save();

    res.json({
      success: true,
      message: 'Successfully unfollowed expert'
    });

  } catch (error) {
    console.error('Unfollow expert error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get user's followed experts
router.get('/following', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findOne({ id: userId });
    if (!user || !user.followedExperts) {
      return res.json({
        success: true,
        data: []
      });
    }

    const followedExperts = await Expert.find({
      id: { $in: user.followedExperts },
      accountStatus: 'approved'
    }).select('-__v -userId -email -phoneNumber');

    res.json({
      success: true,
      data: followedExperts
    });

  } catch (error) {
    console.error('Get followed experts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Check if user is following an expert
router.get('/:expertId/following-status', authMiddleware, async (req, res) => {
  try {
    const { expertId } = req.params;
    const userId = req.user.id;

    const user = await User.findOne({ id: userId });
    const isFollowing = user && user.followedExperts && user.followedExperts.includes(expertId);

    res.json({
      success: true,
      data: {
        isFollowing: !!isFollowing
      }
    });

  } catch (error) {
    console.error('Check following status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;