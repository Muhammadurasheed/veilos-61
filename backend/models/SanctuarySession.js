
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const sanctuarySessionSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `sanctuary-${nanoid(8)}`,
    unique: true,
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  emoji: {
    type: String
  },
  hostId: {
    type: String
  },
  hostToken: {
    type: String
  },
  hostIp: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  participants: [{
    id: String,
    alias: String,
    joinedAt: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  moderationFlags: {
    type: Number,
    default: 0
  }
});

// Add index on expiresAt to help with cleanup queries
sanctuarySessionSchema.index({ expiresAt: 1 });

// Auto-expire sessions (TTL index)
sanctuarySessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SanctuarySession', sanctuarySessionSchema);
