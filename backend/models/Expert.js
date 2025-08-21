
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const testimonialSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `test-${nanoid(8)}`
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
    default: () => `doc-${nanoid(8)}`
  },
  type: {
    type: String,
    enum: ['id', 'credential', 'certificate', 'other', 'photo', 'resume', 'cv'],
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

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  timeSlots: [{
    start: String, // Format: "09:00"
    end: String,   // Format: "17:00"
    available: { type: Boolean, default: true }
  }]
});

const workExperienceSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `exp-${nanoid(8)}`
  },
  jobTitle: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  description: {
    type: String
  },
  skills: [String]
});

const educationSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `edu-${nanoid(8)}`
  },
  institution: {
    type: String,
    required: true
  },
  degree: {
    type: String,
    required: true
  },
  fieldOfStudy: {
    type: String
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  grade: {
    type: String
  }
});

const sessionPreferencesSchema = new mongoose.Schema({
  voiceMasking: {
    type: Boolean,
    default: false
  },
  allowRecording: {
    type: Boolean,
    default: false
  },
  sessionTypes: {
    chat: { type: Boolean, default: true },
    voice: { type: Boolean, default: true },
    video: { type: Boolean, default: true }
  },
  minDuration: {
    type: Number,
    default: 15 // minutes
  },
  maxDuration: {
    type: Number,
    default: 60 // minutes
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
  phoneNumber: {
    type: String
  },
  specialization: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  headline: {
    type: String // Professional headline like "Senior Mental Health Counselor"
  },
  location: {
    city: String,
    state: String,
    country: String
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  languages: [String],
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
  hourlyRate: {
    type: Number,
    min: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  completedSessions: {
    type: Number,
    default: 0
  },
  responseTime: {
    type: String,
    default: 'Usually responds within 1 hour'
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  testimonials: [testimonialSchema],
  topicsHelped: [String],
  skills: [String],
  certifications: [String],
  workExperience: [workExperienceSchema],
  education: [educationSchema],
  availability: [availabilitySchema],
  sessionPreferences: sessionPreferencesSchema,
  verificationDocuments: [documentSchema],
  accountStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  adminNotes: [{
    id: String,
    note: String,
    category: String,
    date: { type: Date, default: Date.now },
    adminId: String,
    action: String
  }],
  profileViews: {
    type: Number,
    default: 0
  },
  profileViewsThisMonth: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  followers: [{
    type: String // User IDs who follow this expert
  }],
  followersCount: {
    type: Number,
    default: 0
  },
  socialLinks: {
    linkedin: String,
    twitter: String,
    website: String
  },
  achievements: [String],
  yearsOfExperience: {
    type: Number,
    min: 0
  }
});

module.exports = mongoose.model('Expert', expertSchema);
