
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
  registeredAt: {
    type: Date,
    default: Date.now
  },
  // Optional fields for authenticated users
  email: {
    type: String,
    sparse: true
  },
  password: {
    type: String
  },
  // For experts
  expertId: {
    type: String,
    sparse: true
  }
});

module.exports = mongoose.model('User', userSchema);
