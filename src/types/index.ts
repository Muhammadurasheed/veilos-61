
// User Types
export interface User {
  id: string;
  alias: string;
  avatarIndex: number;
  loggedIn: boolean;
  role?: UserRole;
}

// Expert Types
export interface Expert {
  id: string;
  name: string;
  avatarUrl: string;
  specialization: string;
  verificationLevel: 'blue' | 'gold' | 'platinum';
  bio: string;
  pricingModel: 'free' | 'donation' | 'fixed';
  pricingDetails?: string;
  rating: number;
  testimonials: Testimonial[];
  topicsHelped: string[];
  verificationDocuments?: VerificationDocument[];
  verified: boolean;
  email?: string;
  phoneNumber?: string;
  accountStatus: 'pending' | 'approved' | 'rejected';
}

export interface VerificationDocument {
  id: string;
  type: 'id' | 'credential' | 'certificate' | 'other';
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Testimonial {
  id: string;
  text: string;
  user: {
    alias: string;
    avatarIndex: number;
  };
}

// Post Types
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
  wantsExpertHelp?: boolean;
  languageCode?: string;
  flagged?: boolean;
  flagReason?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userAlias: string;
  userAvatarIndex: number;
  isExpert?: boolean;
  expertId?: string;
  content: string;
  timestamp: string;
  languageCode?: string;
}

// Form State Types
export interface PostFormData {
  content: string;
  feeling?: string;
  topic?: string;
  wantsExpertHelp?: boolean;
}

export interface ExpertRegistrationData {
  name: string;
  specialization: string;
  bio: string;
  email: string;
  phoneNumber?: string;
  pricingModel: 'free' | 'donation' | 'fixed';
  pricingDetails?: string;
}

// Role Types
export enum UserRole {
  SHADOW = 'shadow',  // Anonymous User
  BEACON = 'beacon',  // Expert
  ADMIN = 'admin'     // Administrator
}

// Session Types
export interface Session {
  id: string;
  expertId: string;
  userId: string;
  userAlias: string;
  scheduledTime?: string;
  status: 'requested' | 'scheduled' | 'completed' | 'canceled';
  sessionType: 'chat' | 'video' | 'voice';
  notes?: string;
  createdAt: string;
  meetingUrl?: string;
}

// API Contract Types (for future implementation)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiPostRequest {
  content: string;
  feeling?: string;
  topic?: string;
  wantsExpertHelp?: boolean;
}

export interface ApiExpertRegisterRequest {
  name: string;
  email: string;
  specialization: string;
  bio: string;
  pricingModel: 'free' | 'donation' | 'fixed';
  pricingDetails?: string;
  phoneNumber?: string;
}

export interface ApiChatSessionRequest {
  expertId: string;
  initialMessage: string;
  sessionType: 'chat' | 'video' | 'voice';
  scheduledTime?: string;
}

export interface ApiVerificationRequest {
  expertId: string;
  verificationLevel: 'blue' | 'gold' | 'platinum';
  status: 'approved' | 'rejected';
  feedback?: string;
}
