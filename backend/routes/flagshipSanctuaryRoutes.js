const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const LiveSanctuarySession = require('../models/LiveSanctuarySession');
const ScheduledSession = require('../models/ScheduledSession');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const { generateRtcToken } = require('../utils/agoraTokenGenerator');
const redisService = require('../services/redisService');
const elevenLabsService = require('../services/elevenLabsService');
const aiModerationService = require('../services/aiModerationService');

// 🎯 FLAGSHIP ROUTES - Anonymous Live Audio Sanctuary

// ================== INSTANT SESSION CREATION ==================

// Create instant live session (immediate start)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const {
      topic,
      description,
      emoji = '🎙️',
      duration = 60, // minutes
      maxParticipants = 50,
      allowAnonymous = true,
      moderationEnabled = true,
      recordingEnabled = false,
      voiceModulationEnabled = true,
      aiModerationEnabled = true,
      accessType = 'public',
      tags = [],
      category = 'support'
    } = req.body;

    console.log('🎯 Creating instant flagship session:', { 
      topic, 
      duration,
      hostId: req.user.id 
    });

    // Validate required fields
    if (!topic || topic.trim().length < 5) {
      return res.error('Topic must be at least 5 characters', 400);
    }

    // Generate unique identifiers
    const sessionId = `flagship-${nanoid(8)}`;
    const channelName = `flagship_${sessionId}`;
    
    // Generate Agora tokens
    const sessionDurationSeconds = duration * 60;
    let agoraToken, hostToken;
    
    try {
      agoraToken = generateRtcToken(channelName, 0, 'subscriber', sessionDurationSeconds);
      hostToken = generateRtcToken(channelName, req.user.id, 'publisher', sessionDurationSeconds);
    } catch (agoraError) {
      console.warn('⚠️ Agora token generation failed:', agoraError.message);
      agoraToken = `temp_token_${nanoid(16)}`;
      hostToken = `temp_host_token_${nanoid(16)}`;
    }

    // Create live session
    const liveSession = new LiveSanctuarySession({
      id: sessionId,
      topic: topic.trim(),
      description: description?.trim(),
      emoji: emoji || '🎙️',
      hostId: req.user.id,
      hostAlias: req.user.alias || `Host_${nanoid(4)}`,
      hostToken,
      agoraChannelName: channelName,
      agoraToken,
      maxParticipants,
      allowAnonymous,
      moderationEnabled,
      emergencyContactEnabled: true,
      isRecorded: recordingEnabled,
      expiresAt: new Date(Date.now() + (sessionDurationSeconds * 1000)),
      participants: [{
        id: req.user.id,
        alias: req.user.alias || `Host_${nanoid(4)}`,
        isHost: true,
        isModerator: true,
        joinedAt: new Date(),
        avatarIndex: req.user.avatarIndex || 1
      }],
      status: 'active',
      isActive: true,
      startTime: new Date(),
      tags,
      estimatedDuration: duration,
      language: 'en'
    });

    await liveSession.save();

    // Cache session data in Redis
    await redisService.setSessionState(sessionId, {
      type: 'flagship-live',
      topic: liveSession.topic,
      hostId: liveSession.hostId,
      participants: liveSession.participants,
      status: 'active',
      voiceModulationEnabled,
      aiModerationEnabled
    }, sessionDurationSeconds);

    console.log('✅ Instant flagship session created:', {
      sessionId,
      channelName,
      duration
    });

    res.success({
      session: {
        id: liveSession.id,
        topic: liveSession.topic,
        description: liveSession.description,
        emoji: liveSession.emoji,
        hostAlias: liveSession.hostAlias,
        hostToken: liveSession.hostToken,
        agoraChannelName: liveSession.agoraChannelName,
        agoraToken: liveSession.agoraToken,
        maxParticipants: liveSession.maxParticipants,
        currentParticipants: liveSession.currentParticipants,
        participants: liveSession.participants,
        status: liveSession.status,
        startTime: liveSession.startTime,
        expiresAt: liveSession.expiresAt,
        voiceModulationEnabled,
        aiModerationEnabled,
        type: 'flagship-audio'
      }
    }, 'Flagship session created successfully');

  } catch (error) {
    console.error('❌ Flagship session creation error:', error);
    res.error('Failed to create flagship session: ' + error.message, 500);
  }
});

