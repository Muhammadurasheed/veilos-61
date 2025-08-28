const express = require('express');
const router = express.Router();
const SanctuaryMessage = require('../models/SanctuaryMessage');
const LiveSanctuarySession = require('../models/LiveSanctuarySession');
const { authMiddleware } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');

// Send message to sanctuary
router.post('/sessions/:sessionId/messages', 
  authMiddleware,
  validate([
    body('content').isLength({ min: 1, max: 1000 }).trim(),
    body('type').optional().isIn(['text', 'emoji-reaction', 'system']),
    body('replyTo').optional().isString()
  ]),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { content, type = 'text', replyTo } = req.body;

      // Verify session exists and is active
      const session = await LiveSanctuarySession.findOne({ 
        id: sessionId, 
        isActive: true 
      });

      if (!session) {
        return res.error('Sanctuary session not found or inactive', 404);
      }

      // Check if user is participant
      const isParticipant = session.participants.some(p => p.id === req.user.shadowId);
      if (!isParticipant && session.hostId !== req.user.id) {
        return res.error('You must be a participant to send messages', 403);
      }

      // Create message
      const message = new SanctuaryMessage({
        sessionId,
        senderShadowId: req.user.shadowId,
        senderAlias: req.user.alias,
        senderAvatarIndex: req.user.avatarIndex,
        content,
        type,
        replyTo,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      await message.save();

      // Emit message via socket (handled by socket server)
      req.app.get('io')?.to(`sanctuary-${sessionId}`).emit('new_message', {
        id: message.id,
        senderShadowId: message.senderShadowId,
        senderAlias: message.senderAlias,
        senderAvatarIndex: message.senderAvatarIndex,
        content: message.content,
        type: message.type,
        timestamp: message.timestamp,
        replyTo: message.replyTo
      });

      return res.success({
        message: {
          id: message.id,
          senderAlias: message.senderAlias,
          senderAvatarIndex: message.senderAvatarIndex,
          content: message.content,
          type: message.type,
          timestamp: message.timestamp,
          replyTo: message.replyTo
        }
      }, 'Message sent successfully');

    } catch (error) {
      console.error('Send sanctuary message error:', error);
      return res.error('Failed to send message', 500);
    }
  }
);

// Get messages for a sanctuary session
router.get('/sessions/:sessionId/messages', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50, before } = req.query;

    // Verify session exists and user has access
    const session = await LiveSanctuarySession.findOne({ id: sessionId });
    if (!session) {
      return res.error('Sanctuary session not found', 404);
    }

    // Check if user is participant or host
    const isParticipant = session.participants.some(p => p.id === req.user.shadowId);
    if (!isParticipant && session.hostId !== req.user.id) {
      return res.error('You must be a participant to view messages', 403);
    }

    // Build query
    const query = { 
      sessionId,
      isDeleted: false
    };

    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    // Get messages with pagination
    const messages = await SanctuaryMessage.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    return res.success({
      messages: messages.map(msg => ({
        id: msg.id,
        senderAlias: msg.senderAlias,
        senderAvatarIndex: msg.senderAvatarIndex,
        content: msg.content,
        type: msg.type,
        timestamp: msg.timestamp,
        replyTo: msg.replyTo,
        reactions: msg.reactions,
        isEdited: msg.isEdited
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    }, 'Messages retrieved successfully');

  } catch (error) {
    console.error('Get sanctuary messages error:', error);
    return res.error('Failed to retrieve messages', 500);
  }
});

// Add reaction to message
router.post('/messages/:messageId/reactions',
  authMiddleware,
  validate([
    body('emoji').isLength({ min: 1, max: 10 }).trim()
  ]),
  async (req, res) => {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;

      const message = await SanctuaryMessage.findOne({ id: messageId });
      if (!message) {
        return res.error('Message not found', 404);
      }

      // Verify user has access to the session
      const session = await LiveSanctuarySession.findOne({ id: message.sessionId });
      const isParticipant = session.participants.some(p => p.id === req.user.shadowId);
      if (!isParticipant && session.hostId !== req.user.id) {
        return res.error('You must be a participant to react to messages', 403);
      }

      // Check if user already reacted with this emoji
      const existingReaction = message.reactions.find(r => 
        r.senderShadowId === req.user.shadowId && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        message.reactions = message.reactions.filter(r => 
          !(r.senderShadowId === req.user.shadowId && r.emoji === emoji)
        );
      } else {
        // Add reaction
        message.reactions.push({
          emoji,
          senderShadowId: req.user.shadowId,
          senderAlias: req.user.alias
        });
      }

      await message.save();

      // Emit reaction update via socket
      req.app.get('io')?.to(`sanctuary-${message.sessionId}`).emit('message_reaction', {
        messageId: message.id,
        emoji,
        senderAlias: req.user.alias,
        action: existingReaction ? 'remove' : 'add',
        reactions: message.reactions
      });

      return res.success({
        reactions: message.reactions
      }, 'Reaction updated successfully');

    } catch (error) {
      console.error('Add message reaction error:', error);
      return res.error('Failed to update reaction', 500);
    }
  }
);

// Delete message (sender only)
router.delete('/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await SanctuaryMessage.findOne({ id: messageId });
    if (!message) {
      return res.error('Message not found', 404);
    }

    // Only sender or session host can delete
    const session = await LiveSanctuarySession.findOne({ id: message.sessionId });
    if (message.senderShadowId !== req.user.shadowId && session.hostId !== req.user.id) {
      return res.error('You can only delete your own messages or messages as host', 403);
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    // Emit message deletion via socket
    req.app.get('io')?.to(`sanctuary-${message.sessionId}`).emit('message_deleted', {
      messageId: message.id
    });

    return res.success(null, 'Message deleted successfully');

  } catch (error) {
    console.error('Delete message error:', error);
    return res.error('Failed to delete message', 500);
  }
});

module.exports = router;