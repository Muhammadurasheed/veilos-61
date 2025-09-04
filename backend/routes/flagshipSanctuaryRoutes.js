const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const aiModerationService = require('../services/aiModerationService');
const redisService = require('../services/redisService');
const agoraTokenGenerator = require('../utils/agoraTokenGenerator');

// Response handlers middleware
const responseHandler = require('../middleware/responseHandler');
router.use(responseHandler);

// Authentication middleware
const authMiddleware = require('../middleware/auth');

// Debug middleware
router.use((req, res, next) => {
  console.log('🎯 Flagship Sanctuary API Debug:', {
    method: req.method,
    path: req.path,
    url: req.url,
    body: req.method !== 'GET' ? req.body : 'N/A'
  });
  next();
});

// ElevenLabs voices endpoint
router.get('/voices', (req, res) => {
  console.log('🎭 Getting available voices');
  
  const voices = [
    { id: 'rachel', name: 'Rachel', gender: 'female', accent: 'american' },
    { id: 'drew', name: 'Drew', gender: 'male', accent: 'american' },
    { id: 'clyde', name: 'Clyde', gender: 'male', accent: 'american' },
    { id: 'paul', name: 'Paul', gender: 'male', accent: 'british' },
    { id: 'domi', name: 'Domi', gender: 'female', accent: 'american' },
    { id: 'dave', name: 'Dave', gender: 'male', accent: 'british' }
  ];

  res.success(voices, 'Available voices retrieved');
});

// Schedule session endpoint
router.post('/schedule', authMiddleware, async (req, res) => {
  try {
    const {
      topic,
      description,
      emoji,
      scheduledDateTime,
      duration,
      maxParticipants,
      accessType,
      voiceModulationEnabled,
      moderationEnabled,
      recordingEnabled,
      allowAnonymous,
      tags,
      category
    } = req.body;

    console.log('📅 Creating scheduled session:', {
      topic,
      scheduledDateTime,
      hostId: req.user.id
    });

    const sessionId = `scheduled-${nanoid(8)}`;
    const invitationCode = nanoid(6).toUpperCase();

    const sessionData = {
      id: sessionId,
      type: 'scheduled',
      topic,
      description: description || '',
      emoji: emoji || '💭',
      
      // Host information
      hostId: req.user.id,
      hostAlias: req.user.alias,
      hostToken: nanoid(16),
      
      // Session configuration
      maxParticipants: maxParticipants || 50,
      allowAnonymous: allowAnonymous !== false,
      audioOnly: true,
      moderationEnabled: moderationEnabled !== false,
      emergencyContactEnabled: true,
      recordingEnabled: recordingEnabled === true,
      voiceModulationEnabled: voiceModulationEnabled !== false,
      requireApproval: false,
      
      // Scheduling
      scheduledDateTime,
      duration: duration || 60,
      timezone: 'UTC',
      accessType: accessType || 'public',
      invitationCode,
      invitationLink: `${req.protocol}://${req.get('host')}/flagship-sanctuary/${sessionId}?code=${invitationCode}`,
      
      // Session state
      status: 'scheduled',
      participants: [],
      participantCount: 0,
      preRegisteredParticipants: [],
      waitingList: [],
      
      // Voice and moderation
      availableVoices: [],
      voiceSettings: { enabled: voiceModulationEnabled !== false },
      moderationLevel: 'medium',
      aiModerationEnabled: moderationEnabled !== false,
      
      // Metadata
      tags: tags || [],
      category: category || 'general',
      language: 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      
      // Features
      emergencyProtocols: [],
      breakoutRoomsEnabled: false,
      breakoutRooms: [],
      
      // Metrics
      metrics: {
        totalJoins: 0,
        peakParticipants: 0,
        averageStayDuration: 0,
        messagesCount: 0,
        reactionsCount: 0,
        voiceModulationUsage: 0,
        moderationInterventions: 0,
        emergencyAlerts: 0,
        networkQualityAverage: 0,
        audioQualityScore: 0
      }
    };

    // Save session
    await redisService.setSessionState(sessionId, sessionData);
    
    // Save to user's history
    const userSessionKey = `user-sanctuaries-${req.user.id}`;
    const userSessions = await redisService.getSessionState(userSessionKey) || [];
    userSessions.push({
      sessionId,
      topic,
      emoji: emoji || '💭',
      mode: 'scheduled-audio',
      createdAt: new Date().toISOString(),
      scheduledDateTime,
      isHost: true,
      status: 'scheduled'
    });
    await redisService.setSessionState(userSessionKey, userSessions);
    console.log('💾 Scheduled session saved to user history:', req.user.id);

    console.log('✅ Scheduled session created:', {
      sessionId,
      invitationCode,
      scheduledDateTime: new Date(scheduledDateTime)
    });

    res.success({
      sessionId,
      invitationCode,
      invitationLink: sessionData.invitationLink,
      scheduledDateTime: sessionData.scheduledDateTime,
      hostToken: sessionData.hostToken
    }, 'Scheduled session created successfully');

  } catch (error) {
    console.error('❌ Error creating scheduled session:', error);
    res.error('Failed to create scheduled session: ' + error.message, 500);
  }
});

