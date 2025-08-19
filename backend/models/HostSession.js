const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const hostSessionSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `host-session-${nanoid(12)}`,
    unique: true,
    required: true
  },
  sanctuaryId: {
    type: String,
    required: true,
    index: true
  },
  hostToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  hostId: {
    type: String, // For authenticated hosts
    index: true
  },
  hostIp: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  recoveryEmail: {
    type: String // Optional for anonymous hosts who want to recover sessions
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  }
});

// Update lastAccessedAt on each access
hostSessionSchema.methods.updateAccess = function() {
  this.lastAccessedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('HostSession', hostSessionSchema);