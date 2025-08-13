const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const recommendationSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `rec-${nanoid(8)}`,
    unique: true,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['expert', 'post', 'resource', 'topic'],
    required: true
  },
  // For expert recommendations
  expertId: {
    type: String
  },
  // For post recommendations
  postId: {
    type: String
  },
  // For resource recommendations
  resourceTitle: {
    type: String
  },
  resourceUrl: {
    type: String
  },
  resourceDescription: {
    type: String
  },
  // For topic recommendations
  topicName: {
    type: String
  },
  // Common fields
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  relevanceScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  basedOn: {
    type: String, // What triggered this recommendation
    required: true
  },
  category: {
    type: String,
    enum: ['mood', 'topic', 'behavior', 'emergency', 'wellness'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  shown: {
    type: Boolean,
    default: false
  },
  clicked: {
    type: Boolean,
    default: false
  },
  dismissed: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
});

module.exports = mongoose.model('Recommendation', recommendationSchema);