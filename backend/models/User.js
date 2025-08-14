
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `user-${nanoid(8)}`,
    unique: true,
    required: true
  },
  alias: {
    type: String,
    required: true
  },
  avatarIndex: {
    type: Number,
    required: true
  },
  role: {
    type: String,
    enum: ['shadow', 'beacon', 'admin'],
    default: 'shadow'
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  avatarUrl: {
    type: String,
    sparse: true
  },
  // Optional fields for authenticated users
  email: {
    type: String,
    sparse: true
  },
  passwordHash: {
    type: String
  },
  refreshToken: {
    type: String
  },
  lastLoginAt: {
    type: Date
  },
  // For experts
  expertId: {
    type: String,
    sparse: true
  },
  // Expert fields
  name: {
    type: String,
    sparse: true
  },
  bio: {
    type: String,
    sparse: true
  },
  areasOfExpertise: {
    type: [String],
    default: []
  },
  isExpert: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('User', userSchema);
