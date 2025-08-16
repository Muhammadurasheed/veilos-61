const express = require('express');
const router = express.Router();
const LiveSanctuarySession = require('../models/LiveSanctuarySession');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const { nanoid } = require('nanoid');

// Optional middleware to get user IP for anonymous users
const getClientIp = (req, res, next) => {
  req.clientIp = req.headers['x-forwarded-for'] || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress;
  next();
};

// Create live sanctuary session (supports anonymous hosts)
router.post('/', getClientIp, optionalAuthMiddleware, async (req, res) => {
  try {
    const { topic, description, emoji, maxParticipants = 50, audioOnly = true, allowAnonymous = true, moderationEnabled = true, emergencyContactEnabled = true, expireHours = 2, scheduledAt } = req.body;

    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Topic is required' });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expireHours);

    // Generate host token for anonymous users
    let hostId = null;
    let hostToken = null;
    let hostIp = null;

    if (req.user) {
      hostId = req.user.id;
    } else {
      hostToken = nanoid(32);
      hostIp = req.clientIp;
    }

    const session = new LiveSanctuarySession({
      topic: topic.trim(),
      description: description?.trim(),
      emoji,
      hostId,
      hostToken,
      hostIp,
      agoraChannelName: `live-sanctuary-${nanoid(12)}`,
      agoraToken: 'temp-token', // You'll generate this with Agora
      expiresAt,
      maxParticipants,
      allowAnonymous,
      audioOnly,
      moderationEnabled,
      emergencyContactEnabled,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null
    });

    await session.save();

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        agoraChannelName: session.agoraChannelName,
        agoraToken: session.agoraToken,
        expiresAt: session.expiresAt,
        hostToken: hostToken, // Only returned for anonymous hosts
        shareableLink: `${process.env.FRONTEND_URL}/sanctuary/live/${session.id}`
      }
    });
  } catch (error) {
    console.error('Live sanctuary creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create live sanctuary session' });
  }
});

// Join live sanctuary session
// POST /api/live-sanctuary/:id/join
router.post('/:id/join', getClientIp, async (req, res) => {
  try {
    const { alias } = req.body;
    
    const session = await LiveSanctuarySession.findOne({
      id: req.params.id,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Live sanctuary session not found or expired' });
    }

    if (session.currentParticipants >= session.maxParticipants) {
      return res.status(400).json({ success: false, error: 'Session is at maximum capacity' });
    }

    // Generate participant details
    const participantId = nanoid(10);
    const participantAlias = alias || `Guest ${nanoid(4)}`;
    
    // Add participant to session
    session.participants.push({
      id: participantId,
      alias: participantAlias,
      joinedAt: new Date()
    });
    
    session.currentParticipants = session.participants.length;
    await session.save();

    res.json({
      success: true,
      data: {
        participantId,
        participantAlias,
        agoraChannelName: session.agoraChannelName,
        agoraToken: session.agoraToken,
        sessionId: session.id,
        topic: session.topic
      }
    });
  } catch (error) {
    console.error('Join live sanctuary error:', error);
    res.status(500).json({ success: false, error: 'Failed to join session' });
  }
});

// Get live sanctuary session
router.get('/:id', async (req, res) => {
  try {
    const session = await LiveSanctuarySession.findOne({
      id: req.params.id,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Live sanctuary session not found or expired' });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Get live sanctuary error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve session' });
  }
});

// End live sanctuary session (host only)
// POST /api/live-sanctuary/:id/end
router.post('/:id/end', getClientIp, async (req, res) => {
  try {
    const { hostToken } = req.body;
    let session;
    
    // Authentication logic similar to regular sanctuary
    if (hostToken) {
      session = await LiveSanctuarySession.findOne({ 
        id: req.params.id,
        hostToken
      });
    }
    
    if (!session && req.headers['x-auth-token']) {
      try {
        const decoded = require('jsonwebtoken').verify(
          req.headers['x-auth-token'], 
          process.env.JWT_SECRET
        );
        
        session = await LiveSanctuarySession.findOne({
          id: req.params.id,
          hostId: decoded.user.id
        });
      } catch (err) {
        // Invalid token
      }
    }
    
    if (!session) {
      session = await LiveSanctuarySession.findOne({
        id: req.params.id,
        hostIp: req.clientIp
      });
    }
    
    if (!session) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to end this session'
      });
    }
    
    session.isActive = false;
    await session.save();
    
    res.json({
      success: true,
      message: 'Live sanctuary session ended successfully'
    });
  } catch (error) {
    console.error('End live sanctuary error:', error);
    res.status(500).json({ success: false, error: 'Failed to end session' });
  }
});

module.exports = router;