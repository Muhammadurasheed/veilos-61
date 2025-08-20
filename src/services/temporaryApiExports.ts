// Minimal API exports to fix build errors
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export const AnalyticsApi = {
  getPlatformOverview: async () => ({ success: false, error: 'Not implemented' }),
  getExpertMetrics: async () => ({ success: false, error: 'Not implemented' }),
};

export const UserApi = {
  registerExpertAccount: async () => ({ success: false, error: 'Not implemented' }),
  login: async () => ({ success: false, error: 'Not implemented' }),
  updateProfile: async () => ({ success: false, error: 'Not implemented' }),
  updateAvatar: async () => ({ success: false, error: 'Not implemented' }),
  refreshToken: async () => ({ success: false, error: 'Not implemented' }),
};

export const SanctuaryApi = {
  createSession: async () => ({ success: false, error: 'Not implemented' }),
  getSession: async () => ({ success: false, error: 'Not implemented' }),
  submitMessage: async () => ({ success: false, error: 'Not implemented' }),
  getSubmissions: async () => ({ success: false, error: 'Not implemented' }),
};

export const LiveSanctuaryApi = {
  createLiveSession: async () => ({ success: false, error: 'Not implemented' }),
  joinSession: async () => ({ success: false, error: 'Not implemented' }),
};

export const GeminiApi = {
  refinePost: async () => ({ success: false, error: 'Not implemented' }),
};

export const apiRequest = async () => ({ success: false, error: 'Not implemented' });

// Export types
export interface ApiSanctuaryCreateRequest {
  topic: string;
  description?: string;
  emoji?: string;
  sanctuaryType?: string;
}

export interface SanctuaryMessage {
  id: string;
  participantId: string;
  participantAlias: string;
  content: string;
  timestamp: string;
  type: "text" | "system" | "emoji-reaction";
}

export interface UserCreationState {
  creating: boolean;
  error?: string;
}

// Token management functions
export const getAuthToken = (): string | null => {
  // Priority: admin_token > veilo-auth-token > token
  return localStorage.getItem('admin_token') || 
         localStorage.getItem('veilo-auth-token') || 
         localStorage.getItem('token');
};

export const setAdminToken = (token: string): void => {
  localStorage.setItem('admin_token', token);
  localStorage.setItem('veilo-auth-token', token);
  localStorage.setItem('token', token);
  // Update axios default header
  if (typeof window !== 'undefined') {
    try {
      const axios = require('axios');
      axios.defaults.headers.common['x-auth-token'] = token;
    } catch (e) {
      // Ignore axios import errors
    }
  }
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('veilo-auth-token');
  localStorage.removeItem('admin_token');
  localStorage.removeItem('token');
  if (typeof window !== 'undefined') {
    try {
      const axios = require('axios');
      delete axios.defaults.headers.common['x-auth-token'];
    } catch (e) {
      // Ignore axios import errors
    }
  }
};