// Get session by ID
router.get('/:sessionId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log('🔍 Getting flagship session:', sessionId);

    // Try to get from live sessions first
    let session = await LiveSanctuarySession.findOne({ id: sessionId });
    
    if (!session) {
      // Try scheduled sessions
      const scheduledSession = await ScheduledSession.findOne({ 
        $or: [
          { id: sessionId },
          { liveSessionId: sessionId }
        ]
      });
      
      if (scheduledSession) {
        if (scheduledSession.liveSessionId) {
          session = await LiveSanctuarySession.findOne({ id: scheduledSession.liveSessionId });
        }
        
        if (!session) {
          // Return scheduled session data
          return res.success({
            session: {
              id: scheduledSession.id,
              topic: scheduledSession.topic,
              description: scheduledSession.description,
              emoji: scheduledSession.emoji,
              hostId: scheduledSession.hostId,
              hostAlias: scheduledSession.hostAlias,
              scheduledAt: scheduledSession.scheduledDateTime,
              duration: scheduledSession.duration,
              maxParticipants: scheduledSession.maxParticipants,
              currentParticipants: scheduledSession.preRegisteredParticipants.length,
              participants: scheduledSession.preRegisteredParticipants,
              status: scheduledSession.status,
              accessType: scheduledSession.accessType,
              invitationCode: scheduledSession.invitationCode,
              tags: scheduledSession.tags,
              category: scheduledSession.category,
              allowAnonymous: scheduledSession.allowAnonymous,
              moderationEnabled: scheduledSession.moderationEnabled,
              recordingEnabled: scheduledSession.recordingEnabled,
              createdAt: scheduledSession.createdAt,
              expiresAt: scheduledSession.estimatedEndTime
            }
          }, 'Scheduled session retrieved');
        }
      }
    }

    if (!session) {
      return res.error('Session not found', 404);
    }

    // Check if user has access to this session
    if (!session.allowAnonymous && !req.user) {
      return res.error('Authentication required', 401);
    }

    console.log('✅ Session retrieved:', {
      sessionId: session.id,
      participantCount: session.participants.length,
      status: session.status
    });

    res.success({
      session: {
        id: session.id,
        topic: session.topic,
        description: session.description,
        emoji: session.emoji,
        hostId: session.hostId,
        hostAlias: session.hostAlias,
        hostToken: session.hostToken,
        agoraChannelName: session.agoraChannelName,
        agoraToken: session.agoraToken,
        maxParticipants: session.maxParticipants,
        currentParticipants: session.currentParticipants,
        participants: session.participants,
        allowAnonymous: session.allowAnonymous,
        moderationEnabled: session.moderationEnabled,
        emergencyContactEnabled: session.emergencyContactEnabled,
        isRecorded: session.isRecorded,
        status: session.status,
        isActive: session.isActive,
        startTime: session.startTime,
        endedAt: session.endedAt,
        expiresAt: session.expiresAt,
        scheduledAt: session.scheduledAt,
        estimatedDuration: session.estimatedDuration,
        tags: session.tags,
        language: session.language,
        audioOnly: session.audioOnly,
        moderationLevel: session.moderationLevel,
        emergencyProtocols: session.emergencyProtocols,
        aiMonitoring: session.aiMonitoring
      }
    }, 'Session retrieved successfully');

  } catch (error) {
    console.error('❌ Get session error:', error);
    res.error('Failed to retrieve session: ' + error.message, 500);
  }
});

// ================== SCHEDULING SYSTEM ==================

