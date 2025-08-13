const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        // Allow anonymous connections for public spaces
        socket.userId = `anonymous_${socket.id}`;
        socket.isAnonymous = true;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ id: decoded.user.id });
      
      if (!user) {
        return next(new Error('Authentication error'));
      }

      socket.userId = user.id;
      socket.userAlias = user.alias;
      socket.userAvatarIndex = user.avatarIndex;
      socket.isAnonymous = false;
      
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userAlias || 'Anonymous'})`);

    // Handle joining chat sessions
    socket.on('join_chat', async (data) => {
      const { sessionId, userType } = data;
      
      socket.join(`chat_${sessionId}`);
      socket.currentChatSession = sessionId;
      
      // Notify other participants
      socket.to(`chat_${sessionId}`).emit('user_joined', {
        userId: socket.userId,
        userAlias: socket.userAlias,
        userType,
        timestamp: new Date().toISOString()
      });
      
      console.log(`User ${socket.userId} joined chat session ${sessionId}`);
    });

    // Handle chat messages
    socket.on('send_message', async (data) => {
      const { sessionId, content, type = 'text', attachment } = data;
      
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender: {
          id: socket.userId,
          alias: socket.userAlias || 'Anonymous',
          avatarIndex: socket.userAvatarIndex,
          isExpert: data.isExpert || false
        },
        content,
        type,
        attachment,
        timestamp: new Date().toISOString(),
        sessionId
      };

      // Broadcast to all participants in the session
      io.to(`chat_${sessionId}`).emit('new_message', message);
      
      // TODO: Save message to database
      console.log(`Message sent in session ${sessionId}:`, content);
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { sessionId } = data;
      socket.to(`chat_${sessionId}`).emit('user_typing', {
        userId: socket.userId,
        userAlias: socket.userAlias,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { sessionId } = data;
      socket.to(`chat_${sessionId}`).emit('user_typing', {
        userId: socket.userId,
        userAlias: socket.userAlias,
        isTyping: false
      });
    });

    // Handle sanctuary spaces
    socket.on('join_sanctuary', async (data) => {
      const { sanctuaryId, participant } = data;
      
      socket.join(`sanctuary_${sanctuaryId}`);
      socket.currentSanctuary = sanctuaryId;
      
      // Notify other participants
      socket.to(`sanctuary_${sanctuaryId}`).emit('participant_joined', {
        participant: {
          id: socket.userId,
          alias: participant.alias || socket.userAlias || 'Anonymous',
          joinedAt: new Date().toISOString(),
          isAnonymous: socket.isAnonymous || participant.isAnonymous
        }
      });
      
      console.log(`User ${socket.userId} joined sanctuary ${sanctuaryId}`);
    });

    socket.on('sanctuary_message', async (data) => {
      const { sanctuaryId, content, type = 'text' } = data;
      
      const message = {
        id: `sanctuary_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        participantId: socket.userId,
        participantAlias: data.participantAlias || socket.userAlias || 'Anonymous',
        content,
        type,
        timestamp: new Date().toISOString()
      };

      // Broadcast to all participants in the sanctuary
      io.to(`sanctuary_${sanctuaryId}`).emit('sanctuary_new_message', message);
      
      console.log(`Sanctuary message in ${sanctuaryId}:`, content);
    });

    // Handle live audio room events
    socket.on('join_audio_room', (data) => {
      const { sessionId, participant } = data;
      
      socket.join(`audio_room_${sessionId}`);
      socket.currentAudioRoom = sessionId;
      
      // Notify others of participant joining
      socket.to(`audio_room_${sessionId}`).emit('audio_participant_joined', {
        participant: {
          id: socket.userId,
          alias: participant.alias || socket.userAlias || 'Anonymous',
          isHost: participant.isHost || false,
          isModerator: participant.isModerator || false,
          joinedAt: new Date().toISOString()
        }
      });
      
      console.log(`User ${socket.userId} joined audio room ${sessionId}`);
    });

    socket.on('raise_hand', (data) => {
      const { sessionId, isRaised } = data;
      
      socket.to(`audio_room_${sessionId}`).emit('hand_raised', {
        participantId: socket.userId,
        participantAlias: socket.userAlias || 'Anonymous',
        isRaised,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('promote_to_speaker', (data) => {
      const { sessionId, participantId } = data;
      
      // Find target user's socket
      const targetSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === participantId);
      
      if (targetSocket) {
        targetSocket.emit('promoted_to_speaker', {
          sessionId,
          promotedBy: socket.userId,
          timestamp: new Date().toISOString()
        });
        
        // Notify room
        io.to(`audio_room_${sessionId}`).emit('speaker_promoted', {
          participantId,
          promotedBy: socket.userId,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('mute_participant', (data) => {
      const { sessionId, participantId } = data;
      
      // Find target user's socket
      const targetSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === participantId);
      
      if (targetSocket) {
        targetSocket.emit('force_muted', {
          sessionId,
          mutedBy: socket.userId,
          timestamp: new Date().toISOString()
        });
        
        // Notify room
        io.to(`audio_room_${sessionId}`).emit('participant_muted', {
          participantId,
          mutedBy: socket.userId,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('kick_participant', (data) => {
      const { sessionId, participantId } = data;
      
      // Find target user's socket
      const targetSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === participantId);
      
      if (targetSocket) {
        targetSocket.emit('kicked_from_room', {
          sessionId,
          kickedBy: socket.userId,
          timestamp: new Date().toISOString()
        });
        
        targetSocket.leave(`audio_room_${sessionId}`);
        
        // Notify room
        socket.to(`audio_room_${sessionId}`).emit('participant_kicked', {
          participantId,
          kickedBy: socket.userId,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('send_emoji_reaction', (data) => {
      const { sessionId, emoji } = data;
      
      socket.to(`audio_room_${sessionId}`).emit('emoji_reaction', {
        participantId: socket.userId,
        participantAlias: socket.userAlias || 'Anonymous',
        emoji,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('emergency_alert', (data) => {
      const { sessionId, alertType, message } = data;
      
      // Send to all participants and moderators
      io.to(`audio_room_${sessionId}`).emit('emergency_alert', {
        alertType,
        message,
        fromParticipant: socket.userId,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Emergency alert in ${sessionId}: ${alertType} - ${message}`);
    });

    // Handle voice chat requests
    socket.on('request_voice_chat', (data) => {
      const { targetUserId, sessionId } = data;
      
      // Find target user's socket
      const targetSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('voice_chat_request', {
          fromUserId: socket.userId,
          fromUserAlias: socket.userAlias,
          sessionId,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('voice_chat_response', (data) => {
      const { targetUserId, accepted, sessionId } = data;
      
      const targetSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('voice_chat_response', {
          fromUserId: socket.userId,
          fromUserAlias: socket.userAlias,
          accepted,
          sessionId,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Leave current chat session
      if (socket.currentChatSession) {
        socket.to(`chat_${socket.currentChatSession}`).emit('user_left', {
          userId: socket.userId,
          userAlias: socket.userAlias,
          timestamp: new Date().toISOString()
        });
      }
      
      // Leave current sanctuary
      if (socket.currentSanctuary) {
        socket.to(`sanctuary_${socket.currentSanctuary}`).emit('participant_left', {
          participantId: socket.userId,
          participantAlias: socket.userAlias,
          timestamp: new Date().toISOString()
        });
      }
      
      // Leave current audio room
      if (socket.currentAudioRoom) {
        socket.to(`audio_room_${socket.currentAudioRoom}`).emit('audio_participant_left', {
          participantId: socket.userId,
          participantAlias: socket.userAlias,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle message delivery confirmations
    socket.on('message_delivered', (data) => {
      const { messageId, sessionId } = data;
      socket.to(`chat_${sessionId}`).emit('message_status_update', {
        messageId,
        status: 'delivered',
        userId: socket.userId
      });
    });

    socket.on('message_read', (data) => {
      const { messageId, sessionId } = data;
      socket.to(`chat_${sessionId}`).emit('message_status_update', {
        messageId,
        status: 'read',
        userId: socket.userId
      });
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };