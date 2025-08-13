import { apiRequest, ApiResponse } from './api';

export interface Recommendation {
  id: string;
  type: 'expert' | 'post' | 'resource' | 'topic';
  title: string;
  description: string;
  relevanceScore: number;
  basedOn: string;
  category: 'mood' | 'topic' | 'behavior' | 'emergency' | 'wellness';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expertId?: string;
  resourceTitle?: string;
  resourceUrl?: string;
  topicName?: string;
  postId?: string;
  timestamp: string;
}

export interface ExpertMatch {
  expertId: string;
  matchScore: number;
  reason: string;
  specialtyAlignment: string;
  expert: {
    id: string;
    alias: string;
    specialties: string[];
    bio: string;
  };
}

export interface ContentAppeal {
  id: string;
  postId: string;
  appealReason: string;
  status: 'pending' | 'approved' | 'denied';
  timestamp: string;
  reviewDate?: string;
  reviewNotes?: string;
}

export const RecommendationApi = {
  // Get personalized recommendations
  getRecommendations: async (type?: string, limit?: number): Promise<ApiResponse<Recommendation[]>> => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (limit) params.append('limit', limit.toString());
    
    return await apiRequest('GET', `/recommendations?${params.toString()}`);
  },

  // Generate AI-powered recommendations
  generateRecommendations: async (data: {
    postContent?: string;
    feeling?: string;
    topic?: string;
    recentActivity?: string;
  }): Promise<ApiResponse<Recommendation[]>> => {
    return await apiRequest('POST', '/recommendations/generate', data);
  },

  // Mark recommendation as shown
  markAsShown: async (recommendationId: string): Promise<ApiResponse<Recommendation>> => {
    return await apiRequest('PUT', `/recommendations/${recommendationId}/shown`);
  },

  // Mark recommendation as clicked
  markAsClicked: async (recommendationId: string): Promise<ApiResponse<Recommendation>> => {
    return await apiRequest('PUT', `/recommendations/${recommendationId}/clicked`);
  },

  // Dismiss recommendation
  dismissRecommendation: async (recommendationId: string): Promise<ApiResponse<Recommendation>> => {
    return await apiRequest('PUT', `/recommendations/${recommendationId}/dismiss`);
  },

  // Get expert matches
  getExpertMatches: async (data: {
    feeling?: string;
    topic?: string;
    urgency?: string;
  }): Promise<ApiResponse<ExpertMatch[]>> => {
    return await apiRequest('POST', '/recommendations/expert-match', data);
  }
};

export const AppealApi = {
  // Submit content appeal
  submitAppeal: async (data: {
    postId: string;
    appealReason: string;
  }): Promise<ApiResponse<ContentAppeal>> => {
    return await apiRequest('POST', '/appeals', data);
  },

  // Get user's appeals
  getMyAppeals: async (): Promise<ApiResponse<ContentAppeal[]>> => {
    return await apiRequest('GET', '/appeals/my-appeals');
  },

  // Get appeal details
  getAppeal: async (appealId: string): Promise<ApiResponse<ContentAppeal>> => {
    return await apiRequest('GET', `/appeals/${appealId}`);
  },

  // Admin: Get all appeals
  getAllAppeals: async (status?: string, limit?: number, offset?: number): Promise<ApiResponse<{
    appeals: ContentAppeal[];
    total: number;
    hasMore: boolean;
  }>> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    return await apiRequest('GET', `/appeals/admin/all?${params.toString()}`);
  },

  // Admin: Review appeal
  reviewAppeal: async (appealId: string, data: {
    status: 'approved' | 'denied';
    reviewNotes?: string;
  }): Promise<ApiResponse<ContentAppeal>> => {
    return await apiRequest('PUT', `/appeals/admin/${appealId}/review`, data);
  }
};