// Create instant session endpoint
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const {
      topic,
      description,
      emoji,
      duration,
      maxParticipants,
      accessType,
      voiceModulationEnabled,
      moderationEnabled,
      recordingEnabled,
      allowAnonymous,
      tags,
      category
    } = req.body;

    console.log('🎤 Creating instant flagship session:', {
      topic,
      hostId: req.user.id
    });

    const sessionId = `flagship-${nanoid(8)}`;
    const invitationCode = nanoid(6).toUpperCase();
    const agoraChannelName = `flagship-${nanoid(6)}`;

    const sessionData = {
      id: sessionId,
      type: 'flagship',
      topic,
      description: description || '',
      emoji: emoji || '🎤',
      
      // Host information
      hostId: req.user.id,
      hostAlias: req.user.alias,
      hostToken: nanoid(16),
      
      // Session configuration
      maxParticipants: maxParticipants || 50,
      allowAnonymous: allowAnonymous !== false,
      audioOnly: true,
      moderationEnabled: moderationEnabled !== false,
      emergencyContactEnabled: true,
      recordingEnabled: recordingEnabled === true,
      voiceModulationEnabled: voiceModulationEnabled !== false,
      requireApproval: false,
      
      // Access control
      accessType: accessType || 'public',
      invitationCode,
      invitationLink: `${req.protocol}://${req.get('host')}/flagship-sanctuary/${sessionId}?code=${invitationCode}`,
      
      // Session state
      status: 'active',
      isActive: true,
      participants: [],
      participantCount: 0,
      currentParticipants: 0,
      preRegisteredParticipants: [],
      waitingList: [],
      
      // Agora configuration
      agoraChannelName,
      agoraToken: null, // Will be generated when needed
      
      // Voice and moderation
      availableVoices: [],
      voiceSettings: { enabled: voiceModulationEnabled !== false },
      moderationLevel: 'medium',
      aiModerationEnabled: moderationEnabled !== false,
      
      // Timing
      createdAt: new Date().toISOString(),
      actualStartTime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (duration || 60) * 60 * 1000).toISOString(),
      
      // Metadata
      tags: tags || [],
      category: category || 'general',
      language: 'en',
      
      // Features
      emergencyProtocols: [],
      breakoutRoomsEnabled: false,
      breakoutRooms: [],
      
      // Metrics
      metrics: {
        totalJoins: 0,
        peakParticipants: 0,
        averageStayDuration: 0,
        messagesCount: 0,
        reactionsCount: 0,
        voiceModulationUsage: 0,
        moderationInterventions: 0,
        emergencyAlerts: 0,
        networkQualityAverage: 0,
        audioQualityScore: 0
      }
    };

    // Save session
    await redisService.setSessionState(sessionId, sessionData);
    
    // Save to user's history
    const userSessionKey = `user-sanctuaries-${req.user.id}`;
    const userSessions = await redisService.getSessionState(userSessionKey) || [];
    userSessions.push({
      sessionId,
      topic,
      emoji: emoji || '🎤',
      mode: 'live-audio',
      createdAt: new Date().toISOString(),
      isHost: true,
      status: 'active'
    });
    await redisService.setSessionState(userSessionKey, userSessions);
    console.log('💾 Session saved to user history:', req.user.id);

    console.log('✅ Instant flagship session created:', {
      sessionId,
      invitationCode,
      agoraChannelName
    });

    res.success({
      sessionId,
      invitationCode,
      invitationLink: sessionData.invitationLink,
      agoraChannelName,
      hostToken: sessionData.hostToken,
      redirectTo: `/flagship-sanctuary/${sessionId}?instant=true`
    }, 'Instant flagship session created successfully');

  } catch (error) {
    console.error('❌ Error creating instant session:', error);
    res.error('Failed to create instant session: ' + error.message, 500);
  }
});

