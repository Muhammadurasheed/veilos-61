import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { generateAlias } from '@/lib/alias';
import { UserRole } from '@/types';
import { UserApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';

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
  createAnonymousAccount: () => Promise<void>;
  isLoading: boolean;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  creationState: UserCreationState;
  retryAccountCreation: () => Promise<void>;
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
  createAnonymousAccount: async () => {},
  isLoading: false,
  updateAvatar: async () => {},
  creationState: initialCreationState,
  retryAccountCreation: async () => {},
});

// Custom hook to use the UserContext
export const useUserContext = () => useContext(UserContext);

// Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [creationState, setCreationState] = useState<UserCreationState>(initialCreationState);
  const [token, setToken, removeToken] = useLocalStorage<string | null>('veilo-token', null);

  // Helper to update creation state
  const updateCreationState = useCallback((updates: Partial<UserCreationState>) => {
    setCreationState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize user from token on mount
  const initializeUser = useCallback(async () => {
    if (token) {
      try {
        updateCreationState({ 
          step: 'authenticating', 
          progress: 20, 
          message: 'Verifying your identity...' 
        });

        const response = await UserApi.authenticate(token);
        
        if (response.success && response.data?.user) {
          setUser({
            ...response.data.user,
            loggedIn: true
          });
          
          updateCreationState({ 
            step: 'complete', 
            progress: 100, 
            message: 'Welcome back!' 
          });
        } else {
          removeToken();
          updateCreationState({ step: 'idle', progress: 0, message: '' });
        }
      } catch (error) {
        console.error('Authentication error:', error);
        removeToken();
        updateCreationState({ step: 'idle', progress: 0, message: '' });
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
      updateCreationState({ step: 'idle', progress: 0, message: '' });
    }
  }, [token, removeToken, updateCreationState]);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  // Enhanced anonymous account creation with detailed steps
  const createAnonymousAccount = async () => {
    setIsLoading(true);
    
    try {
      // Step 1: Initialize
      updateCreationState({
        step: 'initializing',
        progress: 10,
        message: 'Preparing your anonymous identity...',
        retryCount: 0
      });

      await new Promise(resolve => setTimeout(resolve, 800)); // UX timing

      // Step 2: Creating identity
      updateCreationState({
        step: 'creating',
        progress: 30,
        message: 'Generating secure anonymous profile...'
      });

      await new Promise(resolve => setTimeout(resolve, 600));

      // Step 3: Server communication
      updateCreationState({
        step: 'authenticating',
        progress: 60,
        message: 'Establishing secure connection...'
      });

      const response = await UserApi.createAnonymousUser();

      if (response.success && response.data) {
        // Step 4: Finalizing
        updateCreationState({
          step: 'finalizing',
          progress: 85,
          message: 'Setting up your sanctuary access...'
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Save token and user data
        setToken(response.data.token);
        setUser({
          ...response.data.user,
          loggedIn: true,
          isAnonymous: true
        });

        // Step 5: Complete
        updateCreationState({
          step: 'complete',
          progress: 100,
          message: 'Your anonymous identity is ready!'
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

      } else {
        throw new Error(response.error || 'Failed to create anonymous account');
      }
    } catch (error: any) {
      console.error('Anonymous account creation failed:', error);
      
      updateCreationState({
        step: 'error',
        progress: 0,
        message: 'Unable to create account. Please try again.',
        retryCount: creationState.retryCount + 1
      });

      // Show error toast with retry option
      toast({
        title: "Connection Issue",
        description: "We couldn't create your anonymous account. Check your internet connection.",
        variant: "destructive",
        duration: 5000,
      });

      // Fallback to offline mode if retries exceed threshold
      if (creationState.retryCount >= 2) {
        useFallbackUser();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Retry account creation
  const retryAccountCreation = async () => {
    await createAnonymousAccount();
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
    removeToken();
    setUser(null);
    updateCreationState(initialCreationState);
    
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
    });
  }, [removeToken, updateCreationState]);

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