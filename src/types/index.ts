
// User-related types
export enum UserRole {
  SHADOW = "shadow",
  BEACON = "beacon",
  ADMIN = "admin"
}

export interface User {
  id: string;
  alias: string;
  avatarIndex: number;
  loggedIn: boolean;
  role?: UserRole;
  expertId?: string;
  isAnonymous?: boolean;
  avatarUrl?: string;
}

// Post-related types
export interface Post {
  id: string;
  userId: string;
  userAlias: string;
  userAvatarIndex: number;
  content: string;
  feeling?: string;
  topic?: string;
  timestamp: string;
  likes: string[];
  comments: Comment[];
  wantsExpertHelp: boolean;
  languageCode: string;
  flagged?: boolean;
  flagReason?: string;
  status?: 'active' | 'flagged' | 'hidden';
}

export interface Comment {
  id: string;
  userId: string;
  userAlias: string;
  userAvatarIndex: number;
  isExpert: boolean;
  expertId?: string;
  content: string;
  timestamp: string;
  languageCode: string;
}

// Expert-related types
export interface Expert {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phoneNumber?: string;
  specialization: string;
  bio: string;
  headline?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  timezone?: string;
  languages?: string[];
  verificationLevel: 'blue' | 'gold' | 'platinum' | 'none';
  verified: boolean;
  pricingModel: 'free' | 'donation' | 'fixed';
  pricingDetails?: string;
  hourlyRate?: number;
  rating: number;
  totalRatings: number;
  totalSessions: number;
  completedSessions: number;
  responseTime?: string;
  isOnline?: boolean;
  lastActive?: string;
  testimonials?: Array<{
    id: string;
    text: string;
    user: {
      alias: string;
      avatarIndex: number;
    };
  }>;
  topicsHelped?: string[];
  skills?: string[];
  certifications?: string[];
  workExperience?: Array<{
    id: string;
    jobTitle: string;
    company: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    description?: string;
    skills?: string[];
  }>;
  education?: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    grade?: string;
  }>;
  availability?: Array<{
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    timeSlots: Array<{
      start: string;
      end: string;
      available: boolean;
    }>;
  }>;
  sessionPreferences?: {
    voiceMasking: boolean;
    allowRecording: boolean;
    sessionTypes: {
      chat: boolean;
      voice: boolean;
      video: boolean;
    };
    minDuration: number;
    maxDuration: number;
  };
  verificationDocuments?: Array<{
    id: string;
    type: 'id' | 'credential' | 'certificate' | 'other' | 'photo' | 'resume' | 'cv';
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
  accountStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  adminNotes?: Array<{
    id: string;
    note: string;
    category: string;
    date: string;
    adminId: string;
    action: string;
  }>;
  profileViews: number;
  profileViewsThisMonth: number;
  lastUpdated: string;
  createdAt: string;
  followers?: string[];
  followersCount: number;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  achievements?: string[];
  yearsOfExperience?: number;
  // Enhanced resume-based fields
  resumeData?: {
    personalInfo?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    education?: Array<{
      degree?: string;
      institution?: string;
      field?: string;
      year?: string;
      raw?: string;
    }>;
    experience?: Array<{
      position?: string;
      company?: string;
      duration?: string;
      responsibilities?: string[];
      raw?: string;
    }>;
    skills?: {
      technical?: string[];
      clinical?: string[];
      soft?: string[];
      other?: string[];
    };
    certifications?: Array<{
      name?: string;
      type?: string;
      year?: string;
      mentioned?: boolean;
    }>;
    summary?: string;
    specializations?: Array<{
      name?: string;
      confidence?: number;
      matchedKeywords?: string[];
    }>;
    yearsOfExperience?: number;
    keyHighlights?: string[];
    lastParsed?: string | Date;
  };
  profileEnhancements?: {
    professionalSummary?: string;
    timeline?: Array<{
      year?: string;
      title?: string;
      description?: string;
      type?: 'education' | 'experience' | 'certification' | 'achievement';
    }>;
    expertise?: Array<{
      category?: string;
      skills?: string[];
      level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    }>;
    achievements?: string[];
    specialtyTags?: string[];
  };
}

export interface AdminNote {
  id: string;
  note: string;
  category: string;
  date: string | Date;
  adminId: string;
  action: string;
}

export interface Testimonial {
  id: string;
  text: string;
  user: {
    alias: string;
    avatarIndex: number;
  };
}

export interface VerificationDocument {
  id: string;
  type: "id" | "credential" | "certificate" | "other" | "resume" | "cv" | "photo";
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
  status: "pending" | "approved" | "rejected";
}

// Session-related types
export interface Session {
  id: string;
  expertId: string;
  userId: string;
  userAlias: string;
  scheduledTime?: string;
  status: "requested" | "scheduled" | "completed" | "canceled";
  sessionType: "chat" | "video" | "voice";
  notes?: string;
  meetingUrl?: string;
  createdAt: string;
}

// Sanctuary Session types
export interface SanctuarySession {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  expiresAt: string;
  participantCount: number;
  isActive: boolean;
  allowAnonymous?: boolean;
  hostId?: string;
}

export interface SanctuaryParticipant {
  id: string;
  alias: string;
  joinedAt: string;
  isAnonymous?: boolean;
  isHost?: boolean;
}

export interface SanctuaryMessage {
  id: string;
  participantId: string;
  participantAlias: string;
  content: string;
  timestamp: string;
  type: "text" | "system" | "emoji-reaction";
}

// API request types
export interface ApiPostRequest {
  content: string;
  feeling?: string;
  topic?: string;
  wantsExpertHelp?: boolean;
  languageCode?: string;
}

export interface ApiCommentRequest {
  content: string;
  languageCode?: string;
}

export interface ApiExpertRegisterRequest {
  name: string;
  email: string;
  specialization: string;
  bio: string;
  pricingModel: "free" | "donation" | "fixed";
  pricingDetails?: string;
  phoneNumber?: string;
}

export interface ApiChatSessionRequest {
  expertId: string;
  initialMessage?: string;
  sessionType: "chat" | "video" | "voice";
  scheduledTime?: string;
}

export interface ApiVerificationRequest {
  verificationLevel: "blue" | "gold" | "platinum" | "none";
  status: "approved" | "rejected";
  feedback?: string;
}

// Sanctuary API request types
export interface ApiSanctuaryCreateRequest {
  topic: string;
  description?: string;
  emoji?: string;
  expireHours?: number;
  allowAnonymous?: boolean;
}

export interface ApiSanctuaryJoinRequest {
  alias?: string;
  isAnonymous?: boolean;
}

// API response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Gemini API request types
export interface ApiGeminiModerateRequest {
  content: string;
}

export interface ApiGeminiImproveRequest {
  content: string;
}

export interface ApiGeminiModerateImageRequest {
  imageUrl: string;
}

