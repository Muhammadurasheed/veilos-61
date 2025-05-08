
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { generateAlias } from '@/lib/alias';
import { UserRole } from '@/types';
import { UserApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';

// Define the user type
export interface User {
  id: string;
  alias: string;
  avatarIndex: number;
  loggedIn: boolean;
  role?: UserRole; // Add role to match what's used in AdminPanel.tsx
}

// Define the context type
interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  refreshIdentity: () => void;
  isLoading: boolean;
}

// Create context with default values
const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  refreshIdentity: () => {},
  isLoading: false,
});

// Custom hook to use the UserContext
export const useUserContext = () => useContext(UserContext);

// Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize user from token on mount
  useEffect(() => {
    const initializeUser = async () => {
      const token = localStorage.getItem('veilo-token');
      
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
            localStorage.removeItem('veilo-token');
            // Register as new user
            await registerNewUser();
          }
        } catch (error) {
          console.error('Authentication error:', error);
          // Register as new user on error
          await registerNewUser();
        }
      } else {
        // No token found, register new user
        await registerNewUser();
      }
      
      setIsLoading(false);
    };
    
    initializeUser();
  }, []);

  // Register new anonymous user
  const registerNewUser = async () => {
    try {
      const response = await UserApi.register();
      
      if (response.success && response.data) {
        // Save token
        localStorage.setItem('veilo-token', response.data.token);
        
        // Set user
        setUser({
          ...response.data.user,
          loggedIn: true
        });
      } else {
        // Failed to register, use fallback
        console.error('Registration failed:', response.error);
        useFallbackUser();
      }
    } catch (error) {
      console.error('Registration error:', error);
      useFallbackUser();
    }
  };

  // Create fallback user when API is unavailable
  const useFallbackUser = () => {
    const fallbackUser: User = {
      id: `user-${Math.random().toString(36).substring(2, 10)}`,
      alias: generateAlias(),
      avatarIndex: Math.floor(Math.random() * 12) + 1,
      loggedIn: false,
      role: 'shadow'
    };
    
    setUser(fallbackUser);
  };

  const logout = () => {
    localStorage.removeItem('veilo-token');
    setUser(null);
    
    // Register as new anonymous user after logout
    registerNewUser();
    
    toast({
      title: 'Logged out',
      description: 'You have been logged out. A new anonymous identity has been created.',
    });
  };

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

  return (
    <UserContext.Provider value={{ user, setUser, logout, refreshIdentity, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};
