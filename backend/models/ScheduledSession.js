const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const scheduledSessionSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `scheduled-${nanoid(8)}`,
    unique: true,
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  emoji: {
    type: String,
    default: '🎙️'
  },
  hostId: {
    type: String,
    required: true,
    index: true
  },
  hostAlias: {
    type: String,
    required: true
  },
  
  // Scheduling details
  scheduledDateTime: {
    type: Date,
    required: true,
    index: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 15,
    max: 480 // 8 hours max
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Session configuration
  maxParticipants: {
    type: Number,
    default: 50,
    min: 2,
    max: 200
  },
  allowAnonymous: {
    type: Boolean,
    default: true
  },
  audioOnly: {
    type: Boolean,
    default: true
  },
  moderationEnabled: {
    type: Boolean,
    default: true
  },
  emergencyContactEnabled: {
    type: Boolean,
    default: true
  },
  recordingEnabled: {
    type: Boolean,
    default: false
  },
  requireApproval: {
    type: Boolean,
    default: false
  },
  
  // Access control
  accessType: {
    type: String,
    enum: ['public', 'invite_only', 'link_only'],
    default: 'public'
  },
  invitationCode: {
    type: String,
    default: () => nanoid(6).toUpperCase()
  },
  invitationLink: {
    type: String,
    unique: true
  },
  
  // Participant management
  preRegisteredParticipants: [{
    id: String,
    alias: String,
    email: String,
    registeredAt: { type: Date, default: Date.now },
    approved: { type: Boolean, default: true },
    reminded: { type: Boolean, default: false }
  }],
  
  waitingList: [{
    id: String,
    alias: String,
    requestedAt: { type: Date, default: Date.now },
    message: String
  }],
  
  // Session lifecycle
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  
  // Live session reference
  liveSessionId: {
    type: String,
    index: true
  },
  
  // Agora configuration
  agoraChannelName: {
    type: String,
    unique: true
  },
  agoraToken: {
    type: String
  },
  
  // Notifications
  remindersSent: [{
    type: {
      type: String,
      enum: ['1_day', '1_hour', '15_min']
    },
    sentAt: Date,
    recipientCount: Number
  }],
  
  // Tags and categorization
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['support', 'wellness', 'discussion', 'education', 'social', 'crisis', 'other'],
    default: 'support'
  },
  language: {
    type: String,
    default: 'en'
  },
  
  // Creation and modification tracking
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Completion tracking
  actualStartTime: Date,
  actualEndTime: Date,
  actualDuration: Number, // in minutes
  participantCount: {
    type: Number,
    default: 0
  },
  
  // Session metrics
  metrics: {
    totalJoins: { type: Number, default: 0 },
    peakParticipants: { type: Number, default: 0 },
    averageStayDuration: { type: Number, default: 0 }, // in minutes
    messagesCount: { type: Number, default: 0 },
    reactionsCount: { type: Number, default: 0 },
    emergencyAlerts: { type: Number, default: 0 }
  },
  
  // Feedback and ratings
  feedback: [{
    participantId: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: { type: Date, default: Date.now }
  }],
  
  // Recording information
  recordings: [{
    id: String,
    startTime: Date,
    endTime: Date,
    fileUrl: String,
    transcriptUrl: String,
    size: Number, // in bytes
    duration: Number, // in seconds
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    }
  }]
});

// Compound indexes for efficient queries
scheduledSessionSchema.index({ hostId: 1, scheduledDateTime: 1 });
scheduledSessionSchema.index({ status: 1, scheduledDateTime: 1 });
scheduledSessionSchema.index({ scheduledDateTime: 1, status: 1 });
scheduledSessionSchema.index({ category: 1, scheduledDateTime: 1 });
scheduledSessionSchema.index({ tags: 1, scheduledDateTime: 1 });

// Generate invitation link before saving
scheduledSessionSchema.pre('save', function(next) {
  if (!this.invitationLink) {
    this.invitationLink = `${process.env.API_BASE_URL}/sanctuary/join/${this.invitationCode}`;
  }
  this.updatedAt = new Date();
  next();
});

