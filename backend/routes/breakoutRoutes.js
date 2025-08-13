const express = require('express');
const router = express.Router();
const BreakoutRoom = require('../models/BreakoutRoom');
const LiveSanctuarySession = require('../models/LiveSanctuarySession');
const { authenticateToken } = require('../middleware/auth');
const { nanoid } = require('nanoid');

// Create breakout room
router.post('/:sessionId/breakout', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name, topic, description, maxParticipants = 8, isPrivate = false, requiresApproval = false } = req.body;

    // Verify parent session exists and user has permission
    const parentSession = await LiveSanctuarySession.findOne({
      id: sessionId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!parentSession) {
      return res.status(404).json({ success: false, error: 'Parent session not found' });
    }

    // Check if user is host or moderator
    if (parentSession.hostId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Only hosts can create breakout rooms' });
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 60); // 1 hour default

    const breakoutRoom = new BreakoutRoom({
      parentSessionId: sessionId,
      name: name.trim(),
      topic: topic?.trim(),
      description: description?.trim(),
      createdBy: req.userId,
      facilitatorId: req.userId,
      agoraChannelName: `breakout-${nanoid(12)}`,
      agoraToken: 'temp-token', // Generate with Agora
      maxParticipants,
      isPrivate,
      requiresApproval,
      expiresAt
    });

    await breakoutRoom.save();

    res.json({
      success: true,
      data: {
        roomId: breakoutRoom.id,
        agoraChannelName: breakoutRoom.agoraChannelName,
        agoraToken: breakoutRoom.agoraToken,
        expiresAt: breakoutRoom.expiresAt
      }
    });
  } catch (error) {
    console.error('Breakout room creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create breakout room' });
  }
});

// Join breakout room
router.post('/breakout/:roomId/join', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { alias } = req.body;

    const room = await BreakoutRoom.findOne({
      id: roomId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!room) {
      return res.status(404).json({ success: false, error: 'Breakout room not found or expired' });
    }

    // Check capacity
    if (room.currentParticipants >= room.maxParticipants) {
      return res.status(400).json({ success: false, error: 'Breakout room is full' });
    }

    // Check if already joined
    const existingParticipant = room.participants.find(p => p.userId === req.userId && !p.leftAt);
    if (existingParticipant) {
      return res.json({
        success: true,
        data: {
          roomId: room.id,
          agoraChannelName: room.agoraChannelName,
          agoraToken: room.agoraToken,
          role: existingParticipant.role
        }
      });
    }

    // Add participant
    room.participants.push({
      userId: req.userId,
      alias: alias || `User ${req.userId}`,
      joinedAt: new Date(),
      role: req.userId === room.facilitatorId ? 'facilitator' : 'participant'
    });

    room.currentParticipants = room.participants.filter(p => !p.leftAt).length;
    await room.save();

    res.json({
      success: true,
      data: {
        roomId: room.id,
        agoraChannelName: room.agoraChannelName,
        agoraToken: room.agoraToken,
        role: req.userId === room.facilitatorId ? 'facilitator' : 'participant'
      }
    });
  } catch (error) {
    console.error('Breakout room join error:', error);
    res.status(500).json({ success: false, error: 'Failed to join breakout room' });
  }
});

// Leave breakout room
router.post('/breakout/:roomId/leave', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await BreakoutRoom.findOne({ id: roomId });
    if (!room) {
      return res.status(404).json({ success: false, error: 'Breakout room not found' });
    }

    // Mark participant as left
    const participant = room.participants.find(p => p.userId === req.userId && !p.leftAt);
    if (participant) {
      participant.leftAt = new Date();
    }

    room.currentParticipants = room.participants.filter(p => !p.leftAt).length;

    // Auto-close if no participants and facilitator left
    if (room.currentParticipants === 0 || req.userId === room.facilitatorId) {
      room.isActive = false;
      room.endedAt = new Date();
    }

    await room.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Breakout room leave error:', error);
    res.status(500).json({ success: false, error: 'Failed to leave breakout room' });
  }
});

// Get breakout rooms for session
router.get('/:sessionId/breakouts', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const rooms = await BreakoutRoom.find({
      parentSessionId: sessionId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).select('id name topic currentParticipants maxParticipants isPrivate createdAt');

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Get breakout rooms error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve breakout rooms' });
  }
});

// Close breakout room
router.post('/breakout/:roomId/close', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await BreakoutRoom.findOne({ id: roomId });
    if (!room) {
      return res.status(404).json({ success: false, error: 'Breakout room not found' });
    }

    // Check permission
    if (room.facilitatorId !== req.userId && room.createdBy !== req.userId) {
      return res.status(403).json({ success: false, error: 'Only facilitator can close breakout room' });
    }

    room.isActive = false;
    room.endedAt = new Date();
    await room.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Close breakout room error:', error);
    res.status(500).json({ success: false, error: 'Failed to close breakout room' });
  }
});

module.exports = router;