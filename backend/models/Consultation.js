const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const consultationSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => nanoid(),
    unique: true,
    index: true
  },
  clientId: {
    type: String,
    required: true,
    index: true
  },
  expertId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['chat', 'voice', 'video', 'emergency'],
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    default: 30
  },
  pricing: {
    baseRate: {
      type: Number,
      required: true // per minute in cents
    },
    totalAmount: {
      type: Number,
      required: true // total in cents
    },
    currency: {
      type: String,
      default: 'usd'
    }
  },
  payment: {
    stripeSessionId: String,
    stripePaymentIntentId: String,
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date,
    refundedAt: Date
  },
  session: {
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed', 'cancelled', 'missed'],
      default: 'scheduled'
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    startedAt: Date,
    endedAt: Date,
    actualDuration: Number, // actual minutes spent
    roomId: String,
    recordingUrl: String
  },
  content: {
    topic: String,
    tags: [String],
    urgencyLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'emergency'],
      default: 'medium'
    },
    summary: String,
    actionItems: [String]
  },
  rating: {
    clientRating: {
      type: Number,
      min: 1,
      max: 5
    },
    clientFeedback: String,
    expertRating: {
      type: Number,
      min: 1,
      max: 5
    },
    expertFeedback: String
  },
  earnings: {
    expertEarnings: Number, // 85% of total amount
    platformFee: Number,    // 15% of total amount
    transferredAt: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
consultationSchema.index({ expertId: 1, createdAt: -1 });
consultationSchema.index({ clientId: 1, createdAt: -1 });
consultationSchema.index({ 'session.status': 1 });
consultationSchema.index({ 'payment.status': 1 });

// Calculate earnings before saving
consultationSchema.pre('save', function(next) {
  if (this.isModified('pricing.totalAmount')) {
    this.earnings.expertEarnings = Math.floor(this.pricing.totalAmount * 0.85);
    this.earnings.platformFee = this.pricing.totalAmount - this.earnings.expertEarnings;
  }
  next();
});

module.exports = mongoose.model('Consultation', consultationSchema);