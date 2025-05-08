
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const testimonialSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `test-${nanoid(8)}`,
    unique: true
  },
  text: {
    type: String,
    required: true
  },
  user: {
    alias: {
      type: String,
      required: true
    },
    avatarIndex: {
      type: Number,
      required: true
    }
  }
});

const documentSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `doc-${nanoid(8)}`,
    unique: true
  },
  type: {
    type: String,
    enum: ['id', 'credential', 'certificate', 'other'],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
});

const expertSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `expert-${nanoid(8)}`,
    unique: true,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  avatarUrl: {
    type: String,
    default: '/experts/default.jpg'
  },
  specialization: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  verificationLevel: {
    type: String,
    enum: ['blue', 'gold', 'platinum', 'none'],
    default: 'none'
  },
  verified: {
    type: Boolean,
    default: false
  },
  pricingModel: {
    type: String,
    enum: ['free', 'donation', 'fixed'],
    required: true
  },
  pricingDetails: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  rating: {
    type: Number,
    default: 0
  },
  testimonials: [testimonialSchema],
  topicsHelped: [String],
  verificationDocuments: [documentSchema],
  accountStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Expert', expertSchema);
