const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const breakoutRoomSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `breakout-${nanoid(8)}`,
    unique: true,
    required: true
  },
  parentSessionId: {
    type: String,
    required: true,
    ref: 'LiveSanctuarySession'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    required: true
  },
  facilitatorId: {
    type: String,
    required: true
  },
  agoraChannelName: {
    type: String,
    required: true,
    unique: true
  },
  agoraToken: {
    type: String,
    required: true
  },
  maxParticipants: {
    type: Number,
    default: 8,
    min: 2,
    max: 20
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  participants: [{
    userId: String,
    alias: String,
    joinedAt: Date,
    leftAt: Date,
    role: {
      type: String,
      enum: ['facilitator', 'participant'],
      default: 'participant'
    }
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  autoClose: {
    type: Boolean,
    default: true
  },
  autoCloseAfterMinutes: {
    type: Number,
    default: 30
  },
  settings: {
    allowTextChat: {
      type: Boolean,
      default: true
    },
    allowVoiceChat: {
      type: Boolean,
      default: true
    },
    allowScreenShare: {
      type: Boolean,
      default: false
    },
    moderationEnabled: {
      type: Boolean,
      default: true
    },
    recordingEnabled: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

// TTL index for auto-cleanup
breakoutRoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for efficient queries
breakoutRoomSchema.index({ parentSessionId: 1, isActive: 1 });
breakoutRoomSchema.index({ facilitatorId: 1, isActive: 1 });

module.exports = mongoose.model('BreakoutRoom', breakoutRoomSchema);