// Get session data endpoint
router.get('/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    console.log('🔍 Getting flagship session:', sessionId);

    const session = await redisService.getSessionState(sessionId);
    
    if (!session) {
      return res.error('Session not found', 404);
    }

    console.log('📋 Returning session data for:', sessionId, session.type || 'unknown');

    // Return appropriate session data based on type
    if (session.type === 'scheduled') {
      console.log('📋 Returning scheduled session data for:', sessionId);
      return res.success(session, 'Scheduled session retrieved');
    } else {
      return res.success(session, 'Flagship session retrieved');
    }
    
  } catch (error) {
    console.error('❌ Error getting session:', error);
    res.error('Failed to get session: ' + error.message, 500);
  }
});

// Session start endpoint (for scheduled sessions)
router.post('/:sessionId/start', authMiddleware, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    console.log('🚀 Starting scheduled session:', sessionId);

    const scheduledSession = await redisService.getSessionState(sessionId);
    
    if (!scheduledSession || scheduledSession.type !== 'scheduled') {
      return res.error('Scheduled session not found', 404);
    }

    // Check if already converted
    if (scheduledSession.liveSessionId) {
      const existingLiveSession = await redisService.getSessionState(scheduledSession.liveSessionId);
      if (existingLiveSession && existingLiveSession.status === 'active') {
        return res.success({
          liveSessionId: scheduledSession.liveSessionId,
          redirectTo: `/flagship-sanctuary/${scheduledSession.liveSessionId}`,
          session: existingLiveSession
        }, 'Session already converted');
      }
    }

    const now = new Date();
    const liveSessionData = {
      id: `flagship-${nanoid(8)}`,
      type: 'flagship',
      topic: scheduledSession.topic,
      description: scheduledSession.description,
      emoji: scheduledSession.emoji,
      
      // Host and participants
      hostId: scheduledSession.hostId,
      hostAlias: scheduledSession.hostAlias,
      hostToken: scheduledSession.hostToken,
      participants: [],
      participantCount: 0,
      currentParticipants: 0,
      maxParticipants: scheduledSession.maxParticipants,
      preRegisteredParticipants: scheduledSession.preRegisteredParticipants || [],
      waitingList: [],
      
      // Session configuration
      allowAnonymous: scheduledSession.allowAnonymous,
      audioOnly: scheduledSession.audioOnly,
      moderationEnabled: scheduledSession.moderationEnabled,
      emergencyContactEnabled: scheduledSession.emergencyContactEnabled,
      recordingEnabled: scheduledSession.recordingEnabled,
      voiceModulationEnabled: scheduledSession.voiceModulationEnabled,
      
      // Status and timing
      status: 'active',
      isActive: true,
      actualStartTime: now.toISOString(),
      createdAt: scheduledSession.createdAt,
      expiresAt: new Date(now.getTime() + (scheduledSession.duration || 60) * 60 * 1000).toISOString(),
      
      // Access control
      accessType: scheduledSession.accessType,
      invitationCode: scheduledSession.invitationCode,
      invitationLink: scheduledSession.invitationLink,
      requireApproval: scheduledSession.requireApproval,
      
      // Agora settings
      agoraChannelName: `flagship-${nanoid(6)}`,
      agoraToken: null, // Will be generated when needed
      
      // Voice and moderation
      availableVoices: scheduledSession.availableVoices || [],
      voiceSettings: scheduledSession.voiceSettings || { enabled: false },
      moderationLevel: scheduledSession.moderationLevel || 'medium',
      aiModerationEnabled: scheduledSession.aiModerationEnabled !== false,
      
      // Metadata
      tags: scheduledSession.tags || [],
      category: scheduledSession.category || 'general',
      language: scheduledSession.language || 'en',
      
      // Features
      emergencyProtocols: scheduledSession.emergencyProtocols || [],
      emergencyContactEnabled: scheduledSession.emergencyContactEnabled || false,
      breakoutRoomsEnabled: false,
      breakoutRooms: []
    };
    
    // Save live session
    await redisService.setSessionState(liveSessionData.id, liveSessionData);
    
    // Update scheduled session with live session reference
    scheduledSession.status = 'live';
    scheduledSession.liveSessionId = liveSessionData.id;
    scheduledSession.actualStartTime = now;
    await redisService.setSessionState(sessionId, scheduledSession);
    
    console.log('✅ Scheduled session converted to live:', liveSessionData.id);
    
    // Save session to user's history for My Sanctuaries tracking
    if (req.user?.id) {
      const userSessionKey = `user-sanctuaries-${req.user.id}`;
      const userSessions = await redisService.getSessionState(userSessionKey) || [];
      userSessions.push({
        sessionId: liveSessionData.id,
        originalScheduledId: sessionId,
        topic: liveSessionData.topic,
        emoji: liveSessionData.emoji,
        mode: 'live-audio',
        createdAt: now.toISOString(),
        isHost: true,
        status: 'active'
      });
      await redisService.setSessionState(userSessionKey, userSessions);
      console.log('💾 Session saved to user history:', req.user.id);
    }
    
    res.success({
      liveSessionId: liveSessionData.id,
      redirectTo: `/flagship-sanctuary/${liveSessionData.id}`,
      session: liveSessionData,
      agoraToken: null // Will be generated on actual join
    }, 'Session converted to live');

  } catch (error) {
    console.error('❌ Error starting session:', error);
    res.error('Failed to start session: ' + error.message, 500);
  }
});

