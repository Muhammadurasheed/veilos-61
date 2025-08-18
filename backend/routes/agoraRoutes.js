const express = require('express');
const router = express.Router();
const { generateRtcToken, generateChannelName, validateAgoraConfig } = require('../utils/agoraTokenGenerator');
const SanctuarySession = require('../models/SanctuarySession');
const { authMiddleware } = require('../middleware/auth');

// Generate Agora token for sanctuary session
// POST /api/agora/token
router.post('/token', async (req, res) => {
  try {
    const { sessionId, uid, role = 'publisher' } = req.body;

    if (!validateAgoraConfig()) {
      return res.status(500).json({
        success: false,
        error: 'Agora service not configured'
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Find the sanctuary session
    const session = await SanctuarySession.findOne({
      id: sessionId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Sanctuary session not found or expired'
      });
    }

    if (!session.agoraChannelName) {
      return res.status(400).json({
        success: false,
        error: 'This sanctuary session does not support audio features'
      });
    }

    // Generate fresh token
    const token = generateRtcToken(
      session.agoraChannelName,
      uid || 0,
      role,
      3600 // 1 hour expiration
    );

    res.json({
      success: true,
      data: {
        token,
        channelName: session.agoraChannelName,
        appId: process.env.AGORA_APP_ID,
        uid: uid || 0,
        expiresIn: 3600
      }
    });

  } catch (error) {
    console.error('Agora token generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Agora token'
    });
  }
});

// Refresh Agora token
// POST /api/agora/refresh-token
router.post('/refresh-token', async (req, res) => {
  try {
    const { channelName, uid, role = 'publisher' } = req.body;

    if (!validateAgoraConfig()) {
      return res.status(500).json({
        success: false,
        error: 'Agora service not configured'
      });
    }

    if (!channelName) {
      return res.status(400).json({
        success: false,
        error: 'Channel name is required'
      });
    }

    // Generate fresh token with extended expiration
    const token = generateRtcToken(channelName, uid || 0, role, 7200); // 2 hours

    res.json({
      success: true,
      data: {
        token,
        channelName,
        appId: process.env.AGORA_APP_ID,
        uid: uid || 0,
        expiresIn: 7200
      }
    });

  } catch (error) {
    console.error('Agora token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh Agora token'
    });
  }
});

// Get Agora service status
// GET /api/agora/status
router.get('/status', (req, res) => {
  const isConfigured = validateAgoraConfig();
  
  res.json({
    success: true,
    data: {
      configured: isConfigured,
      appId: isConfigured ? process.env.AGORA_APP_ID : null,
      features: {
        audioCall: isConfigured,
        videoCall: isConfigured,
        screenShare: isConfigured,
        recording: isConfigured
      }
    }
  });
});

module.exports = router;