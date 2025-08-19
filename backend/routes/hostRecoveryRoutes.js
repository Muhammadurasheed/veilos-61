const express = require('express');
const router = express.Router();
const HostSession = require('../models/HostSession');
const SanctuarySession = require('../models/SanctuarySession');
const { authMiddleware } = require('../middleware/auth');

// Get all active sanctuary sessions for authenticated user
router.get('/my-sanctuaries', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const sanctuaries = await SanctuarySession.find({
      hostId: userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    
    const sanctuariesWithStats = sanctuaries.map(sanctuary => ({
      id: sanctuary.id,
      topic: sanctuary.topic,
      description: sanctuary.description,
      emoji: sanctuary.emoji,
      mode: sanctuary.mode,
      createdAt: sanctuary.createdAt,
      expiresAt: sanctuary.expiresAt,
      submissionCount: sanctuary.submissions?.length || 0,
      participantCount: sanctuary.participants?.length || 0,
      lastActivity: sanctuary.submissions?.length > 0 ? 
        sanctuary.submissions[sanctuary.submissions.length - 1].timestamp : 
        sanctuary.createdAt,
      timeRemaining: Math.max(0, Math.floor((new Date(sanctuary.expiresAt).getTime() - Date.now()) / (1000 * 60))),
    }));
    
    res.json({
      success: true,
      data: sanctuariesWithStats
    });
    
  } catch (err) {
    console.error('Error fetching user sanctuaries:', err);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving sanctuaries'
    });
  }
});

module.exports = router;