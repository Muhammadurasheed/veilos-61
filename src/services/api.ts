import { ApiResponse, ApiPostRequest, ApiExpertRegisterRequest, ApiChatSessionRequest, Post, Expert, ApiVerificationRequest, Session, VerificationDocument, ApiSanctuaryCreateRequest, ApiSanctuaryJoinRequest, SanctuarySession } from '@/types';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';

// Base API URL - Updated to use the render.com backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://veilo-backend.onrender.com/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 10000,
});

// Add auth token to requests if available
api.interceptors.request.use(config => {
  // Skip adding token for public endpoints
  const publicEndpoints = [
    '/experts/register',
    '/users/register',
    '/users/auth/anonymous',
    '/users/register-expert-account',
    '/sanctuary'
  ];
  
  // Check if the current request path is in the publicEndpoints list
  const isPublicEndpoint = publicEndpoints.some(endpoint => 
    config.url && config.url.includes(endpoint)
  );
  
  // Only add token if it's not a public endpoint
  if (!isPublicEndpoint) {
    const token = localStorage.getItem('veilo-token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
  }
  
  return config;
});

// Add global error handler
api.interceptors.response.use(
  response => response,
  error => {
    // Extract error message
    const errorMessage = 
      error.response?.data?.error || 
      error.message || 
      'An unexpected error occurred';
    
    // Handle specific status codes
    if (error.response) {
      switch (error.response.status) {
        case 401:
          toast({
            title: "Authentication Error",
            description: "Please sign in again to continue.",
            variant: "destructive",
          });
          
          // Clear token if authentication failed
          localStorage.removeItem('veilo-token');
          break;
          
        case 403:
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this resource.",
            variant: "destructive",
          });
          break;
          
        case 404:
          toast({
            title: "Resource Not Found",
            description: "The requested resource could not be found.",
            variant: "destructive",
          });
          break;
          
        case 429:
          toast({
            title: "Too Many Requests",
            description: "Please slow down and try again later.",
            variant: "destructive",
          });
          break;
          
        case 500:
          toast({
            title: "Server Error",
            description: "Something went wrong on our end. Please try again later.",
            variant: "destructive",
          });
          break;
          
        default:
          // Only show toast for non-canceled requests
          if (!axios.isCancel(error)) {
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
            });
          }
      }
    } else if (error.request) {
      // Network error (no response received)
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please check your connection.",
        variant: "destructive",
      });
    }
    
    return Promise.reject(error);
  }
);

