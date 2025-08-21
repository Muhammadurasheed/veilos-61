
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ChatSession = require('../models/ChatSession');
const Expert = require('../models/Expert');
const Booking = require('../models/Booking');
const { nanoid } = require('nanoid');

// Get or create chat session
router.post('/session', authenticateToken, async (req, res) => {
  try {
    const { expertId, topic, description, sessionType = 'consultation' } = req.body;

    if (!expertId) {
      return res.status(400).json({
        success: false,
        error: 'Expert ID is required'
      });
    }

    // Check if expert exists and is available
    const expert = await Expert.findOne({ 
      id: expertId,
      accountStatus: 'approved',
      verified: true
    });

    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found or unavailable'
      });
    }

    // Check for existing active session
    let existingSession = await ChatSession.findOne({
      expertId,
      userId: req.user.id,
      status: 'active'
    });

    if (existingSession) {
      return res.json({
        success: true,
        message: 'Existing session found',
        data: {
          session: existingSession,
          sessionUrl: `/chat/${existingSession.id}`
        }
      });
    }

    // Create new chat session
    const chatSession = new ChatSession({
      id: `session-${nanoid(8)}`,
      expertId,
      userId: req.user.id,
      type: sessionType,
      topic: topic || 'General Consultation',
      description,
      participants: [
        {
          userId: req.user.id,
          role: 'user',
          alias: req.user.alias,
          avatarIndex: req.user.avatarIndex,
          permissions: {
            canSendMessages: true,
            canSendFiles: true,
            canMakeVoiceCalls: expert.sessionPreferences?.sessionTypes?.voice !== false,
            canMakeVideoCalls: expert.sessionPreferences?.sessionTypes?.video !== false
          }
        },
        {
          userId: expert.userId,
          role: 'expert',
          alias: expert.name,
          avatarUrl: expert.avatarUrl,
          permissions: {
            canSendMessages: true,
            canSendFiles: true,
            canMakeVoiceCalls: true,
            canMakeVideoCalls: true
          }
        }
      ]
    });

    await chatSession.save();

    // Update expert's session count
    expert.totalSessions += 1;
    await expert.save();

    res.status(201).json({
      success: true,
      message: 'Chat session created successfully',
      data: {
        session: chatSession,
        sessionUrl: `/chat/${chatSession.id}`,
        expert: {
          id: expert.id,
          name: expert.name,
          avatarUrl: expert.avatarUrl,
          specialization: expert.specialization,
          responseTime: expert.responseTime,
          sessionPreferences: expert.sessionPreferences
        }
      }
    });

  } catch (error) {
    console.error('Create chat session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create chat session'
    });
  }
});

// Get chat session details
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({ id: sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    // Check authorization
    const isParticipant = session.participants.some(p => p.userId === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this session'
      });
    }

    // Get expert details
    const expert = await Expert.findOne({ id: session.expertId })
      .select('name avatarUrl specialization responseTime isOnline lastActive sessionPreferences')
      .lean();

    // Mark user as online in session
    await session.updateParticipantStatus(req.user.id, true);

    res.json({
      success: true,
      data: {
        session,
        expert,
        canStartVoiceCall: expert?.sessionPreferences?.sessionTypes?.voice !== false,
        canStartVideoCall: expert?.sessionPreferences?.sessionTypes?.video !== false
      }
    });

  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session details'
    });
  }
});

