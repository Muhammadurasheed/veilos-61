
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `msg-${nanoid(8)}`,
    unique: true
  },
  sender: {
    id: String,
    alias: String,
    role: {
      type: String,
      enum: ['user', 'expert', 'system'],
      required: true
    },
    avatarUrl: String,
    avatarIndex: Number
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'voice', 'file', 'system'],
    default: 'text'
  },
  attachment: {
    url: String,
    fileName: String,
    fileSize: Number,
    mimeType: String,
    duration: Number // for voice messages
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  editedAt: Date,
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read'],
    default: 'sent'
  },
  readBy: [{
    userId: String,
    readAt: { type: Date, default: Date.now }
  }],
  reactions: [{
    userId: String,
    emoji: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

const participantSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'expert'],
    required: true
  },
  alias: String,
  avatarUrl: String,
  avatarIndex: Number,
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  permissions: {
    canSendMessages: { type: Boolean, default: true },
    canSendFiles: { type: Boolean, default: true },
    canMakeVoiceCalls: { type: Boolean, default: true },
    canMakeVideoCalls: { type: Boolean, default: true }
  }
});

const chatSessionSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `session-${nanoid(8)}`,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['consultation', 'support', 'follow_up', 'emergency'],
    default: 'consultation'
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Participants
  participants: [participantSchema],
  expertId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  
  // Session Details
  topic: String,
  description: String,
  tags: [String],
  
  // Messages
  messages: [messageSchema],
  messageCount: {
    type: Number,
    default: 0
  },
  
  // Timing
  scheduledAt: Date,
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  duration: Number, // in minutes
  
  // Session Metadata
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isRecorded: {
    type: Boolean,
    default: false
  },
  recordingUrl: String,
  
  // Ratings & Feedback
  userRating: {
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
    submittedAt: Date
  },
  expertRating: {
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
    submittedAt: Date
  },
  
  // System Info
  clientInfo: {
    userAgent: String,
    ipAddress: String,
    platform: String
  },
  
  // Analytics
  analytics: {
    responseTime: {
      expertFirstResponse: Number, // in seconds
      averageResponseTime: Number
    },
    engagement: {
      totalMessages: Number,
      userMessages: Number,
      expertMessages: Number
    },
    sessionQuality: {
      connectionIssues: Number,
      technicalProblems: [String]
    }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
chatSessionSchema.index({ expertId: 1, createdAt: -1 });
chatSessionSchema.index({ userId: 1, createdAt: -1 });
chatSessionSchema.index({ status: 1, createdAt: -1 });
chatSessionSchema.index({ 'messages.timestamp': -1 });
chatSessionSchema.index({ scheduledAt: 1 });

// Pre-save middleware
chatSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.messageCount = this.messages.length;
  
  // Calculate duration if session is ended
  if (this.endedAt && this.startedAt) {
    this.duration = Math.floor((this.endedAt - this.startedAt) / (1000 * 60));
  }
  
  next();
});

// Instance methods
chatSessionSchema.methods.addMessage = function(messageData) {
  const message = {
    id: `msg-${nanoid(8)}`,
    ...messageData,
    timestamp: new Date()
  };
  
  this.messages.push(message);
  this.messageCount = this.messages.length;
  
  return this.save().then(() => message);
};

chatSessionSchema.methods.markMessageAsRead = function(messageId, userId) {
  const message = this.messages.id(messageId);
  if (message && !message.readBy.some(r => r.userId === userId)) {
    message.readBy.push({
      userId,
      readAt: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

chatSessionSchema.methods.updateParticipantStatus = function(userId, isOnline) {
  const participant = this.participants.find(p => p.userId === userId);
  if (participant) {
    participant.isOnline = isOnline;
    participant.lastSeen = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

chatSessionSchema.methods.endSession = function(endReason = 'completed') {
  this.status = endReason === 'cancelled' ? 'cancelled' : 'completed';
  this.endedAt = new Date();
  
  // Calculate final analytics
  const expertMessages = this.messages.filter(m => m.sender.role === 'expert').length;
  const userMessages = this.messages.filter(m => m.sender.role === 'user').length;
  
  this.analytics = {
    ...this.analytics,
    engagement: {
      totalMessages: this.messages.length,
      expertMessages,
      userMessages
    }
  };
  
  return this.save();
};

module.exports = mongoose.model('ChatSession', chatSessionSchema);
