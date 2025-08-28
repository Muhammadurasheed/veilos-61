const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const sanctuaryInvitationSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `invite-${nanoid(12)}`,
    unique: true,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    ref: 'LiveSanctuarySession'
  },
  createdBy: {
    type: String,
    required: true // User shadow ID
  },
  inviteCode: {
    type: String,
    default: () => nanoid(8).toLowerCase(),
    unique: true,
    required: true
  },
  maxUses: {
    type: Number,
    default: null // null = unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    sessionTopic: String,
    hostAlias: String,
    createdAt: { type: Date, default: Date.now }
  },
  usageLog: [{
    shadowId: String,
    alias: String,
    joinedAt: { type: Date, default: Date.now },
    ipAddress: String
  }],
  restrictions: {
    requiresApproval: { type: Boolean, default: false },
    allowAnonymous: { type: Boolean, default: true },
    maxParticipantsViaInvite: { type: Number, default: null }
  }
});

// TTL index for auto-cleanup
sanctuaryInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient lookups
sanctuaryInvitationSchema.index({ inviteCode: 1, isActive: 1 });
sanctuaryInvitationSchema.index({ sessionId: 1, isActive: 1 });

module.exports = mongoose.model('SanctuaryInvitation', sanctuaryInvitationSchema);