// Join session endpoint
router.post('/:sessionId/join', authMiddleware, async (req, res) => {
  try {
    // Enhanced join request handler
    const sessionId = req.params.sessionId;
    const { alias, voiceModulation } = req.body;
    
    console.log('🚪 Enhanced join request:', {
      sessionId,
      userId: req.user?.id,
      ...req.body
    });
    
    // Get session data
    let session = await redisService.getSessionState(sessionId);
    let isScheduledSession = false;
    
    // Check if this is a scheduled session that needs conversion
    if (session && session.type === 'scheduled') {
      isScheduledSession = true;
      
      const now = new Date();
      const scheduledTime = new Date(session.scheduledDateTime);
      
      // Check if session is ready to start (within 1 minute of scheduled time)
      if (now >= scheduledTime || (scheduledTime - now) <= 60000) {
        // Check if already converted by looking for existing live session
        if (session.liveSessionId) {
          const existingLiveSession = await redisService.getSessionState(session.liveSessionId);
          if (existingLiveSession && existingLiveSession.status === 'active') {
            console.log('🔄 Using existing live session:', session.liveSessionId);
            return res.status(200).json({
              success: false,
              message: 'Session conversion required',
              data: {
                needsConversion: true,
                liveSessionId: session.liveSessionId,
                redirectTo: `/flagship-sanctuary/${session.liveSessionId}`
              }
            });
          }
        }
        
        console.log('🔄 Auto-starting scheduled session:', sessionId);
        
        try {
          // Create live session data
          const liveSessionData = {
            id: `flagship-${nanoid(8)}`,
            type: 'flagship',
            topic: session.topic,
            description: session.description,
            emoji: session.emoji,
            
            // Host and participants
            hostId: session.hostId,
            hostAlias: session.hostAlias,
            hostToken: session.hostToken,
            participants: [],
            participantCount: 0,
            currentParticipants: 0,
            maxParticipants: session.maxParticipants,
            preRegisteredParticipants: session.preRegisteredParticipants || [],
            waitingList: [],
            
            // Session configuration
            allowAnonymous: session.allowAnonymous,
            audioOnly: session.audioOnly,
            moderationEnabled: session.moderationEnabled,
            emergencyContactEnabled: session.emergencyContactEnabled,
            recordingEnabled: session.recordingEnabled,
            voiceModulationEnabled: session.voiceModulationEnabled,
            
            // Status and timing
            status: 'active',
            isActive: true,
            actualStartTime: now.toISOString(),
            createdAt: session.createdAt,
            expiresAt: new Date(now.getTime() + (session.duration || 60) * 60 * 1000).toISOString(),
            
            // Access control
            accessType: session.accessType,
            invitationCode: session.invitationCode,
            invitationLink: session.invitationLink,
            requireApproval: session.requireApproval,
            
            // Agora settings
            agoraChannelName: `flagship-${nanoid(6)}`,
            agoraToken: null, // Will be generated when needed
            
            // Voice and moderation
            availableVoices: session.availableVoices || [],
            voiceSettings: session.voiceSettings || { enabled: false },
            moderationLevel: session.moderationLevel || 'medium',
            aiModerationEnabled: session.aiModerationEnabled !== false,
            
            // Metadata
            tags: session.tags || [],
            category: session.category || 'general',
            language: session.language || 'en',
            
            // Features
            emergencyProtocols: session.emergencyProtocols || [],
            emergencyContactEnabled: session.emergencyContactEnabled || false,
            breakoutRoomsEnabled: false,
            breakoutRooms: []
          };
          
          // Save live session
          await redisService.setSessionState(liveSessionData.id, liveSessionData);
          
          // Update scheduled session with live session reference
          session.status = 'live';
          session.liveSessionId = liveSessionData.id;
          session.actualStartTime = now;
          await redisService.setSessionState(sessionId, session);
          
          console.log('✅ Scheduled session converted to live:', liveSessionData.id);
          
          // Save session to user's history for My Sanctuaries tracking
          if (req.user?.id) {
            const userSessionKey = `user-sanctuaries-${req.user.id}`;
            const userSessions = await redisService.getSessionState(userSessionKey) || [];
            userSessions.push({
              sessionId: liveSessionData.id,
              originalScheduledId: sessionId,
              topic: liveSessionData.topic,
              emoji: liveSessionData.emoji,
              mode: 'live-audio',
              createdAt: now.toISOString(),
              isHost: true
            });
            await redisService.setSessionState(userSessionKey, userSessions);
            console.log('💾 Session saved to user history:', req.user.id);
          }
          
          // Return conversion required response so frontend can redirect
          return res.status(400).json({
            success: false,
            message: 'Session conversion required',
            data: {
              needsConversion: true,
              liveSessionId: liveSessionData.id,
              redirectTo: `/flagship-sanctuary/${liveSessionData.id}`
            }
          });
      
        } catch (conversionError) {
          console.error('❌ Session conversion error:', conversionError);
          return res.status(500).json({
            success: false,
            message: 'Failed to convert session: ' + conversionError.message
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Session has not started yet'
        });
      }
    }
    
    // Continue with regular session logic if not a scheduled session

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

    // Generate user ID for anonymous users
    const userId = req.user?.id || `anon_${nanoid(8)}`;
    
    // Check if already in session
    const existingParticipant = session.participants.find(p => p.id === userId);
    if (existingParticipant) {
      return res.success({
        participant: existingParticipant,
        session: {
          id: session.id,
          topic: session.topic,
          agoraChannelName: session.agoraChannelName,
          agoraToken: session.agoraToken,
          moderationEnabled: session.moderationEnabled,
          voiceModulationAvailable: !!process.env.ELEVENLABS_API_KEY
        }
      }, 'Already in session');
    }

    // Create participant alias
    const participantAlias = alias || req.user?.alias || `Participant_${nanoid(4)}`;
    
    // Moderate join request
    const moderationResult = await aiModerationService.moderateContent(
      `Join request: ${participantAlias}`,
      sessionId,
      userId
    );

    if (moderationResult.blocked) {
      return res.error('Join request blocked by content moderation', 403);
    }

    // Generate Agora token if needed
    let agoraToken = session.agoraToken;
    if (!agoraToken && session.agoraChannelName) {
      try {
        agoraToken = agoraTokenGenerator.generateToken(
          session.agoraChannelName,
          userId,
          'publisher', // All participants can publish audio
          3600 // 1 hour expiry
        );
        
        // Update session with token
        session.agoraToken = agoraToken;
      } catch (error) {
        console.error('❌ Failed to generate Agora token:', error);
      }
    }

    // Create participant object
    const participant = {
      id: userId,
      alias: participantAlias,
      isHost: userId === session.hostId,
      isModerator: userId === session.hostId, // Host is also moderator for now
      isAnonymous: !req.user?.id,
      
      // Audio state
      isMuted: true, // Start muted
      isDeafened: false,
      handRaised: false,
      isSpeaking: false,
      audioLevel: 0,
      
      // Voice modulation
      selectedVoiceId: null,
      voiceSettings: null,
      
      // Session data
      joinedAt: new Date().toISOString(),
      connectionStatus: 'connecting',
      networkQuality: 'excellent',
      speakingTime: 0,
      messageCount: 0,
      
      // Moderation
      warnings: 0,
      isBanned: false,
      moderationFlags: [],
      
      // UI state
      avatarIndex: req.user?.avatarIndex || Math.floor(Math.random() * 8) + 1,
      reactions: []
    };

    // Add participant to session
    session.participants.push(participant);
    session.participantCount = session.participants.length;
    session.currentParticipants = session.participants.length;
    session.updatedAt = new Date().toISOString();

    // Update metrics
    session.metrics.totalJoins++;
    session.metrics.peakParticipants = Math.max(
      session.metrics.peakParticipants,
      session.participantCount
    );

    // Save updated session
    await redisService.setSessionState(sessionId, session);

    console.log('✅ Participant joined session:', {
      sessionId,
      participantId: userId,
      participantAlias,
      currentParticipants: session.currentParticipants
    });

    // Return success response
    res.success({
      participant,
      session: {
        id: session.id,
        topic: session.topic,
        agoraChannelName: session.agoraChannelName,
        agoraToken,
        moderationEnabled: session.moderationEnabled,
        voiceModulationAvailable: !!process.env.ELEVENLABS_API_KEY,
        hostId: session.hostId,
        maxParticipants: session.maxParticipants,
        currentParticipants: session.currentParticipants
      }
    }, 'Successfully joined session');

  } catch (error) {
    console.error('❌ Error joining session:', error);
    res.error('Failed to join session: ' + error.message, 500);
  }
});

// Leave session endpoint
router.post('/:sessionId/leave', authMiddleware, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.user?.id;

    if (!userId) {
      return res.error('Authentication required', 401);
    }

    console.log('🚪 Leave session request:', { sessionId, userId });

    const session = await redisService.getSessionState(sessionId);
    if (!session) {
      return res.error('Session not found', 404);
    }

    // Find and remove participant
    const participantIndex = session.participants.findIndex(p => p.id === userId);
    if (participantIndex === -1) {
      return res.error('Participant not found in session', 404);
    }

    const participant = session.participants[participantIndex];
    session.participants.splice(participantIndex, 1);
    session.participantCount = session.participants.length;
    session.currentParticipants = session.participants.length;
    session.updatedAt = new Date().toISOString();

    // If host leaves, end the session
    if (participant.isHost) {
      session.status = 'ended';
      session.isActive = false;
      session.actualEndTime = new Date().toISOString();
      console.log('🔚 Session ended - host left:', sessionId);
    }

    // Save updated session
    await redisService.setSessionState(sessionId, session);

    console.log('✅ Participant left session:', {
      sessionId,
      participantId: userId,
      currentParticipants: session.currentParticipants,
      sessionEnded: !session.isActive
    });

    res.success({
      sessionEnded: !session.isActive,
      currentParticipants: session.currentParticipants
    }, 'Successfully left session');

  } catch (error) {
    console.error('❌ Error leaving session:', error);
    res.error('Failed to leave session: ' + error.message, 500);
  }
});

