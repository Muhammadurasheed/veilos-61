const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const sessionRatingSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `rating-${nanoid(8)}`,
    unique: true,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    ref: 'Session'
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
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  feedback: {
    type: String
  },
  categories: {
    professionalism: {
      type: Number,
      min: 1,
      max: 5
    },
    expertise: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    helpfulness: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SessionRating', sessionRatingSchema);