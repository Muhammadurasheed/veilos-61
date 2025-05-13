
const express = require('express');
const router = express.Router();
const SanctuarySession = require('../models/SanctuarySession');
const { authMiddleware } = require('../middleware/auth');
const { nanoid } = require('nanoid');

// Optional middleware to get user IP for anonymous users
const getClientIp = (req, res, next) => {
  req.clientIp = req.headers['x-forwarded-for'] || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress;
  next();
};

// Create a new sanctuary session
// POST /api/sanctuary
router.post('/', getClientIp, async (req, res) => {
  try {
    const { topic, description, emoji, expireHours = 1 } = req.body;
    
    // Validation
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }
    
    // Get host info (could be anonymous)
    let hostId = null;
    let hostToken = null;
    
    if (req.headers['x-auth-token']) {
      try {
        const decoded = require('jsonwebtoken').verify(
          req.headers['x-auth-token'], 
          process.env.JWT_SECRET
        );
        hostId = decoded.user.id;
      } catch (err) {
        // Token invalid, continue as anonymous
        console.log('Invalid token for sanctuary creation, continuing as anonymous');
      }
    }
    
    // If no valid auth, generate a host token for session management
    if (!hostId) {
      hostToken = nanoid(32);
    }
    
    // Calculate expiration (default 1 hour, max 24 hours)
    const hours = Math.min(Math.max(1, expireHours), 24);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);
    
    // Create session
    const session = new SanctuarySession({
      topic,
      description: description || '',
      emoji: emoji || '',
      hostId,
      hostToken,
      hostIp: req.clientIp,
      expiresAt,
      participants: []
    });
    
    await session.save();
    
    // Return the session data with host token if anonymous
    res.json({
      success: true,
      data: {
        id: session.id,
        topic: session.topic,
        description: session.description,
        emoji: session.emoji,
        expiresAt: session.expiresAt,
        hostToken: hostToken // Only returned for anonymous hosts
      }
    });
    
  } catch (err) {
    console.error('Sanctuary session creation error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error creating sanctuary session'
    });
  }
});

// Get session details (for joining)
// GET /api/sanctuary/:id
router.get('/:id', async (req, res) => {
  try {
    const session = await SanctuarySession.findOne({ 
      id: req.params.id,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Sanctuary session not found or expired'
      });
    }
    
    // Return session without sensitive data
    res.json({
      success: true,
      data: {
        id: session.id,
        topic: session.topic,
        description: session.description,
        emoji: session.emoji,
        expiresAt: session.expiresAt,
        participantCount: session.participants.length
      }
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving sanctuary session'
    });
  }
});

// Join session as anonymous or authenticated user
// POST /api/sanctuary/:id/join
router.post('/:id/join', getClientIp, async (req, res) => {
  try {
    const { alias } = req.body;
    
    // Find active session
    const session = await SanctuarySession.findOne({ 
      id: req.params.id,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Sanctuary session not found or expired'
      });
    }
    
    // Generate participant ID and determine alias
    const participantId = nanoid(10);
    const participantAlias = alias || `Guest ${nanoid(4)}`;
    
    // Add participant to session
    session.participants.push({
      id: participantId,
      alias: participantAlias,
      joinedAt: new Date()
    });
    
    await session.save();
    
    // Return join confirmation with participant details
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        participantId,
        participantAlias,
        topic: session.topic,
        expiresAt: session.expiresAt
      }
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error joining sanctuary session'
    });
  }
});

// End session (host only)
// POST /api/sanctuary/:id/end
router.post('/:id/end', getClientIp, async (req, res) => {
  try {
    const { hostToken } = req.body;
    let session;
    
    // Try to find session by host token first (anonymous hosts)
    if (hostToken) {
      session = await SanctuarySession.findOne({ 
        id: req.params.id,
        hostToken
      });
    }
    
    // If not found and user is authenticated, try by hostId
    if (!session && req.headers['x-auth-token']) {
      try {
        const decoded = require('jsonwebtoken').verify(
          req.headers['x-auth-token'], 
          process.env.JWT_SECRET
        );
        
        session = await SanctuarySession.findOne({
          id: req.params.id,
          hostId: decoded.user.id
        });
      } catch (err) {
        // Invalid token
      }
    }
    
    // If still not found, check IP as last resort (less secure)
    if (!session) {
      session = await SanctuarySession.findOne({
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
    
    // End the session
    session.isActive = false;
    await session.save();
    
    res.json({
      success: true,
      message: 'Session ended successfully'
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error ending sanctuary session'
    });
  }
});

// Remove a participant (host only)
// POST /api/sanctuary/:id/remove-participant
router.post('/:id/remove-participant', getClientIp, async (req, res) => {
  try {
    const { hostToken, participantId } = req.body;
    let session;
    
    // Authentication logic similar to end session endpoint
    if (hostToken) {
      session = await SanctuarySession.findOne({ 
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
        
        session = await SanctuarySession.findOne({
          id: req.params.id,
          hostId: decoded.user.id
        });
      } catch (err) {
        // Invalid token
      }
    }
    
    if (!session) {
      session = await SanctuarySession.findOne({
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
    
    await session.save();
    
    res.json({
      success: true,
      message: 'Participant removed successfully'
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error removing participant'
    });
  }
});

// Flag session for moderation
// POST /api/sanctuary/:id/flag
router.post('/:id/flag', async (req, res) => {
  try {
    const session = await SanctuarySession.findOne({ id: req.params.id });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Sanctuary session not found'
      });
    }
    
    // Increment flag counter
    session.moderationFlags += 1;
    
    // Auto-deactivate if flags exceed threshold
    if (session.moderationFlags >= 3) {
      session.isActive = false;
    }
    
    await session.save();
    
    res.json({
      success: true,
      message: 'Session flagged for review'
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error flagging session'
    });
  }
});

module.exports = router;