// Get user sessions endpoint
router.get('/user/sessions', authMiddleware, async (req, res) => {
  console.log('📋 Getting user flagship sanctuary sessions:', req.user?.id);
  
  if (!req.user?.id) {
    return res.error('Authentication required', 401);
  }

  try {
    // Get user sessions from cache
    const userSessionKey = `user-sanctuaries-${req.user.id}`;
    const sessions = await redisService.getSessionState(userSessionKey);
    const sessionsData = sessions || [];
    
    // Enrich session data with current status
    const enrichedSessions = await Promise.all(
      sessionsData.map(async (sessionItem) => {
        try {
          const sessionData = await redisService.getSessionState(sessionItem.sessionId);
          return {
            ...sessionItem,
            status: sessionData?.status || 'ended',
            isActive: sessionData?.isActive || false,
            currentParticipants: sessionData?.participantCount || 0,
            maxParticipants: sessionData?.maxParticipants || 0,
            actualStartTime: sessionData?.actualStartTime,
            actualEndTime: sessionData?.actualEndTime
          };
        } catch (error) {
          console.warn('⚠️ Could not enrich session data for:', sessionItem.sessionId);
          return sessionItem;
        }
      })
    );
    
    console.log('✅ User sessions retrieved:', { 
      userId: req.user.id, 
      totalSessions: enrichedSessions.length,
      active: enrichedSessions.filter(s => s.isActive !== false).length
    });
    
    res.success({
      flagshipSessions: enrichedSessions,
      anonymousSessions: [] // Will be added later if needed
    }, 'User flagship sanctuary sessions retrieved');
  } catch (error) {
    console.error('❌ Error getting user sessions:', error);
    res.error('Failed to get user sessions', 500);
  }
});

module.exports = router;