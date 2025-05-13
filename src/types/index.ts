
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
  specialization: string;
  bio: string;
  verificationLevel: "blue" | "gold" | "platinum" | "none";
  verified: boolean;
  pricingModel: "free" | "donation" | "fixed";
  pricingDetails?: string;
  phoneNumber?: string;
  rating: number;
  testimonials: Testimonial[];
  topicsHelped: string[];
  accountStatus: "pending" | "approved" | "rejected";
  verificationDocuments?: VerificationDocument[];
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
  type: "id" | "credential" | "certificate" | "other";
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

// Sanctuary Session types (new)
export interface SanctuarySession {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  expiresAt: string;
  participantCount: number;
  isActive: boolean;
}

export interface SanctuaryParticipant {
  id: string;
  alias: string;
  joinedAt: string;
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

// Sanctuary API request types (new)
export interface ApiSanctuaryCreateRequest {
  topic: string;
  description?: string;
  emoji?: string;
  expireHours?: number;
}

export interface ApiSanctuaryJoinRequest {
  alias?: string;
}

// API response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
