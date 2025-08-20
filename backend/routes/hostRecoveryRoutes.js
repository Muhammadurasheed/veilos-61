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

// Recover sanctuary access by host token  
router.post('/recover-by-token', async (req, res) => {
  try {
    const { hostToken, sanctuaryId } = req.body;
    
    if (!hostToken || !sanctuaryId) {
      return res.status(400).json({
        success: false,
        error: 'Host token and sanctuary ID are required'
      });
    }
    
    // Find the host session
    const hostSession = await HostSession.findOne({
      hostToken,
      sanctuaryId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!hostSession) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired host token'
      });
    }
    
    // Find the sanctuary
    const sanctuary = await SanctuarySession.findOne({
      id: sanctuaryId,
      isActive: true
    });
    
    if (!sanctuary) {
      return res.status(404).json({
        success: false,
        error: 'Sanctuary not found or expired'
      });
    }
    
    // Update last accessed time
    await hostSession.updateAccess();
    
    res.json({
      success: true,
      sanctuary: {
        id: sanctuary.id,
        topic: sanctuary.topic,
        description: sanctuary.description,
        emoji: sanctuary.emoji,
        mode: sanctuary.mode,
        submissionCount: sanctuary.submissions?.length || 0
      }
    });
    
  } catch (err) {
    console.error('Host token recovery error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during recovery'
    });
  }
});

// Recover sanctuary access by email (placeholder for future implementation)
router.post('/recover-by-email', async (req, res) => {
  try {
    const { email, sanctuaryId } = req.body;
    
    // This would typically send an email with recovery link
    // For now, return success message
    res.json({
      success: true,
      message: 'Recovery instructions sent to email (feature coming soon)'
    });
    
  } catch (err) {
    console.error('Email recovery error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during email recovery'
    });
  }
});

module.exports = router;