// Generic API request wrapper with retry capabilities
async function apiRequest<T>(
  method: string,
  endpoint: string,
  data?: any,
  options: any = {}
): Promise<ApiResponse<T>> {
  // Default retry options
  const retryOptions = {
    retries: options.retries || 1,
    retryDelay: options.retryDelay || 1000,
    retryableStatus: options.retryableStatus || [408, 429, 500, 502, 503, 504],
    ...options
  };
  
  let attempts = 0;
  let lastError: any;
  
  while (attempts <= retryOptions.retries) {
    try {
      const response = await api.request({
        method,
        url: endpoint,
        data,
        ...options
      });

      return {
        success: true,
        data: response.data.data as T,
      };
    } catch (error: any) {
      lastError = error;
      
      // Only retry if status is in retryable list
      const shouldRetry = 
        attempts < retryOptions.retries && 
        error.response && 
        retryOptions.retryableStatus.includes(error.response.status);
      
      if (!shouldRetry) break;
      
      // Exponential backoff
      const delay = retryOptions.retryDelay * Math.pow(2, attempts);
      console.log(`Request failed. Retrying in ${delay}ms... (${attempts + 1}/${retryOptions.retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempts++;
    }
  }
  
  console.error('API request failed after retries:', lastError);
  const errorMessage = 
    lastError.response?.data?.error || 
    lastError.message || 
    'An unexpected error occurred';
  
  return {
    success: false,
    error: errorMessage,
  };
}

// File upload helper with progress and retry
async function uploadFile(
  endpoint: string,
  file: File,
  additionalData: Record<string, any> = {},
  onProgress?: (percentage: number) => void
): Promise<ApiResponse<{ fileUrl: string }>> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional data to the form
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentage);
        }
      }
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error('File upload failed:', error);
    const errorMessage = 
      error.response?.data?.error || 
      error.message || 
      'An unexpected error occurred';
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// User related API endpoints
export const UserApi = {
  // Register standard user (shadow)
  register: () => 
    apiRequest<{ token: string, user: any }>('POST', '/users/register'),
  
  // Create anonymous user specifically for joining sessions
  createAnonymousUser: () =>
    apiRequest<{ token: string, user: any }>('POST', '/users/auth/anonymous'),
  
  // Register expert account (first step of expert registration)
  registerExpertAccount: (userData: Partial<ApiExpertRegisterRequest>) =>
    apiRequest<{ token: string, userId: string, user: any }>('POST', '/users/register-expert-account', userData),
  
  authenticate: (token: string) =>
    apiRequest<{ user: any }>('POST', '/users/authenticate', { token }),
  
  getCurrentUser: () =>
    apiRequest<{ user: any }>('GET', '/users/me'),
  
  refreshIdentity: () =>
    apiRequest<{ user: any }>('POST', '/users/refresh-identity'),
    
  updateAvatar: (avatarUrl: string) =>
    apiRequest<{ user: any }>('POST', '/users/avatar', { avatarUrl }),
};

// Post related API endpoints
export const PostApi = {
  getPosts: () => apiRequest<Post[]>('GET', '/posts'),
  
  createPost: (postData: ApiPostRequest) => 
    apiRequest<Post>('POST', '/posts', postData),
  
  likePost: (postId: string) =>
    apiRequest<{ likes: string[] }>('POST', `/posts/${postId}/like`),
  
  unlikePost: (postId: string) =>
    apiRequest<{ likes: string[] }>('POST', `/posts/${postId}/unlike`),
  
  addComment: (postId: string, content: string) =>
    apiRequest<Post>('POST', `/posts/${postId}/comment`, { content }),
    
  flagPost: (postId: string, reason: string) =>
    apiRequest<{ success: boolean }>('POST', `/posts/${postId}/flag`, { reason }),
    
  translatePost: (postId: string, targetLanguage: string) =>
    apiRequest<{ translatedContent: string }>('POST', `/posts/${postId}/translate`, { targetLanguage }),
};

// Expert related API endpoints
export const ExpertApi = {
  getExperts: () => apiRequest<Expert[]>('GET', '/experts'),
  
  registerExpert: (expertData: ApiExpertRegisterRequest) =>
    apiRequest<Expert>('POST', '/experts/register', expertData),
    
  uploadVerificationDocument: (expertId: string, file: File, documentType: string) =>
    uploadFile(`/experts/${expertId}/document`, file, { documentType }),
    
  getExpertDocuments: (expertId: string) =>
    apiRequest<VerificationDocument[]>('GET', `/experts/${expertId}/documents`),
  
  getExpertProfile: (expertId: string) =>
    apiRequest<Expert>('GET', `/experts/${expertId}`),
    
  updateExpertProfile: (expertId: string, profileData: Partial<Expert>) =>
    apiRequest<Expert>('PUT', `/experts/${expertId}`, profileData),
};

// Session related API endpoints
export const SessionApi = {
  createSession: (sessionData: ApiChatSessionRequest) =>
    apiRequest<Session>('POST', '/sessions', sessionData),
  
  getSessions: (userId: string) =>
    apiRequest<Session[]>('GET', `/sessions/user/${userId}`),
    
  getExpertSessions: (expertId: string) =>
    apiRequest<Session[]>('GET', `/sessions/expert/${expertId}`),
  
  getSessionDetails: (sessionId: string) =>
    apiRequest<Session>('GET', `/sessions/${sessionId}`),
    
  updateSessionStatus: (sessionId: string, status: Session['status']) =>
    apiRequest<Session>('POST', `/sessions/${sessionId}/status`, { status }),
    
  createVideoRoom: (sessionId: string) =>
    apiRequest<{ meetingUrl: string }>('POST', `/sessions/${sessionId}/video`),
};

// Admin related API endpoints
export const AdminApi = {
  verifyExpert: (expertId: string, verificationData: ApiVerificationRequest) =>
    apiRequest<{ success: boolean }>('PATCH', `/admin/experts/${expertId}/verify`, verificationData),
  
  getFlaggedContent: () =>
    apiRequest<{ posts: Post[] }>('GET', '/admin/flagged'),
  
  resolveFlag: (contentId: string, action: 'approve' | 'remove') =>
    apiRequest<{ success: boolean }>('POST', `/admin/flagged/${contentId}`, { action }),
    
  getPendingExperts: () =>
    apiRequest<Expert[]>('GET', '/admin/experts/unverified'),
    
  getAllExperts: () =>
    apiRequest<Expert[]>('GET', '/admin/experts'),
    
  adminLogin: (email: string, password: string) =>
    apiRequest<{ token: string }>('POST', '/admin/login', { email, password }),
};

// Sanctuary Session API
export const SanctuaryApi = {
  createSession: (sessionData: ApiSanctuaryCreateRequest) =>
    apiRequest<{id: string, topic: string, description: string, emoji: string, expiresAt: string, hostToken?: string}>(
      'POST', 
      '/sanctuary', 
      sessionData
    ),
    
  getSession: (sessionId: string) =>
    apiRequest<SanctuarySession>('GET', `/sanctuary/${sessionId}`),
    
  joinSession: (sessionId: string, joinData: ApiSanctuaryJoinRequest) =>
    apiRequest<{
      sessionId: string,
      participantId: string,
      participantAlias: string,
      topic: string,
      expiresAt: string
    }>('POST', `/sanctuary/${sessionId}/join`, joinData),
    
  endSession: (sessionId: string, hostToken?: string) =>
    apiRequest<{success: boolean}>('POST', `/sanctuary/${sessionId}/end`, { hostToken }),
    
  removeParticipant: (sessionId: string, participantId: string, hostToken?: string) =>
    apiRequest<{success: boolean}>('POST', `/sanctuary/${sessionId}/remove-participant`, { 
      hostToken, 
      participantId 
    }),
    
  flagSession: (sessionId: string, reason: string) =>
    apiRequest<{success: boolean}>('POST', `/sanctuary/${sessionId}/flag`, { reason }),
};

// Chat API for expert messaging
export const ChatApi = {
  sendMessage: (sessionId: string, content: string, messageType: 'text' | 'image' | 'voice' = 'text') =>
    apiRequest<{ message: any }>('POST', `/chat/${sessionId}/message`, { content, messageType }),
    
  getMessages: (sessionId: string, limit: number = 50, before?: string) =>
    apiRequest<{ messages: any[] }>('GET', `/chat/${sessionId}/messages`, { 
      params: { limit, before } 
    }),
    
  uploadMedia: (sessionId: string, file: File, mediaType: string, onProgress?: (percentage: number) => void) =>
    uploadFile(`/chat/${sessionId}/media`, file, { mediaType }, onProgress),
    
  createVoiceCall: (sessionId: string) =>
    apiRequest<{ callToken: string, roomId: string }>('POST', `/chat/${sessionId}/call/voice`),
    
  createVideoCall: (sessionId: string) =>
    apiRequest<{ callToken: string, roomId: string }>('POST', `/chat/${sessionId}/call/video`),
    
  scheduleMeeting: (expertId: string, date: Date, agenda: string) =>
    apiRequest<{ meetingId: string }>('POST', `/chat/schedule`, { 
      expertId, 
      date: date.toISOString(), 
      agenda 
    }),
};

// Gemini AI API for content moderation and improvement
export const GeminiApi = {
  moderateContent: (content: string) =>
    apiRequest<{ isAppropriate: boolean, feedback?: string }>('POST', '/gemini/moderate', { content }),
    
  improveContent: (content: string) =>
    apiRequest<{ improvedContent: string }>('POST', '/gemini/improve', { content }),
    
  moderateImage: (imageUrl: string) =>
    apiRequest<{ violation: boolean, reason?: string }>('POST', '/gemini/moderate-image', { imageUrl }),
    
  // New: Refine post using Gemini
  refinePost: (content: string) =>
    apiRequest<{ refinedText: string, violation?: boolean, reason?: string }>('POST', '/gemini/refine-post', { content }),
};
