import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { generateAlias } from '@/lib/alias';
import { UserRole } from '@/types';
import { UserApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { logger } from '@/services/logger';
import { tokenManager } from '@/services/tokenManager';

// Define the user type
export interface User {
  id: string;
  alias: string;
  avatarIndex: number;
  loggedIn: boolean;
  role?: UserRole;
  isAnonymous?: boolean;
  expertId?: string;
  avatarUrl?: string;
  email?: string;
}

// Enhanced user creation state
export interface UserCreationState {
  step: 'idle' | 'initializing' | 'creating' | 'authenticating' | 'finalizing' | 'complete' | 'error';
  progress: number;
  message: string;
  retryCount: number;
}

// Define the context type
interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  refreshIdentity: () => void;
  createAnonymousAccount: (alias?: string, avatarIndex?: number) => Promise<boolean>;
  isLoading: boolean;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  creationState: UserCreationState;
  retryAccountCreation: () => Promise<boolean>;
}

// Initial creation state
const initialCreationState: UserCreationState = {
  step: 'idle',
  progress: 0,
  message: '',
  retryCount: 0
};

// Create context with default values
const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  refreshIdentity: () => {},
  createAnonymousAccount: async () => false,
  isLoading: false,
  updateAvatar: async () => {},
  creationState: initialCreationState,
  retryAccountCreation: async () => false,
});

// Custom hook to use the UserContext
export const useUserContext = () => useContext(UserContext);

// Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [creationState, setCreationState] = useState<UserCreationState>(initialCreationState);
  // Remove useLocalStorage dependency - now handled by tokenManager

  // Helper to update creation state
  const updateCreationState = useCallback((updates: Partial<UserCreationState>) => {
    setCreationState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize user from token on mount with enhanced logging
  const initializeUser = useCallback(async () => {
    if (tokenManager.hasToken()) {
      try {
        logger.info('Initializing user with existing token');
        updateCreationState({ 
          step: 'authenticating', 
          progress: 20, 
          message: 'Verifying your identity...' 
        });

        const token = tokenManager.getToken()!;
        const response = await UserApi.authenticate(token);
        
        if (response.success && response.data?.user) {
          setUser({
            ...response.data.user,
            loggedIn: true
          });
          
          logger.info('User initialized successfully', {
            userId: response.data.user.id,
            alias: response.data.user.alias,
            isAnonymous: response.data.user.isAnonymous
          });
          
          updateCreationState({ 
            step: 'complete', 
            progress: 100, 
            message: 'Welcome back!' 
          });
        } else {
          logger.warn('Token authentication failed, removing token');
          tokenManager.removeToken();
          updateCreationState({ step: 'idle', progress: 0, message: '' });
        }
      } catch (error: any) {
        logger.error('Authentication error', { error: error.message });
        tokenManager.removeToken();
        updateCreationState({ step: 'idle', progress: 0, message: '' });
      } finally {
        setIsLoading(false);
      }
    } else {
      logger.info('No token found, user not logged in');
      setIsLoading(false);
      updateCreationState({ step: 'idle', progress: 0, message: '' });
    }
  }, [updateCreationState]);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  // Enhanced anonymous account creation with perfect backend sync
  const createAnonymousAccount = async (alias?: string, avatarIndex?: number): Promise<boolean> => {
    logger.accountCreation('Starting anonymous account creation process');
    setIsLoading(true);
    
    try {
      // Step 1: Initialize
      updateCreationState({
        step: 'initializing',
        progress: 15,
        message: 'Initializing secure environment...',
        retryCount: 0
      });

      await new Promise(resolve => setTimeout(resolve, 600));

      // Step 2: Creating identity
      updateCreationState({
        step: 'creating',
        progress: 35,
        message: 'Generating anonymous identity...'
      });

      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: Server communication
      updateCreationState({
        step: 'authenticating',
        progress: 65,
        message: 'Establishing secure connection...'
      });

      logger.accountCreation('Calling backend registration API');
      const userData = alias && avatarIndex ? { alias, avatarIndex } : {};
      const response = await UserApi.register(userData);

      logger.accountCreation('Backend response received', { 
        success: response.success, 
        hasUser: !!response.data?.user 
      });

      if (response.success && response.data) {
        // Step 4: Finalizing
        updateCreationState({
          step: 'finalizing',
          progress: 90,
          message: 'Setting up your sanctuary...'
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Token is automatically saved by UserApi.register via tokenManager
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        setUser({
          ...response.data.user,
          loggedIn: true,
          isAnonymous: true
        });

        // Step 5: Complete
        updateCreationState({
          step: 'complete',
          progress: 100,
          message: 'Welcome to your sanctuary! 🎉'
        });

        logger.accountCreation('Anonymous account creation successful', {
          userId: response.data.user.id,
          alias: response.data.user.alias
        });

        // Show success message
        toast({
          title: "Welcome to Veilo! 🕊️",
          description: `Hello ${response.data.user.alias}! Your sanctuary awaits.`,
          duration: 4000,
        });

        // Reset creation state after a delay
        setTimeout(() => {
          updateCreationState(initialCreationState);
        }, 2000);
        
        return true;

      } else {
        throw new Error(response.error || 'Failed to create anonymous account');
      }
    } catch (error: any) {
      logger.error('Anonymous account creation failed', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Unable to create account. Please check your connection and try again.';
      
      updateCreationState({
        step: 'error',
        progress: 0,
        message: errorMessage,
        retryCount: creationState.retryCount + 1
      });

      // Show error toast with retry option
      toast({
        title: "Connection Issue",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });

      // Fallback to offline mode if retries exceed threshold
      if (creationState.retryCount >= 2) {
        useFallbackUser();
        return false;
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Retry account creation
  const retryAccountCreation = async (): Promise<boolean> => {
    return await createAnonymousAccount();
  };

  // Create fallback user when API is unavailable
  const useFallbackUser = () => {
    const fallbackUser: User = {
      id: `user-${Math.random().toString(36).substring(2, 10)}`,
      alias: generateAlias(),
      avatarIndex: Math.floor(Math.random() * 12) + 1,
      loggedIn: false,
      role: UserRole.SHADOW,
      isAnonymous: true
    };
    
    setUser(fallbackUser);
    
    updateCreationState({
      step: 'complete',
      progress: 100,
      message: 'Using offline mode'
    });

    toast({
      title: "Offline Mode Activated",
      description: "Using local profile. Some features may be limited.",
      variant: "destructive",
      duration: 4000,
    });

    setTimeout(() => {
      updateCreationState(initialCreationState);
    }, 2000);
  };

  const logout = useCallback(() => {
    tokenManager.removeToken();
    setUser(null);
    updateCreationState(initialCreationState);
    
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
    });
  }, [updateCreationState]);

  const refreshIdentity = async () => {
    if (user) {
      try {
        updateCreationState({
          step: 'creating',
          progress: 50,
          message: 'Refreshing your identity...'
        });

        const response = await UserApi.refreshIdentity();
        
        if (response.success && response.data?.user) {
          setUser({
            ...response.data.user,
            loggedIn: true
          });
          
          updateCreationState({
            step: 'complete',
            progress: 100,
            message: 'Identity refreshed!'
          });
          
          toast({
            title: 'Identity refreshed',
            description: `Welcome back, ${response.data.user.alias}!`,
          });
        } else {
          // Fallback to local refresh if API fails
          setUser({
            ...user,
            alias: generateAlias(),
            avatarIndex: Math.floor(Math.random() * 12) + 1,
          });
          
          updateCreationState({
            step: 'complete',
            progress: 100,
            message: 'Identity refreshed locally'
          });
          
          toast({
            title: 'Identity refreshed',
            description: 'Your anonymous identity has been refreshed locally.',
          });
        }

        setTimeout(() => {
          updateCreationState(initialCreationState);
        }, 1500);
      } catch (error) {
        console.error('Identity refresh error:', error);
        
        updateCreationState({
          step: 'error',
          progress: 0,
          message: 'Failed to refresh identity'
        });
        
        // Fallback to local refresh
        setUser({
          ...user,
          alias: generateAlias(),
          avatarIndex: Math.floor(Math.random() * 12) + 1,
        });

        setTimeout(() => {
          updateCreationState(initialCreationState);
        }, 1500);
      }
    }
  };
  
  const updateAvatar = async (avatarUrl: string) => {
    if (!user) return;
    
    try {
      const response = await UserApi.updateAvatar(avatarUrl);
      
      if (response.success && response.data?.user) {
        setUser({
          ...user,
          avatarUrl: response.data.user.avatarUrl
        });
        
        toast({
          title: 'Avatar updated',
          description: 'Your profile avatar has been updated successfully.',
        });
      } else {
        toast({
          title: 'Avatar update failed',
          description: response.error || 'An error occurred while updating your avatar.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Avatar update error:', error);
      toast({
        title: 'Avatar update failed',
        description: 'An error occurred while updating your avatar.',
        variant: 'destructive',
      });
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      logout, 
      refreshIdentity, 
      createAnonymousAccount, 
      isLoading,
      updateAvatar,
      creationState,
      retryAccountCreation
    }}>
      {children}
    </UserContext.Provider>
  );
};