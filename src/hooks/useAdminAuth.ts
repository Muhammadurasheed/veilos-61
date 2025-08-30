import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminApi, setAdminToken } from '@/services/api';
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

      console.log('🔍 Checking admin auth status with token:', token.substring(0, 20) + '...');

      // Verify token with backend
      const response = await fetch('/api/auth/admin/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Admin auth response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Admin auth response:', { success: data.success, hasUser: !!data.data?.user, userRole: data.data?.user?.role });
        
        if (data.success && data.data?.user?.role === 'admin') {
          setIsAuthenticated(true);
          setUser(data.data.user);
        } else {
          console.log('❌ Admin auth failed: invalid role or missing data');
          logout();
        }
      } else {
        console.log('❌ Admin auth failed: response not ok');
        logout();
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await AdminApi.login({ email, password });
      
      if (response.success && response.data?.token) {
        // Use centralized admin token setting
        setAdminToken(response.data.token);
        
        setIsAuthenticated(true);
        setUser(response.data.admin || response.data.user);
        
        toast({
          title: 'Login Successful',
          description: 'Welcome to the admin panel',
        });
        
        // Navigate to admin panel after successful login
        navigate('/admin/dashboard');
        
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