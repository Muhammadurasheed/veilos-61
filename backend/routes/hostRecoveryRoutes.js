const express = require('express');
const router = express.Router();
const SanctuarySession = require('../models/SanctuarySession');
const HostSession = require('../models/HostSession');
const { nanoid } = require('nanoid');

// Get client IP helper
const getClientIp = (req, res, next) => {
  req.clientIp = req.headers['x-forwarded-for'] || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress;
  next();
};

// Recover host session by token
// POST /api/host-recovery/verify-token
router.post('/verify-token', getClientIp, async (req, res) => {
  try {
    const { hostToken } = req.body;

    if (!hostToken) {
      return res.status(400).json({
        success: false,
        error: 'Host token is required'
      });
    }

    // Find active host session
    const hostSession = await HostSession.findOne({
      hostToken,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!hostSession) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired host token'
      });
    }

    // Find associated sanctuary session
    const sanctuarySession = await SanctuarySession.findOne({
      id: hostSession.sanctuaryId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!sanctuarySession) {
      return res.status(404).json({
        success: false,
        error: 'Associated sanctuary session not found or expired'
      });
    }

    // Update host session access time
    await hostSession.updateAccess();

    // Return session details
    res.json({
      success: true,
      data: {
        sanctuaryId: sanctuarySession.id,
        topic: sanctuarySession.topic,
        description: sanctuarySession.description,
        emoji: sanctuarySession.emoji,
        mode: sanctuarySession.mode,
        createdAt: sanctuarySession.createdAt,
        expiresAt: sanctuarySession.expiresAt,
        submissionsCount: sanctuarySession.submissions?.length || 0,
        participantsCount: sanctuarySession.participants?.length || 0,
        hostToken: hostSession.hostToken
      }
    });

  } catch (error) {
    console.error('Host recovery error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during host recovery'
    });
  }
});

// Generate recovery link for host
// POST /api/host-recovery/generate-link
router.post('/generate-link', getClientIp, async (req, res) => {
  try {
    const { sanctuaryId, hostToken, recoveryEmail } = req.body;

    if (!sanctuaryId || !hostToken) {
      return res.status(400).json({
        success: false,
        error: 'Sanctuary ID and host token are required'
      });
    }

    // Verify host authorization
    const hostSession = await HostSession.findOne({
      sanctuaryId,
      hostToken,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!hostSession) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to generate recovery link'
      });
    }

    // Update recovery email if provided
    if (recoveryEmail) {
      hostSession.recoveryEmail = recoveryEmail;
      await hostSession.save();
    }

    // Generate secure recovery URL
    const recoveryToken = nanoid(24);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const recoveryUrl = `${baseUrl}/sanctuary/recover?token=${recoveryToken}&hostToken=${hostToken}`;

    // Store recovery token temporarily (you might want to create a separate model for this)
    // For now, we'll return the URL directly
    res.json({
      success: true,
      data: {
        recoveryUrl,
        expiresIn: '48 hours',
        message: 'Save this link to recover your sanctuary host access'
      }
    });

  } catch (error) {
    console.error('Recovery link generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating recovery link'
    });
  }
});

// List host's active sanctuaries
// GET /api/host-recovery/my-sanctuaries
router.get('/my-sanctuaries', getClientIp, async (req, res) => {
  try {
    const { hostToken } = req.query;

    if (!hostToken) {
      return res.status(400).json({
        success: false,
        error: 'Host token is required'
      });
    }

    // Find all active host sessions for this host
    const hostSessions = await HostSession.find({
      hostToken,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    const sanctuaries = [];

    for (const hostSession of hostSessions) {
      const sanctuary = await SanctuarySession.findOne({
        id: hostSession.sanctuaryId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (sanctuary) {
        sanctuaries.push({
          id: sanctuary.id,
          topic: sanctuary.topic,
          description: sanctuary.description,
          emoji: sanctuary.emoji,
          mode: sanctuary.mode,
          createdAt: sanctuary.createdAt,
          expiresAt: sanctuary.expiresAt,
          submissionsCount: sanctuary.submissions?.length || 0,
          participantsCount: sanctuary.participants?.length || 0,
          lastAccessedAt: hostSession.lastAccessedAt
        });
      }
    }

    res.json({
      success: true,
      data: {
        sanctuaries,
        count: sanctuaries.length
      }
    });

  } catch (error) {
    console.error('Host sanctuaries listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving sanctuaries'
    });
  }
});

module.exports = router;