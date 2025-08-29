import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { UserApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { tokenManager } from '@/services/tokenManager';
import { logger } from '@/services/logger';

interface AuthUser {
  id: string;
  alias: string;
  avatarIndex: number;
  role: string;
  isAnonymous?: boolean;
  expertId?: string;
  avatarUrl?: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  register: (userData: { email?: string; password?: string; alias?: string; realName?: string; preferredAlias?: string }) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize authentication state with resilient verification
  const initializeAuth = useCallback(async () => {
    const token = tokenManager.getToken();
    
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      logger.info('Initializing authentication with token verification');
      const userData = await UserApi.authenticate(token);

      if (userData?.success && userData?.data?.user) {
        setUser(userData.data.user);
        logger.info('Authentication successful', { userId: userData.data.user.id });
      } else {
        logger.warn('Token authentication failed');
        tokenManager.clearAllTokens();
      }
    } catch (error: any) {
      // Let the axios interceptor handle token refresh on 401
      // Only clear tokens if the error persists after refresh attempts
      if (error.response?.status !== 401) {
        logger.error('Auth initialization error:', error);
        tokenManager.clearAllTokens();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      logger.userAction('Login attempt', { email: credentials.email });
      const response = await UserApi.login(credentials);

      if (response?.success && response?.data?.token && response?.data?.user) {
        // Tokens are automatically saved by UserApi.login
        setUser(response.data.user);
        
        toast({
          title: 'Welcome back!',
          description: `Hello ${response.data.user.alias}!`,
        });
        
        return true;
      }
      
      toast({
        title: 'Login Failed',
        description: 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
      
      return false;
    } catch (error: any) {
      logger.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'An error occurred during login.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { email?: string; password?: string; alias?: string; realName?: string; preferredAlias?: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      logger.accountCreation('Registration attempt', userData);
      const response = await UserApi.register(userData);

      // Handle both success response formats
      if ((response?.success || response?.data?.token) && response?.data?.user) {
        // Tokens are automatically saved by UserApi.register
        setUser(response.data.user);
        
        toast({
          title: 'Welcome to Veilo! 🕊️',
          description: `Hello ${response.data.user.alias}! Your sanctuary awaits.`,
        });
        
        return true;
      }
      
      // Enhanced error handling with detailed validation errors
      let errorMessage = 'Failed to create account.';
      
      if (response?.errors && Array.isArray(response.errors) && response.errors.length > 0) {
        errorMessage = response.errors.map((err: any) => err.message).join(', ');
      } else if (response?.error) {
        errorMessage = response.error;
      }
      
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return false;
    } catch (error: any) {
      logger.error('Registration error:', error);
      
      // Handle validation errors specifically
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors.map((err: any) => err.message).join(', ');
        toast({
          title: 'Please Fix These Issues',
          description: validationErrors,
          variant: 'destructive',
        });
      } else {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'An error occurred during registration.';
        toast({
          title: 'Registration Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    tokenManager.clearAllTokens();
    setUser(null);
    
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
    });
  }, []);

  const refreshToken = async (): Promise<boolean> => {
    const refreshTokenValue = tokenManager.getRefreshToken();
    if (!refreshTokenValue) return false;

    try {
      const response = await UserApi.refreshToken(refreshTokenValue);

      if (response?.success && response?.data?.token) {
        // Tokens are automatically updated by UserApi.refreshToken
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Token refresh error:', error);
      logout();
      return false;
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await UserApi.updateProfile(updates);

      if (response?.success && response?.data?.user) {
        setUser(response.data.user);
        
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully.',
        });
        
        return true;
      }
      
      toast({
        title: 'Update Failed',
        description: response?.error || 'Failed to update profile.',
        variant: 'destructive',
      });
      
      return false;
    } catch (error: any) {
      logger.error('Profile update error:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'An error occurred while updating your profile.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};