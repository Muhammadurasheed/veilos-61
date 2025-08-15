import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { generateAlias } from '@/lib/alias';
import { UserRole } from '@/types';
import { UserApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/services/logger';
import { tokenManager } from '@/services/tokenManager';

// Unified Application State
interface AppState {
  isFirstLaunch: boolean;
  hasCompletedOnboarding: boolean;
  isInitialized: boolean;
  currentStep: 'loading' | 'onboarding' | 'main';
}

// User Data
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

// Account Creation State
export interface UserCreationState {
  step: 'idle' | 'initializing' | 'creating' | 'authenticating' | 'finalizing' | 'complete' | 'error';
  progress: number;
  message: string;
  retryCount: number;
}

// Unified Context Type
interface UnifiedStateContextType {
  // App State
  appState: AppState;
  setInitialized: () => void;
  markOnboardingComplete: () => void;
  resetApp: () => void;
  
  // User State
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  
  // Account Creation
  createAnonymousAccount: (alias?: string, avatarIndex?: number) => Promise<boolean>;
  creationState: UserCreationState;
  retryAccountCreation: () => Promise<boolean>;
  
  // User Actions
  logout: () => void;
  refreshIdentity: () => void;
  updateAvatar: (avatarUrl: string) => Promise<void>;
}

const APP_STATE_KEY = 'veilo-unified-state';

const defaultAppState: AppState = {
  isFirstLaunch: true,
  hasCompletedOnboarding: false,
  isInitialized: false,
  currentStep: 'loading'
};

const initialCreationState: UserCreationState = {
  step: 'idle',
  progress: 0,
  message: '',
  retryCount: 0
};

const UnifiedStateContext = createContext<UnifiedStateContextType | undefined>(undefined);

export const useUnifiedState = () => {
  const context = useContext(UnifiedStateContext);
  if (!context) {
    throw new Error('useUnifiedState must be used within a UnifiedStateProvider');
  }
  return context;
};

export const UnifiedStateProvider = ({ children }: { children: ReactNode }) => {
  const [appState, setAppState] = useState<AppState>(defaultAppState);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [creationState, setCreationState] = useState<UserCreationState>(initialCreationState);

  // Helper to update creation state
  const updateCreationState = useCallback((updates: Partial<UserCreationState>) => {
    setCreationState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize app state from localStorage
  useEffect(() => {
    const initializeAppState = async () => {
      try {
        const savedState = localStorage.getItem(APP_STATE_KEY);
        
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setAppState(prev => ({
            ...prev,
            ...parsed,
            isInitialized: true,
            currentStep: parsed.hasCompletedOnboarding ? 'main' : 'onboarding'
          }));
          logger.info('App state loaded from localStorage', parsed);
        } else {
          // First time user
          setAppState(prev => ({
            ...prev,
            isInitialized: true,
            currentStep: 'onboarding'
          }));
          logger.info('First launch detected - showing onboarding');
        }

        // Initialize user if token exists
        await initializeUser();
        
      } catch (error) {
        logger.error('Error loading app state', error);
        setAppState(prev => ({ ...prev, isInitialized: true, currentStep: 'onboarding' }));
        setIsLoading(false);
      }
    };

    initializeAppState();
  }, []);

  // Save app state to localStorage whenever it changes
  useEffect(() => {
    if (appState.isInitialized) {
      try {
        const stateToSave = {
          isFirstLaunch: appState.isFirstLaunch,
          hasCompletedOnboarding: appState.hasCompletedOnboarding
        };
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(stateToSave));
        logger.debug('App state saved to localStorage', stateToSave);
      } catch (error) {
        logger.error('Error saving app state', error);
      }
    }
  }, [appState]);

  // Initialize user from token
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
      }
    } else {
      logger.info('No token found, user not logged in');
      updateCreationState({ step: 'idle', progress: 0, message: '' });
    }
    setIsLoading(false);
  }, [updateCreationState]);

  // App State Actions
  const markOnboardingComplete = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      isFirstLaunch: false,
      hasCompletedOnboarding: true,
      currentStep: 'main'
    }));
    logger.userAction('Onboarding completed');
  }, []);

  const resetApp = useCallback(() => {
    localStorage.removeItem(APP_STATE_KEY);
    tokenManager.removeToken();
    setAppState(defaultAppState);
    setUser(null);
    setCreationState(initialCreationState);
    logger.userAction('App reset to initial state');
  }, []);

  const setInitialized = useCallback(() => {
    setAppState(prev => ({ ...prev, isInitialized: true }));
  }, []);

  // Enhanced anonymous account creation
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

        // Save refresh token
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

      // Show error toast
      toast({
        title: "Connection Issue",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Retry account creation
  const retryAccountCreation = async (): Promise<boolean> => {
    return await createAnonymousAccount();
  };

  // User Actions
  const logout = useCallback(() => {
    tokenManager.removeToken();
    localStorage.removeItem('refreshToken');
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
          
          toast({
            title: 'Identity refreshed',
            description: 'Your anonymous identity has been refreshed locally.',
          });
        }

        setTimeout(() => {
          updateCreationState(initialCreationState);
        }, 1500);
      } catch (error) {
        logger.error('Identity refresh error:', error);
        
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
      logger.error('Avatar update error:', error);
      toast({
        title: 'Avatar update failed',
        description: 'An error occurred while updating your avatar.',
        variant: 'destructive',
      });
    }
  };

  const value: UnifiedStateContextType = {
    // App State
    appState,
    setInitialized,
    markOnboardingComplete,
    resetApp,
    
    // User State
    user,
    setUser,
    isLoading,
    
    // Account Creation
    createAnonymousAccount,
    creationState,
    retryAccountCreation,
    
    // User Actions
    logout,
    refreshIdentity,
    updateAvatar,
  };

  return (
    <UnifiedStateContext.Provider value={value}>
      {children}
    </UnifiedStateContext.Provider>
  );
};