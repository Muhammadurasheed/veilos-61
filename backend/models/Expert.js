
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
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const documentSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `doc-${nanoid(8)}`,
    required: false,
    sparse: true
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
  },
  reviewedBy: {
    type: String
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String
  }
});

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  timeSlots: [{
    start: {
      type: String,
      required: true
    },
    end: {
      type: String,
      required: true
    },
    available: {
      type: Boolean,
      default: true
    }
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
  skills: [String],
  achievements: [String]
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
  },
  description: {
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
    default: 15,
    min: 15,
    max: 240
  },
  maxDuration: {
    type: Number,
    default: 60,
    min: 30,
    max: 240
  },
  breakBetweenSessions: {
    type: Number,
    default: 15,
    min: 0,
    max: 60
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
  // Basic Information
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
    type: String
  },
  
  // Location & Contact
  location: {
    city: String,
    state: String,
    country: String,
    timezone: { type: String, default: 'UTC' }
  },
  languages: [String],
  
  // Verification & Status
  verificationLevel: {
    type: String,
    enum: ['blue', 'gold', 'platinum', 'none'],
    default: 'none'
  },
  verified: {
    type: Boolean,
    default: false
  },
  accountStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  
  // Pricing & Business
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
  
  // Performance Metrics
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
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
  
  // Online Status
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  // Professional Information
  testimonials: [testimonialSchema],
  topicsHelped: [String],
  skills: [String],
  certifications: [String],
  workExperience: [workExperienceSchema],
  education: [educationSchema],
  
  // Phase 3: Availability (Critical for booking system)
  availability: [availabilitySchema],
  
  // Phase 4: Session Preferences (Critical for chat/booking)
  sessionPreferences: sessionPreferencesSchema,
  
  // Documents & Verification
  verificationDocuments: [documentSchema],
  
  // Admin Management
  adminNotes: [{
    id: String,
    note: String,
    category: String,
    date: { type: Date, default: Date.now },
    adminId: String,
    action: String
  }],
  
  // Analytics & Engagement
  profileViews: {
    type: Number,
    default: 0
  },
  profileViewsThisMonth: {
    type: Number,
    default: 0
  },
  followers: [{
    type: String
  }],
  followersCount: {
    type: Number,
    default: 0
  },
  
  // Social & Additional Info
  socialLinks: {
    linkedin: String,
    twitter: String,
    website: String,
    instagram: String
  },
  achievements: [String],
  yearsOfExperience: {
    type: Number,
    min: 0
  },
  
  // System Timestamps
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance - sparse indexes to handle null values
expertSchema.index({ userId: 1 });
expertSchema.index({ accountStatus: 1 });
expertSchema.index({ verificationLevel: 1 });
expertSchema.index({ specialization: 1 });
expertSchema.index({ 'location.city': 1, 'location.state': 1 });
expertSchema.index({ rating: -1 });
expertSchema.index({ createdAt: -1 });
expertSchema.index({ isOnline: 1, lastActive: -1 });
expertSchema.index({ 'verificationDocuments.id': 1 }, { sparse: true });

// Pre-save middleware
expertSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  
  // Calculate completion percentage
  let completionScore = 0;
  if (this.name) completionScore += 10;
  if (this.bio && this.bio.length > 50) completionScore += 15;
  if (this.workExperience && this.workExperience.length > 0) completionScore += 20;
  if (this.education && this.education.length > 0) completionScore += 15;
  if (this.availability && this.availability.length > 0) completionScore += 15;
  if (this.sessionPreferences) completionScore += 10;
  if (this.verificationDocuments && this.verificationDocuments.length > 0) completionScore += 15;
  
  this.profileCompletion = Math.min(completionScore, 100);
  
  next();
});

// Instance methods
expertSchema.methods.updateRating = function(newRating) {
  const totalScore = (this.rating * this.totalRatings) + newRating;
  this.totalRatings += 1;
  this.rating = totalScore / this.totalRatings;
  return this.save();
};

expertSchema.methods.incrementProfileViews = function() {
  this.profileViews += 1;
  this.profileViewsThisMonth += 1;
  return this.save();
};

expertSchema.methods.isAvailable = function(dayOfWeek, timeSlot) {
  const dayAvailability = this.availability.find(avail => avail.day === dayOfWeek);
  if (!dayAvailability) return false;
  
  return dayAvailability.timeSlots.some(slot => 
    slot.available && 
    timeSlot >= slot.start && 
    timeSlot <= slot.end
  );
};

module.exports = mongoose.model('Expert', expertSchema);
