const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const sessionMetricSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `metric-${nanoid(8)}`,
    unique: true,
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  expertId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  responseTime: {
    type: Number, // average response time in seconds
    required: true
  },
  messageCount: {
    type: Number,
    default: 0
  },
  satisfactionScore: {
    type: Number,
    min: 1,
    max: 5
  },
  completed: {
    type: Boolean,
    default: false
  },
  revenue: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const expertAnalyticsSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `analytics-${nanoid(8)}`,
    unique: true,
    required: true
  },
  expertId: {
    type: String,
    required: true,
    unique: true
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  completedSessions: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  averageResponseTime: {
    type: Number,
    default: 0
  },
  totalHours: {
    type: Number,
    default: 0
  },
  monthlyStats: [{
    month: String,
    year: Number,
    sessions: Number,
    revenue: Number,
    rating: Number
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const platformHealthSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `health-${nanoid(8)}`,
    unique: true,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  activeUsers: {
    type: Number,
    default: 0
  },
  activeSessions: {
    type: Number,
    default: 0
  },
  flaggedContent: {
    type: Number,
    default: 0
  },
  moderatedContent: {
    type: Number,
    default: 0
  },
  serverLoad: {
    type: Number,
    default: 0
  },
  responseTime: {
    type: Number,
    default: 0
  },
  errorRate: {
    type: Number,
    default: 0
  }
});

const SessionMetric = mongoose.model('SessionMetric', sessionMetricSchema);
const ExpertAnalytics = mongoose.model('ExpertAnalytics', expertAnalyticsSchema);
const PlatformHealth = mongoose.model('PlatformHealth', platformHealthSchema);

module.exports = {
  SessionMetric,
  ExpertAnalytics,
  PlatformHealth
};