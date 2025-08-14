const express = require('express');
const router = express.Router();
const LiveSanctuarySession = require('../models/LiveSanctuarySession');
const { authMiddleware } = require('../middleware/auth');
const { nanoid } = require('nanoid');

// Create live sanctuary session
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { topic, description, emoji, maxParticipants = 50, audioOnly = true, allowAnonymous = true, moderationEnabled = true, emergencyContactEnabled = true, expireHours = 2 } = req.body;

    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Topic is required' });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expireHours);

    const session = new LiveSanctuarySession({
      topic: topic.trim(),
      description: description?.trim(),
      emoji,
      hostId: req.user.id,
      agoraChannelName: `sanctuary-${nanoid(12)}`,
      agoraToken: 'temp-token', // You'll generate this with Agora
      expiresAt,
      maxParticipants,
      allowAnonymous,
      audioOnly,
      moderationEnabled,
      emergencyContactEnabled
    });

    await session.save();

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        agoraChannelName: session.agoraChannelName,
        agoraToken: session.agoraToken,
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    console.error('Live sanctuary creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create live sanctuary session' });
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

module.exports = router;