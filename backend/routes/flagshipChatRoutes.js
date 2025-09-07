const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { authMiddleware } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');

// Configure Cloudinary storage for chat media
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'flagship-chat',
    allowed_formats: ['jpg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'],
    resource_type: 'auto'
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Send message to flagship sanctuary
router.post('/sessions/:sessionId/messages', 
  authMiddleware,
  upload.single('attachment'),
  validate([
    body('content').optional().isLength({ max: 1000 }).trim(),
    body('type').optional().isIn(['text', 'emoji-reaction', 'media']),
    body('participantAlias').isLength({ min: 1, max: 50 }).trim(),
    body('replyTo').optional().isString()
  ]),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { content, type = 'text', participantAlias } = req.body;

      // Create message object
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        participantId: req.user.id,
        participantAlias,
        content: content || '',
        type,
        timestamp: new Date().toISOString(),
        attachment: req.file ? {
          url: req.file.path,
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          fileSize: req.file.size
        } : null,
        replyTo: req.body.replyTo || null
      };

      // Emit via socket to all participants
      const io = req.app.get('io');
      if (io) {
        io.to(`audio_room_${sessionId}`).emit('sanctuary_new_message', message);
        console.log(`Message sent to audio room ${sessionId}:`, {
          type: message.type,
          hasAttachment: !!message.attachment,
          participantAlias: message.participantAlias
        });
      }

      return res.json({
        success: true,
        data: {
          message: {
            id: message.id,
            participantAlias: message.participantAlias,
            content: message.content,
            type: message.type,
            timestamp: message.timestamp,
            attachment: message.attachment
          }
        },
        message: 'Message sent successfully'
      });

    } catch (error) {
      console.error('Send flagship message error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }
  }
);

// Get messages for a flagship sanctuary session
router.get('/sessions/:sessionId/messages', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, before } = req.query;

    // For now, return empty array as we're using real-time only
    // In production, you'd store messages in database
    return res.json({
      success: true,
      data: {
        messages: [],
        pagination: {
          limit: parseInt(limit),
          hasMore: false
        }
      },
      message: 'Messages retrieved successfully'
    });

  } catch (error) {
    console.error('Get flagship messages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages',
      error: error.message
    });
  }
});

module.exports = router;