// Create scheduled session
router.post('/schedule', authMiddleware, async (req, res) => {
  try {
    const {
      topic,
      description,
      emoji,
      scheduledDateTime,
      duration = 60, // minutes
      maxParticipants = 50,
      allowAnonymous = true,
      moderationEnabled = true,
      recordingEnabled = false,
      accessType = 'public',
      tags = [],
      category = 'support'
    } = req.body;

    console.log('📅 Creating scheduled session:', { 
      topic, 
      scheduledDateTime,
      hostId: req.user.id 
    });

    // Validate required fields
    if (!topic || !scheduledDateTime) {
      return res.error('Topic and scheduled date/time are required', 400);
    }

    // Validate scheduled time (must be in future)
    const scheduledDate = new Date(scheduledDateTime);
    if (scheduledDate <= new Date()) {
      return res.error('Scheduled time must be in the future', 400);
    }

    // Generate unique identifiers
    const sessionId = `scheduled-${nanoid(8)}`;
    const invitationCode = nanoid(6).toUpperCase();
    const channelName = `sanctuary_${sessionId}`;

    // Create scheduled session
    const scheduledSession = new ScheduledSession({
      id: sessionId,
      topic: topic.trim(),
      description: description?.trim(),
      emoji: emoji || '🎙️',
      hostId: req.user.id,
      hostAlias: req.user.alias || `Host_${nanoid(4)}`,
      scheduledDateTime: scheduledDate,
      duration,
      maxParticipants,
      allowAnonymous,
      moderationEnabled,
      recordingEnabled,
      accessType,
      invitationCode,
      agoraChannelName: channelName,
      tags,
      category,
      status: 'scheduled'
    });

    await scheduledSession.save();

    // Cache session data in Redis for quick access
    await redisService.setSessionState(sessionId, {
      type: 'scheduled',
      topic,
      scheduledDateTime: scheduledDate.toISOString(),
      hostId: req.user.id,
      invitationCode,
      status: 'scheduled'
    }, 7 * 24 * 3600); // Cache for 7 days

    console.log('✅ Scheduled session created:', {
      sessionId,
      invitationCode,
      scheduledDateTime: scheduledDate
    });

    res.success({
      session: {
        id: scheduledSession.id,
        topic: scheduledSession.topic,
        description: scheduledSession.description,
        emoji: scheduledSession.emoji,
        hostAlias: scheduledSession.hostAlias,
        scheduledDateTime: scheduledSession.scheduledDateTime,
        duration: scheduledSession.duration,
        invitationCode: scheduledSession.invitationCode,
        invitationLink: scheduledSession.invitationLink,
        maxParticipants: scheduledSession.maxParticipants,
        status: scheduledSession.status,
        accessType: scheduledSession.accessType
      }
    }, 'Scheduled session created successfully');

  } catch (error) {
    console.error('❌ Scheduled session creation error:', error);
    res.error('Failed to create scheduled session: ' + error.message, 500);
  }
});

// Get scheduled session by invitation code
router.get('/invitation/:code', optionalAuthMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    
    console.log('🎫 Looking up invitation:', code);
    
    const session = await ScheduledSession.findByInvitationCode(code);
    
    if (!session) {
      return res.error('Invalid invitation code', 404);
    }

    // Check if session is still valid
    const now = new Date();
    const sessionStart = new Date(session.scheduledDateTime);
    const sessionEnd = new Date(sessionStart.getTime() + (session.duration * 60 * 1000));

    let sessionStatus = 'scheduled';
    let timeInfo = {};

    if (now < sessionStart) {
      sessionStatus = 'scheduled';
      timeInfo = {
        timeUntilStart: Math.ceil((sessionStart - now) / (1000 * 60)), // minutes
        canJoinEarly: false
      };
    } else if (now >= sessionStart && now <= sessionEnd && session.status === 'live') {
      sessionStatus = 'live';
      timeInfo = {
        timeRemaining: Math.ceil((sessionEnd - now) / (1000 * 60)), // minutes
        canJoin: true
      };
    } else if (now > sessionEnd || session.status === 'completed') {
      sessionStatus = 'completed';
      timeInfo = {
        ended: true,
        canJoin: false
      };
    }

    res.success({
      session: {
        id: session.id,
        topic: session.topic,
        description: session.description,
        emoji: session.emoji,
        hostAlias: session.hostAlias,
        scheduledDateTime: session.scheduledDateTime,
        duration: session.duration,
        maxParticipants: session.maxParticipants,
        currentParticipants: session.preRegisteredParticipants.length,
        allowAnonymous: session.allowAnonymous,
        moderationEnabled: session.moderationEnabled,
        recordingEnabled: session.recordingEnabled,
        status: sessionStatus,
        liveSessionId: session.liveSessionId,
        ...timeInfo
      }
    }, 'Session invitation retrieved');

  } catch (error) {
    console.error('❌ Invitation lookup error:', error);
    res.error('Failed to retrieve session invitation: ' + error.message, 500);
  }
});

