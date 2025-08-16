const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const liveSanctuarySessionSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `live-sanctuary-${nanoid(8)}`,
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
    default: 50,
    min: 2,
    max: 200
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  allowAnonymous: {
    type: Boolean,
    default: true
  },
  audioOnly: {
    type: Boolean,
    default: true
  },
  moderationEnabled: {
    type: Boolean,
    default: true
  },
  emergencyContactEnabled: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  scheduledAt: {
    type: Date
  },
  participants: [{
    id: String,
    alias: String,
    joinedAt: Date
  }]
});

// TTL index for auto-cleanup
liveSanctuarySessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('LiveSanctuarySession', liveSanctuarySessionSchema);