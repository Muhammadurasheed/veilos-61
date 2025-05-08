
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const sessionSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `session-${nanoid(8)}`,
    unique: true,
    required: true
  },
  expertId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  userAlias: {
    type: String,
    required: true
  },
  scheduledTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['requested', 'scheduled', 'completed', 'canceled'],
    default: 'requested'
  },
  sessionType: {
    type: String,
    enum: ['chat', 'video', 'voice'],
    required: true
  },
  notes: {
    type: String
  },
  meetingUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Session', sessionSchema);
