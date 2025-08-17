const express = require('express');
const router = express.Router();
const LiveSanctuarySession = require('../models/LiveSanctuarySession');
const { optionalAuthMiddleware } = require('../middleware/auth');
const { nanoid } = require('nanoid');

// Get client IP helper
const getClientIp = (req, res, next) => {
  req.clientIp = req.headers['x-forwarded-for'] || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress;
  next();
};

// Create live sanctuary session
router.post('/', getClientIp, optionalAuthMiddleware, async (req, res) => {
  try {
    const { 
      topic, 
      description, 
      emoji,
      maxParticipants = 50,
      audioOnly = true,
      allowAnonymous = true,
      moderationEnabled = true,
      emergencyContactEnabled = true,
      expireHours = 2,
      scheduledAt
    } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }

    // Generate unique Agora channel name
    const agoraChannelName = `live_sanctuary_${nanoid(12)}`;
    
    // In production, this would generate a real Agora token
    // For now, using a mock token
    const agoraToken = `agora_token_${nanoid(32)}`;

    // Calculate expiration
    const hours = Math.min(Math.max(1, expireHours), 24);
    const expiresAt = scheduledAt ? 
      new Date(new Date(scheduledAt).getTime() + (hours * 60 * 60 * 1000)) :
      new Date(Date.now() + (hours * 60 * 60 * 1000));

    // Host identification
    let hostId = null;
    let hostToken = null;

    if (req.user && req.user.id) {
      hostId = req.user.id;
    } else {
      // Anonymous host - generate token
      hostToken = nanoid(32);
    }

    // Create live sanctuary session
    const session = new LiveSanctuarySession({
      topic,
      description: description || '',
      emoji: emoji || '🎙️',
      hostId,
      hostToken,
      hostIp: req.clientIp,
      agoraChannelName,
      agoraToken,
      maxParticipants: Math.min(Math.max(2, maxParticipants), 200),
      audioOnly,
      allowAnonymous,
      moderationEnabled,
      emergencyContactEnabled,
      expiresAt,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      participants: []
    });

    await session.save();

    res.json({
      success: true,
      data: {
        id: session.id,
        topic: session.topic,
        description: session.description,
        emoji: session.emoji,
        agoraChannelName: session.agoraChannelName,
        agoraToken: session.agoraToken,
        maxParticipants: session.maxParticipants,
        currentParticipants: session.currentParticipants,
        expiresAt: session.expiresAt,
        scheduledAt: session.scheduledAt,
        hostToken: hostToken // Only for anonymous hosts
      }
    });

  } catch (error) {
    console.error('Create live sanctuary error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating live sanctuary session'
    });
  }
});

// Join live sanctuary session
router.post('/:id/join', getClientIp, async (req, res) => {
  try {
    const { alias, isAnonymous = true } = req.body;

    const session = await LiveSanctuarySession.findOne({
      id: req.params.id,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Live sanctuary session not found or expired'
      });
    }

    // Check capacity
    if (session.currentParticipants >= session.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Session is at maximum capacity'
      });
    }

    // Generate participant details
    const participantId = nanoid(10);
    const participantAlias = alias || `Speaker ${nanoid(4)}`;

    // Add participant
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
        sessionId: session.id,
        participantId,
        participantAlias,
        agoraChannelName: session.agoraChannelName,
        agoraToken: session.agoraToken,
        topic: session.topic,
        description: session.description,
        emoji: session.emoji,
        isHost: false,
        expiresAt: session.expiresAt
      }
    });

  } catch (error) {
    console.error('Join live sanctuary error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error joining live sanctuary session'
    });
  }
});

// Get live sanctuary session details
router.get('/:id', async (req, res) => {
  try {
    const session = await LiveSanctuarySession.findOne({
      id: req.params.id,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Live sanctuary session not found or expired'
      });
    }

    res.json({
      success: true,
      data: {
        id: session.id,
        topic: session.topic,
        description: session.description,
        emoji: session.emoji,
        maxParticipants: session.maxParticipants,
        currentParticipants: session.currentParticipants,
        audioOnly: session.audioOnly,
        allowAnonymous: session.allowAnonymous,
        moderationEnabled: session.moderationEnabled,
        emergencyContactEnabled: session.emergencyContactEnabled,
        expiresAt: session.expiresAt,
        scheduledAt: session.scheduledAt,
        createdAt: session.createdAt
      }
    });

  } catch (error) {
    console.error('Get live sanctuary error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving live sanctuary session'
    });
  }
});

// End live sanctuary session
router.post('/:id/end', getClientIp, async (req, res) => {
  try {
    const { hostToken } = req.body;
    let session;

    // Authentication logic - try hostToken first
    if (hostToken) {
      session = await LiveSanctuarySession.findOne({
        id: req.params.id,
        hostToken
      });
    }

    // Try authenticated user
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

    // Fall back to IP verification (less secure)
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

    // End session
    session.isActive = false;
    await session.save();

    res.json({
      success: true,
      message: 'Live sanctuary session ended successfully'
    });

  } catch (error) {
    console.error('End live sanctuary error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error ending live sanctuary session'
    });
  }
});

// Remove participant from live sanctuary
router.post('/:id/remove-participant', getClientIp, async (req, res) => {
  try {
    const { hostToken, participantId } = req.body;
    let session;

    // Host authentication (same logic as end session)
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
        error: 'Not authorized to moderate this session'
      });
    }

    // Remove participant
    session.participants = session.participants.filter(
      participant => participant.id !== participantId
    );

    session.currentParticipants = session.participants.length;
    await session.save();

    res.json({
      success: true,
      message: 'Participant removed from live sanctuary session'
    });

  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error removing participant'
    });
  }
});

module.exports = router;