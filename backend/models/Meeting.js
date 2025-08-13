const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const meetingSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `meeting-${nanoid(8)}`,
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
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  timezone: {
    type: String,
    required: true
  },
  meetingType: {
    type: String,
    enum: ['video', 'voice', 'chat'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'started', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  agoraChannelName: {
    type: String
  },
  agoraToken: {
    type: String
  },
  recordingUrl: {
    type: String
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'notification'],
      required: true
    },
    sentAt: {
      type: Date
    },
    scheduled: {
      type: Date,
      required: true
    }
  }],
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  attendees: [{
    userId: {
      type: String,
      required: true
    },
    joinedAt: {
      type: Date
    },
    leftAt: {
      type: Date
    },
    duration: {
      type: Number // in minutes
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

meetingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Meeting', meetingSchema);