// Join scheduled session (pre-registration)
router.post('/invitation/:code/register', optionalAuthMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    const { alias, message } = req.body;

    const session = await ScheduledSession.findByInvitationCode(code);
    
    if (!session) {
      return res.error('Invalid invitation code', 404);
    }

    if (session.status !== 'scheduled') {
      return res.error('Session is not accepting registrations', 400);
    }

    const participantId = req.user?.id || `guest_${nanoid(8)}`;
    const participantAlias = alias || req.user?.alias || `Guest_${nanoid(4)}`;

    // Check if already registered
    const existing = session.preRegisteredParticipants.find(p => p.id === participantId);
    if (existing) {
      return res.error('Already registered for this session', 400);
    }

    // Add to appropriate list based on session settings
    if (session.requireApproval) {
      await session.addToWaitingList({
        id: participantId,
        alias: participantAlias,
        message: message || ''
      });
      
      res.success({
        status: 'pending_approval',
        message: 'Registration request submitted for approval'
      }, 'Added to waiting list');
    } else {
      await session.addParticipant({
        id: participantId,
        alias: participantAlias,
        email: req.user?.email
      });
      
      res.success({
        status: 'registered',
        session: {
          id: session.id,
          topic: session.topic,
          scheduledDateTime: session.scheduledDateTime
        }
      }, 'Successfully registered for session');
    }

  } catch (error) {
    console.error('❌ Session registration error:', error);
    res.error('Failed to register for session: ' + error.message, 500);
  }
});

