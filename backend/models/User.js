
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `user-${nanoid(8)}`,
    unique: true,
    required: true
  },
  
  // Real identity (persistent, private)
  email: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  realName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Shadow identity (public, anonymous platform presence)
  shadowId: {
    type: String,
    default: () => `shadow-${nanoid(10)}`,
    unique: true,
    required: true
  },
  alias: {
    type: String,
    required: true
  },
  avatarIndex: {
    type: Number,
    required: true,
    default: () => Math.floor(Math.random() * 12) + 1
  },
  avatarUrl: {
    type: String,
    sparse: true
  },
  
  // Account metadata
  role: {
    type: String,
    enum: ['shadow', 'beacon', 'admin'],
    default: 'shadow'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    sparse: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  },
  
  // Token management
  refreshToken: {
    type: String
  },
  
  // Expert fields
  isExpert: {
    type: Boolean,
    default: false
  },
  expertId: {
    type: String,
    sparse: true
  },
  bio: {
    type: String,
    sparse: true
  },
  areasOfExpertise: {
    type: [String],
    default: []
  },
  
  // Platform activities (tracked for dashboard)
  activities: {
    sanctuariesCreated: { type: Number, default: 0 },
    sanctuariesJoined: { type: Number, default: 0 },
    sessionsBooked: { type: Number, default: 0 },
    expertsFollowed: { type: Number, default: 0 },
    postsCreated: { type: Number, default: 0 }
  },
  
  // Relationships (using shadow IDs for anonymity)
  followedExperts: [{
    type: String // Expert shadow IDs that this user follows
  }],
  
  // Preferences
  preferences: {
    notifications: { type: Boolean, default: true },
    emailUpdates: { type: Boolean, default: false },
    dataPrivacy: { type: String, enum: ['minimal', 'standard', 'enhanced'], default: 'standard' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' }
  },
  
  // Security
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, sparse: true },
  loginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, sparse: true },
  
  // Privacy settings
  shadowIdentityRegenerationCount: { type: Number, default: 0 },
  lastShadowRegeneration: { type: Date }
});

module.exports = mongoose.model('User', userSchema);
