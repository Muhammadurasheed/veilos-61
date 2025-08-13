// Application constants
const CONSTANTS = {
  // User roles
  USER_ROLES: {
    SHADOW: 'shadow',
    BEACON: 'beacon', 
    ADMIN: 'admin'
  },

  // Expert status
  EXPERT_STATUS: {
    PENDING: 'pending',
    UNDER_REVIEW: 'under_review', 
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended'
  },

  // Session status
  SESSION_STATUS: {
    SCHEDULED: 'scheduled',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show'
  },

  // Post topics
  POST_TOPICS: [
    'anxiety',
    'depression', 
    'relationships',
    'work_stress',
    'family_issues',
    'self_esteem',
    'trauma',
    'addiction',
    'grief',
    'general'
  ],

  // Feelings/moods
  FEELINGS: [
    'overwhelmed',
    'anxious',
    'sad',
    'angry',
    'confused',
    'lonely',
    'hopeful',
    'grateful',
    'frustrated',
    'exhausted'
  ],

  // File upload limits
  FILE_LIMITS: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_COUNT: 5,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf']
  },

  // Rate limits
  RATE_LIMITS: {
    GENERAL: { windowMs: 15 * 60 * 1000, max: 100 },
    AUTH: { windowMs: 15 * 60 * 1000, max: 5 },
    POSTS: { windowMs: 60 * 1000, max: 10 },
    EXPERT_REGISTRATION: { windowMs: 60 * 60 * 1000, max: 3 }
  },

  // Sanctuary room types
  SANCTUARY_TYPES: {
    GENERAL: 'general',
    ANXIETY: 'anxiety',
    DEPRESSION: 'depression',
    TRAUMA: 'trauma',
    ADDICTION: 'addiction',
    GRIEF: 'grief'
  },

  // Sanctuary room status
  SANCTUARY_STATUS: {
    ACTIVE: 'active',
    ENDED: 'ended',
    PAUSED: 'paused'
  },

  // Content moderation
  MODERATION_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    FLAGGED: 'flagged',
    REMOVED: 'removed'
  },

  // Appeal status
  APPEAL_STATUS: {
    PENDING: 'pending',
    REVIEWED: 'reviewed',
    APPROVED: 'approved',
    DENIED: 'denied'
  },

  // Agora settings
  AGORA: {
    CHANNEL_PREFIX: 'veilo',
    TOKEN_EXPIRY: 3600, // 1 hour
    MAX_PARTICIPANTS: 50
  },

  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },

  // JWT
  JWT: {
    EXPIRES_IN: '7d',
    REFRESH_EXPIRES_IN: '30d'
  }
};

module.exports = CONSTANTS;