// Start scheduled session (convert to live)
router.post('/schedule/:sessionId/start', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const scheduledSession = await ScheduledSession.findOne({ id: sessionId });
    
    if (!scheduledSession) {
      return res.error('Scheduled session not found', 404);
    }

    // Verify host
    if (scheduledSession.hostId !== req.user.id) {
      return res.error('Only the host can start the session', 403);
    }

    // Check if can start (within 15 minutes of scheduled time)
    const now = new Date();
    const scheduledTime = new Date(scheduledSession.scheduledDateTime);
    const timeDiff = Math.abs(now - scheduledTime) / (1000 * 60); // minutes
    
    if (timeDiff > 15 && now < scheduledTime) {
      return res.error('Session can only be started within 15 minutes of scheduled time', 400);
    }

    // Generate Agora tokens
    const channelName = scheduledSession.agoraChannelName;
    const sessionDuration = scheduledSession.duration * 60; // convert to seconds
    
    let agoraToken, hostToken;
    try {
      agoraToken = generateRtcToken(channelName, 0, 'subscriber', sessionDuration);
      hostToken = generateRtcToken(channelName, req.user.id, 'publisher', sessionDuration);
    } catch (agoraError) {
      console.warn('⚠️ Agora token generation failed:', agoraError.message);
      agoraToken = `temp_token_${nanoid(16)}`;
      hostToken = `temp_host_token_${nanoid(16)}`;
    }

    // Create live session
    const liveSession = new LiveSanctuarySession({
      id: `live-${nanoid(8)}`,
      topic: scheduledSession.topic,
      description: scheduledSession.description,
      emoji: scheduledSession.emoji,
      hostId: scheduledSession.hostId,
      hostAlias: scheduledSession.hostAlias,
      hostToken,
      agoraChannelName: channelName,
      agoraToken,
      maxParticipants: scheduledSession.maxParticipants,
      allowAnonymous: scheduledSession.allowAnonymous,
      moderationEnabled: scheduledSession.moderationEnabled,
      emergencyContactEnabled: true,
      recordingEnabled: scheduledSession.recordingEnabled,
      expiresAt: new Date(now.getTime() + (sessionDuration * 1000)),
      participants: [{
        id: req.user.id,
        alias: scheduledSession.hostAlias,
        isHost: true,
        isModerator: true,
        joinedAt: now,
        avatarIndex: req.user.avatarIndex || 1
      }],
      status: 'active',
      isActive: true,
      startTime: now
    });

    await liveSession.save();

    // Update scheduled session
    await scheduledSession.startLiveSession(liveSession.id);

    // Update Redis cache
    await redisService.setSessionState(liveSession.id, {
      type: 'live',
      topic: liveSession.topic,
      hostId: liveSession.hostId,
      participants: liveSession.participants,
      status: 'active'
    }, sessionDuration);

    console.log('✅ Scheduled session started as live session:', {
      scheduledId: sessionId,
      liveId: liveSession.id
    });

    res.success({
      liveSession: {
        id: liveSession.id,
        topic: liveSession.topic,
        agoraChannelName: liveSession.agoraChannelName,
        agoraToken: liveSession.agoraToken,
        hostToken: liveSession.hostToken,
        participants: liveSession.participants
      }
    }, 'Session started successfully');

  } catch (error) {
    console.error('❌ Session start error:', error);
    res.error('Failed to start session: ' + error.message, 500);
  }
});

// ================== VOICE MODULATION ==================

// Get available voice options
router.get('/voices', optionalAuthMiddleware, async (req, res) => {
  try {
    const voices = elevenLabsService.getAvailableVoices();
    
    res.success({
      voices,
      serviceStatus: {
        available: !!process.env.ELEVENLABS_API_KEY,
        fallbackEnabled: true
      }
    }, 'Voice options retrieved');

  } catch (error) {
    console.error('❌ Voice options error:', error);
    res.error('Failed to get voice options: ' + error.message, 500);
  }
});

// Generate voice preview
router.post('/voices/:voiceId/preview', optionalAuthMiddleware, async (req, res) => {
  try {
    const { voiceId } = req.params;
    const { text } = req.body;
    
    const previewText = text || "Welcome to the anonymous sanctuary. Your voice is now masked for privacy.";
    
    const result = await elevenLabsService.processWithFallback(
      () => elevenLabsService.generateVoicePreview(voiceId, previewText),
      () => ({ success: false, fallback: true, message: 'Voice preview unavailable' })
    );

    if (result.success) {
      res.success({
        audioPreview: result.audioPreview,
        voiceId
      }, 'Voice preview generated');
    } else {
      res.success({
        fallback: true,
        message: 'Voice modulation service temporarily unavailable'
      }, 'Voice preview unavailable');
    }

  } catch (error) {
    console.error('❌ Voice preview error:', error);
    res.error('Failed to generate voice preview: ' + error.message, 500);
  }
});

// ================== ENHANCED LIVE SESSIONS ==================

