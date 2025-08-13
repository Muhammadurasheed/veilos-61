const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const sessionRecordingSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `recording-${nanoid(8)}`,
    unique: true,
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  sessionType: {
    type: String,
    enum: ['sanctuary', 'breakout', 'private'],
    required: true
  },
  recordingType: {
    type: String,
    enum: ['audio_only', 'audio_with_transcript', 'full_session'],
    default: 'audio_only'
  },
  initiatedBy: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in seconds
  },
  fileUrl: {
    type: String
  },
  transcriptUrl: {
    type: String
  },
  processingStatus: {
    type: String,
    enum: ['recording', 'processing', 'completed', 'failed', 'deleted'],
    default: 'recording'
  },
  retentionPolicy: {
    type: String,
    enum: ['delete_after_session', 'keep_24h', 'keep_7d', 'keep_30d', 'keep_forever'],
    default: 'delete_after_session'
  },
  participantConsent: [{
    userId: String,
    alias: String,
    consentGiven: Boolean,
    consentAt: Date
  }],
  encryptionKey: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number // in bytes
  },
  metadata: {
    participantCount: Number,
    averageAudioLevel: Number,
    silencePercentage: Number,
    languageDetected: String,
    emotionalTone: {
      positive: Number,
      negative: Number,
      neutral: Number
    },
    flaggedContent: [{
      timestamp: Date,
      reason: String,
      confidence: Number,
      resolved: Boolean
    }]
  },
  accessPermissions: {
    hostAccess: {
      type: Boolean,
      default: true
    },
    participantAccess: {
      type: Boolean,
      default: false
    },
    moderatorAccess: {
      type: Boolean,
      default: true
    },
    downloadAllowed: {
      type: Boolean,
      default: false
    }
  },
  autoDeleteAt: {
    type: Date
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

// TTL index for auto-deletion based on retention policy
sessionRecordingSchema.index({ autoDeleteAt: 1 }, { expireAfterSeconds: 0 });

// Indexes for efficient queries
sessionRecordingSchema.index({ sessionId: 1, sessionType: 1 });
sessionRecordingSchema.index({ initiatedBy: 1, processingStatus: 1 });
sessionRecordingSchema.index({ retentionPolicy: 1, createdAt: 1 });

// Pre-save middleware to update timestamps and auto-delete
sessionRecordingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set auto-delete date based on retention policy
  if (!this.autoDeleteAt && this.retentionPolicy !== 'keep_forever') {
    const now = new Date();
    switch (this.retentionPolicy) {
      case 'delete_after_session':
        this.autoDeleteAt = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour
        break;
      case 'keep_24h':
        this.autoDeleteAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        break;
      case 'keep_7d':
        this.autoDeleteAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        break;
      case 'keep_30d':
        this.autoDeleteAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        break;
    }
  }
  
  next();
});

module.exports = mongoose.model('SessionRecording', sessionRecordingSchema);