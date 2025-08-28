const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const sanctuaryMessageSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `msg-${nanoid(10)}`,
    unique: true,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    ref: 'LiveSanctuarySession'
  },
  senderShadowId: {
    type: String,
    required: true
  },
  senderAlias: {
    type: String,
    required: true
  },
  senderAvatarIndex: {
    type: Number,
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['text', 'emoji-reaction', 'system', 'emergency'],
    default: 'text'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  replyTo: {
    type: String, // Message ID this is replying to
    sparse: true
  },
  reactions: [{
    emoji: String,
    senderShadowId: String,
    senderAlias: String,
    timestamp: { type: Date, default: Date.now }
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    moderationFlags: [String],
    aiScore: Number,
    isHighlighted: { type: Boolean, default: false }
  }
});

// Indexes for efficient queries
sanctuaryMessageSchema.index({ sessionId: 1, timestamp: -1 });
sanctuaryMessageSchema.index({ senderShadowId: 1, timestamp: -1 });
sanctuaryMessageSchema.index({ type: 1, timestamp: -1 });

module.exports = mongoose.model('SanctuaryMessage', sanctuaryMessageSchema);