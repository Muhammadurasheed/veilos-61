
const express = require('express');
const router = express.Router();
const SanctuarySession = require('../models/SanctuarySession');
const { authMiddleware } = require('../middleware/auth');
const { nanoid } = require('nanoid');
const { generateRtcToken, generateChannelName, validateAgoraConfig } = require('../utils/agoraTokenGenerator');

// Optional middleware to get user IP for anonymous users
const getClientIp = (req, res, next) => {
  req.clientIp = req.headers['x-forwarded-for'] || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress;
  next();
};

// Create a new sanctuary session
// POST /api/sanctuary/sessions (Updated to match API expectations)
router.post('/sessions', getClientIp, async (req, res) => {
  try {
    const { topic, description, emoji, expireHours = 1, sanctuaryType = 'anonymous-link' } = req.body;
    
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
    
    // Always generate a host token for session management (even for authenticated users)
    hostToken = nanoid(32);
    
    // Get client IP for host session tracking
    const clientIp = req.clientIp || req.ip || req.connection.remoteAddress || 'unknown';
    
    // Calculate expiration (default 1 hour, max 24 hours)
    const hours = Math.min(Math.max(1, expireHours), 24);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);
    
    // Determine mode based on sanctuary type
    const mode = sanctuaryType === 'anonymous-link' ? 'anon-inbox' : 
                 sanctuaryType === 'scheduled-audio' ? 'live-audio' : 
                 'text-room';

    // Generate Agora channel info for live audio sessions
    let agoraChannelName = null;
    let agoraToken = null;
    
    if (mode === 'live-audio' && validateAgoraConfig()) {
      try {
        agoraChannelName = generateChannelName(nanoid(10));
        agoraToken = generateRtcToken(agoraChannelName, 0, 'publisher', 3600);
      } catch (error) {
        console.error('Agora token generation failed:', error);
        // Continue without Agora - fallback to text mode
      }
    }

    // Create session
    const session = new SanctuarySession({
      topic,
      description: description || '',
      emoji: emoji || '',
      mode,
      hostId,
      hostToken,
      hostIp: clientIp,
      expiresAt,
      participants: [],
      submissions: [],
      agoraChannelName,
      agoraToken,
      maxParticipants: mode === 'live-audio' ? 20 : 100
    });
    
    await session.save();

    // Create persistent host session for anonymous hosts
    if (hostToken) {
      const HostSession = require('../models/HostSession');
      const hostSessionExpiresAt = new Date();
      hostSessionExpiresAt.setHours(hostSessionExpiresAt.getHours() + 48); // 48 hours for host recovery

      await new HostSession({
        sanctuaryId: session.id,
        hostToken,
        hostId,
        hostIp: clientIp,
        userAgent: req.headers['user-agent'] || '',
        expiresAt: hostSessionExpiresAt
      }).save();
    }
    
    // Return the session data with host token if anonymous
    res.json({
      success: true,
      data: {
        id: session.id,
        topic: session.topic,
        description: session.description,
        emoji: session.emoji,
        mode: session.mode,
        expiresAt: session.expiresAt,
        hostToken: hostToken, // Only returned for anonymous hosts
        agoraChannelName: session.agoraChannelName,
        agoraToken: session.agoraToken,
        maxParticipants: session.maxParticipants
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

// Get session by ID as host (with host token)
router.get('/sessions/:sessionId/host', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const hostToken = req.headers['x-host-token'];
    
    if (!hostToken) {
      return res.status(401).json({
        success: false,
        error: 'Host token required'
      });
    }
    
    // Verify host token
    const HostSession = require('../models/HostSession');
    const hostSession = await HostSession.findOne({
      sanctuaryId: sessionId,
      hostToken,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!hostSession) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired host token'
      });
    }
    
    // Find the sanctuary session
    const session = await SanctuarySession.findOne({
      id: sessionId,
      isActive: true
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Update host session access time
    await hostSession.updateAccess();
    
    res.json({
      success: true,
      data: {
        id: session.id,
        topic: session.topic,
        description: session.description,
        emoji: session.emoji,
        mode: session.mode,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        submissions: session.submissions || [],
        participants: session.participants || [],
        isHost: true
      }
    });
    
  } catch (err) {
    console.error('Error fetching host session:', err);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving session'
    });
  }
});

// Get session details (for joining)
// GET /api/sanctuary/sessions/:id
router.get('/sessions/:id', async (req, res) => {
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
        mode: session.mode,
        expiresAt: session.expiresAt,
        participantCount: session.participants.length,
        agoraChannelName: session.agoraChannelName,
        maxParticipants: session.maxParticipants
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
// POST /api/sanctuary/sessions/:id/join
router.post('/sessions/:id/join', getClientIp, async (req, res) => {
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
    
  // Update the session to include agora info in response
  const updatedSession = await SanctuarySession.findOne({ id: req.params.id });
  
  res.json({
    success: true,
    data: {
      sessionId: updatedSession.id,
      participantId,
      participantAlias,
      topic: updatedSession.topic,
      mode: updatedSession.mode,
      expiresAt: updatedSession.expiresAt,
      agoraChannelName: updatedSession.agoraChannelName,
      agoraToken: updatedSession.agoraToken,
      maxParticipants: updatedSession.maxParticipants
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
// POST /api/sanctuary/sessions/:id/end
router.post('/sessions/:id/end', getClientIp, async (req, res) => {
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
// POST /api/sanctuary/sessions/:id/remove-participant
router.post('/sessions/:id/remove-participant', getClientIp, async (req, res) => {
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

// Submit anonymous message to sanctuary inbox
// POST /api/sanctuary/sessions/:id/submit
router.post('/sessions/:id/submit', getClientIp, async (req, res) => {
  try {
    const { alias, message } = req.body;
    
    // Validation
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

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

    // Only allow submissions for anon-inbox mode
    if (session.mode !== 'anon-inbox') {
      return res.status(400).json({
        success: false,
        error: 'Submissions not allowed for this session type'
      });
    }
    
    // Create submission
    const submission = {
      alias: alias || `Anonymous ${nanoid(4)}`,
      message: message.trim(),
      timestamp: new Date()
    };
    
    session.submissions.push(submission);
    await session.save();

    // Emit real-time notification to host
    try {
      const { getIO } = require('../socket/socketHandler');
      const io = getIO();
      
      // Get the latest submission with ID
      const latestSubmission = session.submissions[session.submissions.length - 1];
      
      // Notify host in real-time
      const notificationData = {
        submission: {
          id: latestSubmission.id,
          alias: latestSubmission.alias,
          message: latestSubmission.message,
          timestamp: latestSubmission.timestamp
        },
        sessionId: session.id,
        totalSubmissions: session.submissions.length
      };
      
      // Send to host room
      const roomName = `sanctuary_host_${session.id}`;
      io.to(roomName).emit('sanctuary_new_submission', notificationData);
      
      // Get connected sockets in the room for debugging
      const room = io.sockets.adapter.rooms.get(roomName);
      const connectedClients = room ? room.size : 0;
      
      console.log(`📨 Real-time submission notification sent`, {
        sessionId: session.id,
        submissionId: latestSubmission.id,
        roomName,
        connectedClients,
        totalSubmissions: session.submissions.length,
        alias: latestSubmission.alias,
        messagePreview: latestSubmission.message.substring(0, 50) + '...'
      });
      
      if (connectedClients === 0) {
        console.warn(`⚠️  No hosts connected to room ${roomName} - message will not be delivered in real-time`);
      }
    } catch (socketError) {
      console.error('🚨 Socket notification error:', socketError);
      // Continue execution even if socket fails
    }
    
    res.json({
      success: true,
      data: {
        message: 'Message submitted successfully',
        submissionId: submission.id
      }
    });
    
  } catch (err) {
    console.error('Sanctuary submission error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error submitting message'
    });
  }
});

// Get submissions for host (anonymous inbox)
// GET /api/sanctuary/sessions/:id/submissions
router.get('/sessions/:id/submissions', getClientIp, async (req, res) => {
  try {
    const { hostToken } = req.query;
    let session;
    
    // Authentication logic similar to other host-only endpoints
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
        error: 'Not authorized to view submissions'
      });
    }
    
    // Return submissions with session info
    res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          topic: session.topic,
          description: session.description,
          emoji: session.emoji,
          mode: session.mode,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          agoraChannelName: session.agoraChannelName,
          maxParticipants: session.maxParticipants
        },
        submissions: session.submissions || []
      }
    });
    
  } catch (err) {
    console.error('Get submissions error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving submissions'
    });
  }
});

// Flag session for moderation
// POST /api/sanctuary/sessions/:id/flag
router.post('/sessions/:id/flag', async (req, res) => {
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
