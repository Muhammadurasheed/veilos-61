const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const contentAppealSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `appeal-${nanoid(8)}`,
    unique: true,
    required: true
  },
  postId: {
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
  originalContent: {
    type: String,
    required: true
  },
  flagReason: {
    type: String,
    required: true
  },
  appealReason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  reviewedBy: {
    type: String
  },
  reviewDate: {
    type: Date
  },
  reviewNotes: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  languageCode: {
    type: String,
    default: 'en'
  }
});

module.exports = mongoose.model('ContentAppeal', contentAppealSchema);