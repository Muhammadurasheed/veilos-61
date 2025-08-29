import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';
import { AuthGuard } from '@/components/auth/AuthGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth' 
}) => {
  const { user, isLoading } = useAuth();

  // Don't render anything while loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If auth not required and user is logged in, redirect to dashboard
  if (!requireAuth && user) {
    return <Navigate to="/dashboard" replace />;
  }

  // If auth required, use AuthGuard
  if (requireAuth) {
    return (
      <AuthGuard fallback={<Navigate to={redirectTo} replace />}>
        {children}
      </AuthGuard>
    );
  }

  // Auth not required and no user - render children
  return <>{children}</>;
};