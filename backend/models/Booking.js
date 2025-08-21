
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const bookingSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `booking-${nanoid(8)}`,
    unique: true,
    required: true
  },
  
  // Core booking information
  expertId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  
  // Session details
  sessionType: {
    type: String,
    enum: ['chat', 'voice', 'video', 'in_person'],
    required: true
  },
  
  // Timing
  scheduledDateTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 15,
    max: 240
  },
  endDateTime: {
    type: Date
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  
  // Booking details
  topic: String,
  description: String,
  urgency: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Participant information
  userDetails: {
    name: String,
    alias: String,
    email: String,
    phoneNumber: String,
    preferences: {
      communicationMethod: String,
      specialRequests: String
    }
  },
  
  // Expert confirmation
  expertConfirmation: {
    confirmedAt: Date,
    confirmedBy: String,
    notes: String
  },
  
  // Payment information (if applicable)
  payment: {
    amount: Number,
    currency: { type: String, default: 'USD' },
    method: String,
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  
  // Session links and access
  sessionAccess: {
    chatSessionId: String,
    meetingLink: String,
    roomId: String,
    accessCode: String
  },
  
  // Reminders and notifications
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'in_app']
    },
    scheduledFor: Date,
    sentAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    }
  }],
  
  // Cancellation details
  cancellation: {
    cancelledAt: Date,
    cancelledBy: String, // userId or expertId
    reason: String,
    refundAmount: Number
  },
  
  // Follow-up information
  followUp: {
    required: { type: Boolean, default: false },
    scheduledFor: Date,
    notes: String,
    completed: { type: Boolean, default: false }
  },
  
  // Rating and feedback
  feedback: {
    userRating: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: String,
      submittedAt: Date
    },
    expertRating: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: String,
      submittedAt: Date
    }
  },
  
  // System metadata
  bookingSource: {
    type: String,
    enum: ['web', 'mobile', 'admin', 'api'],
    default: 'web'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
bookingSchema.index({ expertId: 1, scheduledDateTime: 1 });
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ status: 1, scheduledDateTime: 1 });
bookingSchema.index({ scheduledDateTime: 1 });

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate end date time
  if (this.scheduledDateTime && this.duration) {
    this.endDateTime = new Date(this.scheduledDateTime.getTime() + (this.duration * 60 * 1000));
  }
  
  next();
});

// Instance methods
bookingSchema.methods.confirmBooking = function(expertId, notes = '') {
  this.status = 'confirmed';
  this.expertConfirmation = {
    confirmedAt: new Date(),
    confirmedBy: expertId,
    notes
  };
  
  return this.save();
};

bookingSchema.methods.cancelBooking = function(cancelledBy, reason, refundAmount = 0) {
  this.status = 'cancelled';
  this.cancellation = {
    cancelledAt: new Date(),
    cancelledBy,
    reason,
    refundAmount
  };
  
  return this.save();
};

bookingSchema.methods.startSession = function(sessionId) {
  this.status = 'in_progress';
  this.sessionAccess.chatSessionId = sessionId;
  
  return this.save();
};

bookingSchema.methods.completeSession = function() {
  this.status = 'completed';
  
  return this.save();
};

bookingSchema.methods.addReminder = function(type, scheduledFor) {
  this.reminders.push({
    type,
    scheduledFor,
    status: 'pending'
  });
  
  return this.save();
};

// Static methods
bookingSchema.statics.findUpcomingBookings = function(expertId, hoursAhead = 24) {
  const now = new Date();
  const futureTime = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000));
  
  return this.find({
    expertId,
    scheduledDateTime: {
      $gte: now,
      $lte: futureTime
    },
    status: { $in: ['confirmed', 'pending'] }
  }).sort({ scheduledDateTime: 1 });
};

bookingSchema.statics.findConflictingBookings = function(expertId, startTime, endTime) {
  return this.find({
    expertId,
    status: { $in: ['confirmed', 'in_progress'] },
    $or: [
      {
        scheduledDateTime: { $lt: endTime },
        endDateTime: { $gt: startTime }
      }
    ]
  });
};

module.exports = mongoose.model('Booking', bookingSchema);