// Join live session with voice modulation
router.post('/:sessionId/join', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { 
      alias, 
      isAnonymous = false, 
      voiceModulation = null 
    } = req.body;
    
    console.log('🚪 Enhanced join request:', {
      sessionId,
      userId: req.user.id,
      voiceModulation: voiceModulation?.voiceId
    });

    // Get session (try both live and scheduled)
    let session = await LiveSanctuarySession.findOne({ id: sessionId });
    let isScheduledSession = false;
    
    if (!session) {
      // Check if it's a scheduled session that needs to be accessed
      const scheduledSession = await ScheduledSession.findOne({ 
        $or: [
          { id: sessionId },
          { liveSessionId: sessionId }
        ]
      });
      
      if (scheduledSession && scheduledSession.liveSessionId) {
        session = await LiveSanctuarySession.findOne({ id: scheduledSession.liveSessionId });
        isScheduledSession = true;
      }
    }

    if (!session) {
      return res.error('Session not found', 404);
    }

    // Validate session status
    if (!session.isActive || session.status !== 'active') {
      return res.error('Session is not active', 400);
    }

    if (new Date() > session.expiresAt) {
      return res.error('Session has expired', 410);
    }

    if (session.currentParticipants >= session.maxParticipants) {
      return res.error('Session is full', 400);
    }

    // Check if already in session
    const existingParticipant = session.participants.find(p => p.id === req.user.id);
    if (existingParticipant) {
      return res.error('Already in session', 400);
    }

    // Moderate join request
    const participantAlias = alias || req.user.alias || `Participant_${nanoid(4)}`;
    const moderationResult = await aiModerationService.moderateContent(
      `Join request: ${participantAlias}`,
      sessionId,
      req.user.id,
      'join_request'
    );

    if (!moderationResult.approved) {
      return res.error('Join request rejected by moderation system', 403);
    }

    // Create participant object
    const participant = {
      id: req.user.id,
      alias: participantAlias,
      isHost: false,
      isModerator: false,
      isMuted: true, // Start muted for better audio management
      isBlocked: false,
      handRaised: false,
      joinedAt: new Date(),
      avatarIndex: req.user.avatarIndex || Math.floor(Math.random() * 12) + 1,
      connectionStatus: 'connected',
      audioLevel: 0,
      speakingTime: 0,
      voiceModulation: voiceModulation ? {
        enabled: true,
        voiceId: voiceModulation.voiceId,
        settings: voiceModulation.settings || {}
      } : null
    };

    // Add participant to session
    session.participants.push(participant);
    session.currentParticipants = session.participants.length;
    await session.save();

    // Update Redis cache
    await redisService.addParticipant(sessionId, participant);
    await redisService.publishEvent(`session:${sessionId}`, 'participant_joined', {
      participant,
      sessionId,
      timestamp: new Date().toISOString()
    });

    console.log('✅ Enhanced join successful:', {
      sessionId,
      userId: req.user.id,
      voiceModulation: !!voiceModulation,
      participantCount: session.currentParticipants
    });

    res.success({
      session: {
        id: session.id,
        topic: session.topic,
        agoraChannelName: session.agoraChannelName,
        agoraToken: session.agoraToken,
        participant,
        moderationEnabled: session.moderationEnabled,
        voiceModulationAvailable: !!process.env.ELEVENLABS_API_KEY
      }
    }, 'Successfully joined live session');

  } catch (error) {
    console.error('❌ Enhanced join error:', error);
    res.error('Failed to join session: ' + error.message, 500);
  }
});

// Update voice modulation during session
router.post('/:sessionId/voice-modulation', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { voiceId, settings = {} } = req.body;

    const session = await LiveSanctuarySession.findOne({ id: sessionId });
    
    if (!session) {
      return res.error('Session not found', 404);
    }

    // Find participant
    const participantIndex = session.participants.findIndex(p => p.id === req.user.id);
    if (participantIndex === -1) {
      return res.error('Not a participant in this session', 400);
    }

    // Update voice modulation settings
    session.participants[participantIndex].voiceModulation = {
      enabled: !!voiceId,
      voiceId,
      settings,
      updatedAt: new Date()
    };

    await session.save();

    // Update Redis cache
    await redisService.addParticipant(sessionId, session.participants[participantIndex]);

    console.log('🎤 Voice modulation updated:', {
      sessionId,
      userId: req.user.id,
      voiceId
    });

    res.success({
      voiceModulation: session.participants[participantIndex].voiceModulation
    }, 'Voice modulation updated');

  } catch (error) {
    console.error('❌ Voice modulation update error:', error);
    res.error('Failed to update voice modulation: ' + error.message, 500);
  }
});

