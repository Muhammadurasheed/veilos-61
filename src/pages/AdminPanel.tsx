
import { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AdminApi } from '@/services/api';
import { useSocket } from '@/hooks/useSocket';
import { Expert, Post, UserRole } from '@/types';
import { useUserContext } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import AdminLogin from '@/components/admin/AdminLogin';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import FlagshipExpertManagement from '@/components/admin/FlagshipExpertManagement';
import ContentModeration from '@/components/admin/ContentModeration';
import EnhancedAdminDashboard from '@/components/admin/EnhancedAdminDashboard';
import UserSafetyMonitor from '@/components/admin/UserSafetyMonitor';
import RealTimePlatformMonitor from '@/components/admin/RealTimePlatformMonitor';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';

const AdminPanel = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAdminAuth();

  // Initialize socket connection for real-time admin updates
  useSocket({ autoConnect: true });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => navigate('/admin')} />;
  }

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/experts')) return 'experts';
    if (path.includes('/content')) return 'content';
    if (path.includes('/safety')) return 'safety';
    if (path.includes('/monitoring')) return 'monitoring';
    return 'dashboard';
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case 'dashboard':
        navigate('/admin');
        break;
      case 'experts':
        navigate('/admin/experts');
        break;
      case 'content':
        navigate('/admin/content');
        break;
      case 'safety':
        navigate('/admin/safety');
        break;
      case 'monitoring':
        navigate('/admin/monitoring');
        break;
      default:
        navigate('/admin');
    }
  };

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex items-center justify-center mb-8">
          <Shield className="h-8 w-8 text-veilo-purple mr-2" />
          <h1 className="text-3xl font-bold text-veilo-purple-dark">Admin Panel</h1>
        </div>

        <Card className="mb-8">
          <div className="p-4">
            <Tabs 
              value={getCurrentTab()} 
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="experts">Expert Verification</TabsTrigger>
                <TabsTrigger value="content">Content Moderation</TabsTrigger>
                <TabsTrigger value="safety">User Safety</TabsTrigger>
                <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </Card>

        <Routes>
          <Route path="/" element={<EnhancedAdminDashboard />} />
          <Route path="/experts" element={<FlagshipExpertManagement />} />
          <Route path="/content" element={<ContentModeration />} />
          <Route path="/safety" element={<UserSafetyMonitor />} />
          <Route path="/monitoring" element={<RealTimePlatformMonitor />} />
        </Routes>
      </div>
    </Layout>
  );
};

export default AdminPanel;
