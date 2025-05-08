
import { ApiResponse, ApiPostRequest, ApiExpertRegisterRequest, ApiChatSessionRequest, Post, Expert, ApiVerificationRequest, Session, VerificationDocument } from '@/types';
import axios from 'axios';

// Base API URL
const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('veilo-token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// Generic API request wrapper
async function apiRequest<T>(
  method: string,
  endpoint: string,
  data?: any,
  options?: any
): Promise<ApiResponse<T>> {
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
    console.error('API request failed:', error);
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

// File upload helper
async function uploadFile(
  endpoint: string,
  file: File,
  additionalData: Record<string, any> = {}
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
  register: () => 
    apiRequest<{ token: string, user: any }>('POST', '/users/register'),
  
  authenticate: (token: string) =>
    apiRequest<{ user: any }>('POST', '/users/authenticate', { token }),
  
  getCurrentUser: () =>
    apiRequest<{ user: any }>('GET', '/users/me'),
  
  refreshIdentity: () =>
    apiRequest<{ user: any }>('POST', '/users/refresh-identity'),
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

// Ratings related API endpoints
export const RatingApi = {
  rateExpert: (expertId: string, rating: number) =>
    apiRequest<{ rating: number }>('POST', '/ratings', { expertId, rating }),
    
  addTestimonial: (expertId: string, text: string) =>
    apiRequest<any>('POST', '/ratings/testimonial', { expertId, text }),
};
