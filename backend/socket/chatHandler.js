const { Server } = require('socket.io');
const redisService = require('../services/redisService');
const logger = require('../utils/helpers').logger;

class ChatHandler {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: ["http://localhost:8080", "http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io'
    });

    this.sessionParticipants = new Map(); // sessionId -> Set of participants
    this.participantSessions = new Map(); // participantId -> sessionId
    
    this.setupHandlers();
  }

  setupHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`🔌 Socket connected: ${socket.id}`);

      // Handle joining a sanctuary chat
      socket.on('join_sanctuary_chat', async (data) => {
        try {
          const { sessionId, participantId, alias } = data;
          
          if (!sessionId || !participantId || !alias) {
            socket.emit('error', { message: 'Missing required fields' });
            return;
          }

          // Join socket room for this session
          socket.join(`sanctuary_${sessionId}`);
          
          // Store participant info
          socket.participantId = participantId;
          socket.sessionId = sessionId;
          socket.alias = alias;

          // Update participant tracking
          if (!this.sessionParticipants.has(sessionId)) {
            this.sessionParticipants.set(sessionId, new Set());
          }
          this.sessionParticipants.get(sessionId).add(participantId);
          this.participantSessions.set(participantId, sessionId);

          // Store in Redis for persistence
          await redisService.setSessionParticipant(sessionId, participantId, {
            id: participantId,
            alias: alias,
            joinedAt: new Date().toISOString(),
            socketId: socket.id
          });

          // Notify others about new participant
          socket.to(`sanctuary_${sessionId}`).emit('participant_joined', {
            participantId,
            alias,
            count: this.sessionParticipants.get(sessionId).size
          });

          // Confirm join to participant
          socket.emit('join_confirmed', {
            sessionId,
            participantCount: this.sessionParticipants.get(sessionId).size
          });

          logger.info(`👥 ${alias} joined sanctuary chat ${sessionId}`);

        } catch (error) {
          logger.error('Error joining sanctuary chat:', error);
          socket.emit('error', { message: 'Failed to join chat' });
        }
      });

      // Handle chat messages
      socket.on('send_message', async (data) => {
        try {
          const { sessionId, message } = data;
          const participantId = socket.participantId;
          const alias = socket.alias;

          if (!sessionId || !message || !participantId) {
            socket.emit('error', { message: 'Invalid message data' });
            return;
          }

          // AI moderation check (basic implementation)
          if (await this.moderateMessage(message.content)) {
            socket.emit('message_blocked', { 
              reason: 'Message blocked by AI moderation' 
            });
            return;
          }

          // Create message object
          const chatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            participantId,
            participantAlias: alias,
            content: message.content,
            timestamp: new Date().toISOString(),
            type: 'text'
          };

          // Store message in Redis
          await redisService.storeChatMessage(sessionId, chatMessage);

          // Broadcast to all participants in session
          this.io.to(`sanctuary_${sessionId}`).emit('new_message', {
            message: chatMessage
          });

          logger.info(`💬 Message sent in ${sessionId} by ${alias}`);

        } catch (error) {
          logger.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle emoji reactions
      socket.on('send_reaction', async (data) => {
        try {
          const { sessionId, emoji } = data;
          const participantId = socket.participantId;
          const alias = socket.alias;

          if (!sessionId || !emoji || !participantId) {
            return;
          }

          // Broadcast reaction to all participants
          socket.to(`sanctuary_${sessionId}`).emit('emoji_reaction', {
            participantId,
            participantAlias: alias,
            emoji,
            timestamp: new Date().toISOString()
          });

          logger.info(`😊 ${alias} sent ${emoji} in ${sessionId}`);

        } catch (error) {
          logger.error('Error sending reaction:', error);
        }
      });

      // Handle hand raise/lower
      socket.on('toggle_hand', async (data) => {
        try {
          const { sessionId, isRaised } = data;
          const participantId = socket.participantId;
          const alias = socket.alias;

          if (!sessionId || typeof isRaised !== 'boolean' || !participantId) {
            return;
          }

          // Update participant state in Redis
          await redisService.updateParticipantState(sessionId, participantId, {
            handRaised: isRaised
          });

          // Notify all participants
          this.io.to(`sanctuary_${sessionId}`).emit('hand_raised', {
            participantId,
            participantAlias: alias,
            isRaised
          });

          logger.info(`✋ ${alias} ${isRaised ? 'raised' : 'lowered'} hand in ${sessionId}`);

        } catch (error) {
          logger.error('Error toggling hand:', error);
        }
      });

      // Handle emergency alerts
      socket.on('emergency_alert', async (data) => {
        try {
          const { sessionId, alertType, message } = data;
          const participantId = socket.participantId;
          const alias = socket.alias;

          if (!sessionId || !alertType || !participantId) {
            return;
          }

          // Log emergency alert
          logger.warn(`🚨 EMERGENCY ALERT in ${sessionId} by ${alias}: ${alertType} - ${message}`);

          // Store emergency alert
          await redisService.storeEmergencyAlert(sessionId, {
            participantId,
            participantAlias: alias,
            alertType,
            message,
            timestamp: new Date().toISOString()
          });

          // Notify all participants and moderators
          this.io.to(`sanctuary_${sessionId}`).emit('emergency_alert', {
            participantId,
            participantAlias: alias,
            alertType,
            message: message || 'Emergency assistance requested',
            timestamp: new Date().toISOString()
          });

          // TODO: Send to moderation system/admin notifications

        } catch (error) {
          logger.error('Error handling emergency alert:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        try {
          const participantId = socket.participantId;
          const sessionId = socket.sessionId;
          const alias = socket.alias;

          if (participantId && sessionId) {
            // Remove from tracking
            if (this.sessionParticipants.has(sessionId)) {
              this.sessionParticipants.get(sessionId).delete(participantId);
              
              // Clean up empty sessions
              if (this.sessionParticipants.get(sessionId).size === 0) {
                this.sessionParticipants.delete(sessionId);
              }
            }
            this.participantSessions.delete(participantId);

            // Remove from Redis
            await redisService.removeSessionParticipant(sessionId, participantId);

            // Notify others
            if (this.sessionParticipants.has(sessionId)) {
              socket.to(`sanctuary_${sessionId}`).emit('participant_left', {
                participantId,
                participantAlias: alias,
                count: this.sessionParticipants.get(sessionId).size
              });
            }

            logger.info(`👋 ${alias || participantId} left sanctuary chat ${sessionId}`);
          }

          logger.info(`🔌 Socket disconnected: ${socket.id}`);

        } catch (error) {
          logger.error('Error handling disconnect:', error);
        }
      });
    });
  }

  // AI moderation for messages
  async moderateMessage(content) {
    try {
      // Simple rule-based moderation (replace with actual AI service)
      const bannedWords = [
        'suicide', 'kill myself', 'end it all', 'self-harm', 
        'abuse', 'violence', 'illegal', 'drugs'
      ];
      
      const lowerContent = content.toLowerCase();
      return bannedWords.some(word => lowerContent.includes(word));
      
    } catch (error) {
      logger.error('Error in message moderation:', error);
      return false; // Allow message if moderation fails
    }
  }

  // Get session participants count
  getSessionParticipantCount(sessionId) {
    return this.sessionParticipants.get(sessionId)?.size || 0;
  }

  // Broadcast to session
  broadcastToSession(sessionId, event, data) {
    this.io.to(`sanctuary_${sessionId}`).emit(event, data);
  }
}

module.exports = ChatHandler;