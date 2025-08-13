
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
  email?: string; // Added email field
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
}

// Create context with default values
const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  refreshIdentity: () => {},
  createAnonymousAccount: async () => {},
  isLoading: false,
  updateAvatar: async () => {},
});

// Custom hook to use the UserContext
export const useUserContext = () => useContext(UserContext);

// Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [token, setToken, removeToken] = useLocalStorage<string | null>('veilo-token', null);

  // Initialize user from token on mount
  const initializeUser = useCallback(async () => {
    if (token) {
      try {
        // Attempt to authenticate with saved token
        const response = await UserApi.authenticate(token);
        
        if (response.success && response.data?.user) {
          setUser({
            ...response.data.user,
            loggedIn: true
          });
        } else {
          // Invalid token, clear it
          removeToken();
          // Automatically create a new anonymous account
          await createNewAnonymousUser();
        }
      } catch (error) {
        console.error('Authentication error:', error);
        // Create new anonymous user on error
        await createNewAnonymousUser();
      } finally {
        setIsLoading(false);
      }
    } else {
      // No token found, but don't auto-create anonymous user
      // Just set loading to false and let the user decide
      setIsLoading(false);
    }
  }, [token, removeToken]);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  // Register new anonymous user
  const registerNewUser = async () => {
    try {
      const response = await UserApi.register();
      
      if (response.success && response.data) {
        // Save token
        setToken(response.data.token);
        
        // Set user
        setUser({
          ...response.data.user,
          loggedIn: true
        });
        
        toast({
          title: "Welcome to Veilo",
          description: "Your anonymous account has been created successfully.",
        });
        
        return response.data.user;
      } else {
        // Failed to register, use fallback
        console.error('Registration failed:', response.error);
        useFallbackUser();
        return null;
      }
    } catch (error) {
      console.error('Registration error:', error);
      useFallbackUser();
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create new anonymous user specifically for the anonymous flow
  const createNewAnonymousUser = async () => {
    setIsLoading(true);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Connection Timeout",
        description: "Unable to create an anonymous account. Please try again.",
        variant: "destructive"
      });
    }, 5000);
    
    try {
      const response = await UserApi.createAnonymousUser();
      
      // Clear the timeout as we got a response
      clearTimeout(timeoutId);
      
      if (response.success && response.data) {
        // Save token
        setToken(response.data.token);
        
        // Set user
        setUser({
          ...response.data.user,
          loggedIn: true,
          isAnonymous: true
        });
        
        toast({
          title: "Welcome to Veilo",
          description: "Your anonymous identity has been created.",
        });
        
        // Navigate to sanctuary space - will be handled by the component that calls this function
      } else {
        // Failed to register, fall back to original registration
        await registerNewUser();
      }
    } catch (error) {
      // Clear the timeout as we got a response (error)
      clearTimeout(timeoutId);
      
      console.error('Anonymous registration error:', error);
      await registerNewUser();
    } finally {
      setIsLoading(false);
    }
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
    
    toast({
      title: "Offline Mode",
      description: "Using local profile. Some features may be limited.",
      variant: "destructive"
    });
  };

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
    });
  }, [removeToken]);

  const refreshIdentity = async () => {
    if (user) {
      try {
        const response = await UserApi.refreshIdentity();
        
        if (response.success && response.data?.user) {
          setUser({
            ...response.data.user,
            loggedIn: true
          });
          
          toast({
            title: 'Identity refreshed',
            description: 'Your anonymous identity has been refreshed.',
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
      } catch (error) {
        console.error('Identity refresh error:', error);
        
        // Fallback to local refresh
        setUser({
          ...user,
          alias: generateAlias(),
          avatarIndex: Math.floor(Math.random() * 12) + 1,
        });
      }
    }
  };
  
  const createAnonymousAccount = async () => {
    setIsLoading(true);
    await createNewAnonymousUser();
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
      updateAvatar 
    }}>
      {children}
    </UserContext.Provider>
  );
};