// Virtual for computed fields
scheduledSessionSchema.virtual('isUpcoming').get(function() {
  return this.scheduledDateTime > new Date() && this.status === 'scheduled';
});

scheduledSessionSchema.virtual('isLive').get(function() {
  return this.status === 'live';
});

scheduledSessionSchema.virtual('timeUntilStart').get(function() {
  if (this.scheduledDateTime <= new Date()) return 0;
  return Math.ceil((this.scheduledDateTime - new Date()) / (1000 * 60)); // minutes
});

scheduledSessionSchema.virtual('estimatedEndTime').get(function() {
  return new Date(this.scheduledDateTime.getTime() + (this.duration * 60 * 1000));
});

// Instance methods
scheduledSessionSchema.methods.addParticipant = function(participant) {
  const existing = this.preRegisteredParticipants.find(p => p.id === participant.id);
  if (!existing) {
    this.preRegisteredParticipants.push(participant);
    return this.save();
  }
  return Promise.resolve(this);
};

scheduledSessionSchema.methods.removeParticipant = function(participantId) {
  this.preRegisteredParticipants = this.preRegisteredParticipants.filter(p => p.id !== participantId);
  return this.save();
};

scheduledSessionSchema.methods.addToWaitingList = function(participant) {
  const existing = this.waitingList.find(p => p.id === participant.id);
  if (!existing) {
    this.waitingList.push(participant);
    return this.save();
  }
  return Promise.resolve(this);
};

scheduledSessionSchema.methods.approveFromWaitingList = function(participantId) {
  const participant = this.waitingList.find(p => p.id === participantId);
  if (participant) {
    this.waitingList = this.waitingList.filter(p => p.id !== participantId);
    this.preRegisteredParticipants.push({
      id: participant.id,
      alias: participant.alias,
      registeredAt: new Date(),
      approved: true
    });
    return this.save();
  }
  return Promise.resolve(this);
};

scheduledSessionSchema.methods.markReminderSent = function(type) {
  this.remindersSent.push({
    type,
    sentAt: new Date(),
    recipientCount: this.preRegisteredParticipants.length
  });
  return this.save();
};

scheduledSessionSchema.methods.startLiveSession = function(liveSessionId) {
  this.status = 'live';
  this.liveSessionId = liveSessionId;
  this.actualStartTime = new Date();
  return this.save();
};

scheduledSessionSchema.methods.completeSession = function(metrics = {}) {
  this.status = 'completed';
  this.actualEndTime = new Date();
  if (this.actualStartTime) {
    this.actualDuration = Math.ceil((this.actualEndTime - this.actualStartTime) / (1000 * 60));
  }
  Object.assign(this.metrics, metrics);
  return this.save();
};

// Static methods
scheduledSessionSchema.statics.findUpcoming = function(limit = 10) {
  return this.find({
    scheduledDateTime: { $gt: new Date() },
    status: 'scheduled'
  })
  .sort({ scheduledDateTime: 1 })
  .limit(limit);
};

scheduledSessionSchema.statics.findByHost = function(hostId, includeCompleted = false) {
  const query = { hostId };
  if (!includeCompleted) {
    query.status = { $ne: 'completed' };
  }
  
  return this.find(query)
    .sort({ scheduledDateTime: -1 });
};

scheduledSessionSchema.statics.findByInvitationCode = function(code) {
  return this.findOne({ invitationCode: code.toUpperCase() });
};

scheduledSessionSchema.statics.findNeedingReminders = function(reminderType) {
  const now = new Date();
  let timeThreshold;
  
  switch (reminderType) {
    case '1_day':
      timeThreshold = new Date(now.getTime() + (24 * 60 * 60 * 1000));
      break;
    case '1_hour':
      timeThreshold = new Date(now.getTime() + (60 * 60 * 1000));
      break;
    case '15_min':
      timeThreshold = new Date(now.getTime() + (15 * 60 * 1000));
      break;
    default:
      return [];
  }
  
  return this.find({
    scheduledDateTime: { $lte: timeThreshold, $gt: now },
    status: 'scheduled',
    'remindersSent.type': { $ne: reminderType }
  });
};

module.exports = mongoose.model('ScheduledSession', scheduledSessionSchema);