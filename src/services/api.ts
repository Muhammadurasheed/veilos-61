import axios from 'axios';
import { logger } from './logger';
import { tokenManager } from './tokenManager';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication and logging
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const authHeaders = tokenManager.getAuthHeaders();
    config.headers = { ...config.headers, ...authHeaders };
    
    logger.apiRequest(config.method?.toUpperCase() || 'UNKNOWN', config.url || '', config.data);
    return config;
  },
  (error) => {
    logger.error('API Request Error', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    logger.apiResponse(
      response.config.method?.toUpperCase() || 'UNKNOWN',
      response.config.url || '',
      response.status,
      response.data
    );
    return response;
  },
  (error) => {
    const status = error.response?.status || 0;
    const url = error.config?.url || 'unknown';
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    
    logger.apiResponse(method, url, status, error.response?.data);
    
    // Handle 401 errors by clearing invalid tokens
    if (status === 401) {
      logger.warn('Unauthorized request - clearing token');
      tokenManager.removeToken();
    }
    
    return Promise.reject(error);
  }
);

// User API methods
export const UserApi = {
  // Register new user (anonymous or with credentials)
  async register(userData: { 
    alias?: string; 
    avatarIndex?: number; 
    email?: string; 
    password?: string; 
  } = {}) {
    logger.accountCreation('Starting registration', userData);
    const response = await api.post('/api/auth/register', userData);
    
    if (response.data?.success && response.data?.data?.token) {
      tokenManager.setToken(response.data.data.token);
      logger.accountCreation('Registration successful - token saved');
    }
    
    return response.data;
  },

  // Login with email and password
  async login(credentials: { email: string; password: string }) {
    logger.userAction('Login attempt', { email: credentials.email });
    const response = await api.post('/api/auth/login', credentials);
    
    if (response.data?.success && response.data?.data?.token) {
      tokenManager.setToken(response.data.data.token);
      logger.userAction('Login successful - token saved');
    }
    
    return response.data;
  },

  // Authenticate with token
  async authenticate(token: string) {
    const response = await api.get('/api/auth/verify', {
      headers: { 'x-auth-token': token }
    });
    return response.data;
  },

  // Refresh token
  async refreshToken(token: string) {
    const response = await api.post('/api/auth/refresh', { refreshToken: token });
    
    if (response.data?.success && response.data?.data?.token) {
      tokenManager.setToken(response.data.data.token);
      logger.debug('Token refreshed successfully');
    }
    
    return response.data;
  },

  // Update user profile
  async updateProfile(updates: any) {
    logger.userAction('Profile update', updates);
    const response = await api.put('/api/auth/profile', updates);
    return response.data;
  }
};

export default api;