// ================== SESSION ANALYTICS ==================

// Get session analytics
router.get('/:sessionId/analytics', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await LiveSanctuarySession.findOne({ id: sessionId });
    
    if (!session) {
      return res.error('Session not found', 404);
    }

    // Check if user is host or admin
    if (session.hostId !== req.user.id && req.user.role !== 'admin') {
      return res.error('Access denied - host or admin only', 403);
    }

    // Get moderation analytics
    const moderationAnalytics = await aiModerationService.getSessionModerationAnalytics(sessionId);
    
    // Get Redis counters
    const redisCounters = await redisService.getCounters(`analytics:${sessionId}`);

    const analytics = {
      session: {
        id: session.id,
        topic: session.topic,
        startTime: session.startTime,
        duration: session.endedAt ? 
          Math.ceil((session.endedAt - session.startTime) / (1000 * 60)) : 
          Math.ceil((new Date() - session.startTime) / (1000 * 60)),
        status: session.status
      },
      participants: {
        total: session.participants.length,
        current: session.currentParticipants,
        peak: Math.max(session.currentParticipants, session.participants.length),
        voiceModulationUsers: session.participants.filter(p => p.voiceModulation?.enabled).length
      },
      engagement: {
        messagesCount: parseInt(redisCounters.messages) || 0,
        reactionsCount: parseInt(redisCounters.reactions) || 0,
        handRaisesCount: parseInt(redisCounters.handRaises) || 0,
        averageStayDuration: 0 // TODO: Calculate from participant data
      },
      moderation: moderationAnalytics.success ? moderationAnalytics.analytics : null,
      voiceAnalytics: {
        totalVoiceTime: parseInt(redisCounters.voiceTime) || 0,
        uniqueVoices: session.participants.map(p => p.voiceModulation?.voiceId).filter(Boolean).length
      }
    };

    res.success({ analytics }, 'Session analytics retrieved');

  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.error('Failed to get session analytics: ' + error.message, 500);
  }
});

// ================== EMERGENCY PROTOCOLS ==================

// Handle emergency alert
router.post('/:sessionId/emergency', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { alertType, message, severity = 'high' } = req.body;

    const session = await LiveSanctuarySession.findOne({ id: sessionId });
    
    if (!session) {
      return res.error('Session not found', 404);
    }

    // Verify participant
    const participant = session.participants.find(p => p.id === req.user.id);
    if (!participant) {
      return res.error('Not a participant in this session', 400);
    }

    // Log emergency alert
    console.log(`🚨 EMERGENCY ALERT in session ${sessionId}:`, {
      alertType,
      fromUser: req.user.id,
      severity
    });

    // Process through AI moderation for crisis detection
    const moderationResult = await aiModerationService.moderateContent(
      `Emergency alert: ${message}`,
      sessionId,
      req.user.id,
      'emergency_alert'
    );

    // Publish emergency event
    await redisService.publishEvent(`session:${sessionId}`, 'emergency_alert', {
      alertType,
      message,
      severity,
      fromParticipant: req.user.id,
      fromAlias: participant.alias,
      timestamp: new Date().toISOString(),
      moderationResult
    });

    // Increment emergency counter
    await redisService.incrementCounter(`analytics:${sessionId}`, 'emergencyAlerts');

    res.success({
      alertId: `alert_${nanoid(8)}`,
      status: 'sent',
      severity
    }, 'Emergency alert sent');

  } catch (error) {
    console.error('❌ Emergency alert error:', error);
    res.error('Failed to send emergency alert: ' + error.message, 500);
  }
});

module.exports = router;