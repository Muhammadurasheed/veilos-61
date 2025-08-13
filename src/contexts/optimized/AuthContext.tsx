import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { UserApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useApi } from '@/hooks/useApi';

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
  register: (userData: { email?: string; password?: string; alias?: string }) => Promise<boolean>;
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
  const [token, setToken, removeToken] = useLocalStorage<string | null>('veilo-auth-token', null);
  const { execute } = useApi();

  const isAuthenticated = !!user;

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await execute(
        () => UserApi.authenticate(token),
        { showErrorToast: false }
      );

      if (userData?.user) {
        setUser(userData.user);
      } else {
        removeToken();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      removeToken();
    } finally {
      setIsLoading(false);
    }
  }, [token, execute, removeToken]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await execute(
        () => UserApi.login(credentials),
        {
          showSuccessToast: true,
          successMessage: 'Welcome back!',
          showErrorToast: true,
          errorMessage: 'Invalid credentials. Please try again.',
        }
      );

      if (response?.token && response?.user) {
        setToken(response.token);
        setUser(response.user);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { email?: string; password?: string; alias?: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await execute(
        () => UserApi.register(userData),
        {
          showSuccessToast: true,
          successMessage: 'Account created successfully!',
          showErrorToast: true,
        }
      );

      if (response?.token && response?.user) {
        setToken(response.token);
        setUser(response.user);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
    });
  }, [removeToken]);

  const refreshToken = async (): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await execute(
        () => UserApi.refreshToken(token),
        { showErrorToast: false }
      );

      if (response?.token) {
        setToken(response.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return false;
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await execute(
        () => UserApi.updateProfile(updates),
        {
          showSuccessToast: true,
          successMessage: 'Profile updated successfully!',
          showErrorToast: true,
        }
      );

      if (response?.user) {
        setUser(response.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Profile update error:', error);
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