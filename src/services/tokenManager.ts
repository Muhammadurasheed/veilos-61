import { logger } from './logger';

class TokenManager {
  private static instance: TokenManager;
  private readonly TOKEN_KEY = 'veilo-auth-token';
  
  private constructor() {}
  
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }
  
  setToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      logger.debug('Token set successfully');
    } catch (error) {
      logger.error('Failed to set token', error);
    }
  }
  
  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      logger.error('Failed to get token', error);
      return null;
    }
  }
  
  removeToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      logger.debug('Token removed successfully');
    } catch (error) {
      logger.error('Failed to remove token', error);
    }
  }
  
  hasToken(): boolean {
    return !!this.getToken();
  }
  
  // For API headers
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { 'x-auth-token': token } : {};
  }
}

export const tokenManager = TokenManager.getInstance();