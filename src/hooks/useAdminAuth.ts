import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Verify token with backend
      const response = await fetch('/api/admin/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.user?.role === 'admin') {
          setIsAuthenticated(true);
          setUser(data.data.user);
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await AdminApi.login({ email, password });
      
      if (response.success && response.data?.token) {
        // Store both admin_token and veilo-auth-token for socket compatibility
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('veilo-auth-token', response.data.token);
        
        setIsAuthenticated(true);
        setUser(response.data.admin || response.data.user);
        
        toast({
          title: 'Login Successful',
          description: 'Welcome to the admin panel',
        });
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'An error occurred' };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('token');
    localStorage.removeItem('veilo-auth-token');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/admin');
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    checkAuthStatus
  };
};