
import { ApiResponse, ApiPostRequest, ApiExpertRegisterRequest, ApiChatSessionRequest, Post, Expert, ApiVerificationRequest, Session, VerificationDocument } from '@/types';

// Base API URL (would be configured based on environment)
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.veilo.app/api'
  : '/api';

// Generic fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'An unexpected error occurred',
      };
    }

    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
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
    const url = `${API_BASE_URL}${endpoint}`;
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional data to the form
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'An unexpected error occurred',
      };
    }

    return {
      success: true,
      data: data as { fileUrl: string },
    };
  } catch (error) {
    console.error('File upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

// Post related API endpoints
export const PostApi = {
  getPosts: () => fetchApi<Post[]>('/post'),
  
  createPost: (postData: ApiPostRequest) => 
    fetchApi<Post>('/post', {
      method: 'POST',
      body: JSON.stringify(postData),
    }),
  
  likePost: (postId: string) =>
    fetchApi<{ likes: string[] }>(`/post/${postId}/like`, {
      method: 'POST',
    }),
  
  unlikePost: (postId: string) =>
    fetchApi<{ likes: string[] }>(`/post/${postId}/unlike`, {
      method: 'POST',
    }),
  
  addComment: (postId: string, content: string) =>
    fetchApi<Post>(`/post/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
    
  flagPost: (postId: string, reason: string) =>
    fetchApi<{ success: boolean }>(`/post/${postId}/flag`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
    
  translatePost: (postId: string, targetLanguage: string) =>
    fetchApi<{ translatedContent: string }>(`/post/${postId}/translate`, {
      method: 'POST',
      body: JSON.stringify({ targetLanguage }),
    }),
};

// Expert related API endpoints
export const ExpertApi = {
  getExperts: () => fetchApi<Expert[]>('/expert'),
  
  registerExpert: (expertData: ApiExpertRegisterRequest) =>
    fetchApi<Expert>('/expert/register', {
      method: 'POST',
      body: JSON.stringify(expertData),
    }),
    
  uploadVerificationDocument: (expertId: string, file: File, documentType: string) =>
    uploadFile(`/expert/${expertId}/document`, file, { documentType }),
    
  getExpertDocuments: (expertId: string) =>
    fetchApi<VerificationDocument[]>(`/expert/${expertId}/documents`),
  
  getExpertProfile: (expertId: string) =>
    fetchApi<Expert>(`/expert/${expertId}`),
    
  updateExpertProfile: (expertId: string, profileData: Partial<Expert>) =>
    fetchApi<Expert>(`/expert/${expertId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
};

// Chat session related API endpoints
export const SessionApi = {
  createSession: (sessionData: ApiChatSessionRequest) =>
    fetchApi<Session>('/session', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    }),
  
  getSessions: (userId: string) =>
    fetchApi<Session[]>(`/session/user/${userId}`),
    
  getExpertSessions: (expertId: string) =>
    fetchApi<Session[]>(`/session/expert/${expertId}`),
  
  getSessionDetails: (sessionId: string) =>
    fetchApi<Session>(`/session/${sessionId}`),
    
  updateSessionStatus: (sessionId: string, status: Session['status']) =>
    fetchApi<Session>(`/session/${sessionId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
    
  createVideoRoom: (sessionId: string) =>
    fetchApi<{ meetingUrl: string }>(`/session/${sessionId}/video`, {
      method: 'POST',
    }),
};

// Admin related API endpoints
export const AdminApi = {
  verifyExpert: (expertId: string, verificationData: ApiVerificationRequest) =>
    fetchApi<{ success: boolean }>(`/admin/verify/${expertId}`, {
      method: 'POST',
      body: JSON.stringify(verificationData),
    }),
  
  getFlaggedContent: () =>
    fetchApi<{ posts: Post[] }>('/admin/flagged'),
  
  resolveFlag: (contentId: string, action: 'approve' | 'remove') =>
    fetchApi<{ success: boolean }>(`/admin/flagged/${contentId}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
    
  getPendingExperts: () =>
    fetchApi<Expert[]>('/admin/experts/pending'),
    
  getAllExperts: () =>
    fetchApi<Expert[]>('/admin/experts'),
    
  adminLogin: (email: string, password: string) =>
    fetchApi<{ token: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};
