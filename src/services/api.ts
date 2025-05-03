
import { ApiResponse, ApiPostRequest, ApiExpertRegisterRequest, ApiChatSessionRequest, Post, Expert } from '@/types';

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
};

// Expert related API endpoints
export const ExpertApi = {
  getExperts: () => fetchApi<Expert[]>('/expert'),
  
  registerExpert: (expertData: ApiExpertRegisterRequest) =>
    fetchApi<Expert>('/expert/register', {
      method: 'POST',
      body: JSON.stringify(expertData),
    }),
  
  getExpertProfile: (expertId: string) =>
    fetchApi<Expert>(`/expert/${expertId}`),
};

// Chat session related API endpoints
export const ChatApi = {
  createSession: (sessionData: ApiChatSessionRequest) =>
    fetchApi<{ sessionId: string }>('/chat/session', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    }),
  
  getSessionMessages: (sessionId: string) =>
    fetchApi<{ messages: any[] }>(`/chat/session/${sessionId}/messages`),
  
  sendMessage: (sessionId: string, content: string) =>
    fetchApi<{ message: any }>(`/chat/session/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};

// Admin related API endpoints
export const AdminApi = {
  verifyExpert: (expertId: string, verificationLevel: 'blue' | 'gold' | 'platinum') =>
    fetchApi<{ success: boolean }>(`/admin/verify/${expertId}`, {
      method: 'POST',
      body: JSON.stringify({ verificationLevel }),
    }),
  
  getFlaggedContent: () =>
    fetchApi<{ posts: Post[] }>('/admin/flagged'),
  
  resolveFlag: (contentId: string, action: 'approve' | 'remove') =>
    fetchApi<{ success: boolean }>(`/admin/flagged/${contentId}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
};
