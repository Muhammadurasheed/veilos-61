const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const aiModerationLogSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `moderation-${nanoid(8)}`,
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
  participantId: {
    type: String,
    required: true
  },
  participantAlias: {
    type: String,
    required: true
  },
  moderationType: {
    type: String,
    enum: ['audio_content', 'emotional_state', 'behavioral_pattern', 'emergency_detection'],
    required: true
  },
  detectionMethod: {
    type: String,
    enum: ['real_time_transcription', 'audio_analysis', 'pattern_recognition', 'sentiment_analysis'],
    required: true
  },
  flaggedContent: {
    type: String, // The transcribed or flagged content
    required: true
  },
  detectionTimestamp: {
    type: Date,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  categories: [{
    type: String,
    enum: [
      'harassment', 'hate_speech', 'violence', 'self_harm', 
      'substance_abuse', 'bullying', 'inappropriate_content',
      'crisis_language', 'emotional_distress', 'trauma_trigger',
      'privacy_violation', 'spam', 'off_topic'
    ]
  }],
  actionTaken: {
    type: String,
    enum: ['none', 'warning', 'mute', 'temporary_removal', 'permanent_ban', 'escalation'],
    default: 'none'
  },
  actionTakenBy: {
    type: String,
    enum: ['ai_system', 'human_moderator', 'host'],
    default: 'ai_system'
  },
  escalated: {
    type: Boolean,
    default: false
  },
  escalatedTo: {
    type: String,
    enum: ['human_moderator', 'crisis_counselor', 'emergency_services', 'platform_admin']
  },
  escalationTimestamp: {
    type: Date
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolutionNotes: {
    type: String
  },
  resolvedBy: {
    type: String
  },
  resolvedAt: {
    type: Date
  },
  falsePositive: {
    type: Boolean,
    default: false
  },
  feedbackProvided: {
    type: Boolean,
    default: false
  },
  audienceImpact: {
    participantsAffected: Number,
    sessionDisrupted: Boolean,
    emotionalImpactScore: Number
  },
  contextualFactors: {
    speakingDuration: Number, // seconds
    emotionalTone: String,
    backgroundNoise: Boolean,
    speakingPace: String, // 'slow', 'normal', 'fast', 'rapid'
    previousViolations: Number
  },
  aiModelVersion: {
    type: String,
    required: true
  },
  rawAudioFeatures: {
    volumeLevel: Number,
    pitchVariation: Number,
    speechClarity: Number,
    emotionalMarkers: [String]
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

// Indexes for efficient queries and analytics
aiModerationLogSchema.index({ sessionId: 1, detectionTimestamp: 1 });
aiModerationLogSchema.index({ participantId: 1, riskLevel: 1 });
aiModerationLogSchema.index({ riskLevel: 1, resolved: 1 });
aiModerationLogSchema.index({ escalated: 1, escalationTimestamp: 1 });
aiModerationLogSchema.index({ categories: 1, confidence: 1 });
aiModerationLogSchema.index({ actionTaken: 1, actionTakenBy: 1 });

// Pre-save middleware
aiModerationLogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AIModerationLog', aiModerationLogSchema);