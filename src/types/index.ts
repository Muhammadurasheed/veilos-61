
// User Types
export interface User {
  id: string;
  alias: string;
  avatarIndex: number;
  loggedIn: boolean;
}

// Expert Types
export interface Expert {
  id: string;
  name: string;
  avatarUrl: string;
  specialization: string;
  verificationLevel: 'blue' | 'gold' | 'platinum';
  bio: string;
  pricingModel: string;
  rating: number;
  testimonials: Testimonial[];
  topicsHelped: string[];
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
}

// Form State Types
export interface PostFormData {
  content: string;
  feeling?: string;
  topic?: string;
  wantsExpertHelp?: boolean;
}

// Role Types
export enum UserRole {
  SHADOW = 'shadow',  // Anonymous User
  BEACON = 'beacon',  // Expert
  ADMIN = 'admin'     // Administrator
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
  credentials: string;
}

export interface ApiChatSessionRequest {
  expertId: string;
  initialMessage: string;
}