// Send message to chat session
router.post('/session/:sessionId/message', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content, type = 'text', attachment } = req.body;

    if (!content && !attachment) {
      return res.status(400).json({
        success: false,
        error: 'Message content or attachment is required'
      });
    }

    const session = await ChatSession.findOne({ id: sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    // Check authorization
    const participant = session.participants.find(p => p.userId === req.user.id);
    if (!participant) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to send messages in this session'
      });
    }

    // Check permissions
    if (!participant.permissions.canSendMessages) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to send messages'
      });
    }

    if (attachment && !participant.permissions.canSendFiles) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to send files'
      });
    }

    // Create message
    const messageData = {
      sender: {
        id: req.user.id,
        alias: req.user.alias,
        role: participant.role,
        avatarUrl: req.user.avatarUrl,
        avatarIndex: req.user.avatarIndex
      },
      content: content || (attachment ? `${type} attachment` : ''),
      type,
      attachment
    };

    const message = await session.addMessage(messageData);

    // Calculate response time if this is expert's first response
    if (participant.role === 'expert' && !session.analytics?.responseTime?.expertFirstResponse) {
      const firstUserMessage = session.messages.find(m => m.sender.role === 'user');
      if (firstUserMessage) {
        const responseTimeSeconds = (message.timestamp - firstUserMessage.timestamp) / 1000;
        session.analytics = {
          ...session.analytics,
          responseTime: {
            ...session.analytics?.responseTime,
            expertFirstResponse: responseTimeSeconds
          }
        };
        await session.save();
      }
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// Get chat messages with pagination
router.get('/session/:sessionId/messages', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const session = await ChatSession.findOne({ id: sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    // Check authorization
    const isParticipant = session.participants.some(p => p.userId === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access these messages'
      });
    }

    // Get paginated messages
    const totalMessages = session.messages.length;
    const startIndex = Math.max(0, totalMessages - (page * limit));
    const endIndex = Math.max(0, totalMessages - ((page - 1) * limit));
    
    const messages = session.messages
      .slice(startIndex, endIndex)
      .reverse(); // Most recent first

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalMessages,
          hasMore: startIndex > 0
        }
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

// Mark message as read
router.patch('/session/:sessionId/message/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { sessionId, messageId } = req.params;

    const session = await ChatSession.findOne({ id: sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    // Check authorization
    const isParticipant = session.participants.some(p => p.userId === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this session'
      });
    }

    await session.markMessageAsRead(messageId, req.user.id);

    res.json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark message as read'
    });
  }
});

// End chat session
router.patch('/session/:sessionId/end', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason = 'completed', feedback } = req.body;

    const session = await ChatSession.findOne({ id: sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    // Check authorization
    const participant = session.participants.find(p => p.userId === req.user.id);
    if (!participant) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to end this session'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Session is not active'
      });
    }

    // End session
    await session.endSession(reason);

    // Update expert's completed sessions count
    if (reason === 'completed') {
      await Expert.updateOne(
        { id: session.expertId },
        { $inc: { completedSessions: 1 } }
      );

      // Update related booking if exists
      const booking = await Booking.findOne({
        'sessionAccess.chatSessionId': sessionId
      });
      
      if (booking) {
        await booking.completeSession();
      }
    }

    // Add feedback if provided
    if (feedback) {
      const feedbackField = participant.role === 'user' ? 'userRating' : 'expertRating';
      session[feedbackField] = {
        ...feedback,
        submittedAt: new Date()
      };
      await session.save();
    }

    res.json({
      success: true,
      message: 'Session ended successfully',
      data: { session }
    });

  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }
});

// Get user's chat sessions
router.get('/my-sessions', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { userId: req.user.id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const sessions = await ChatSession.find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-messages') // Exclude messages for performance
      .lean();

    // Enhance with expert information
    const sessionsWithExpertInfo = await Promise.all(
      sessions.map(async (session) => {
        const expert = await Expert.findOne({ id: session.expertId })
          .select('name avatarUrl specialization rating')
          .lean();
        
        return {
          ...session,
          expert,
          lastMessage: session.messages?.[session.messages.length - 1] || null,
          unreadCount: session.messages?.filter(m => 
            m.sender.id !== req.user.id && 
            !m.readBy.some(r => r.userId === req.user.id)
          ).length || 0
        };
      })
    );

    const total = await ChatSession.countDocuments(filter);

    res.json({
      success: true,
      data: {
        sessions: sessionsWithExpertInfo,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

module.exports = router;
