
import { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AdminApi } from '@/services/api';
import { Expert, Post, UserRole } from '@/types';
import { useUserContext } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import AdminLogin from '@/components/admin/AdminLogin';
import ExpertVerification from '@/components/admin/ExpertVerification';
import ContentModeration from '@/components/admin/ContentModeration';
import AdminDashboard from '@/components/admin/AdminDashboard';
import UserSafetyMonitor from '@/components/admin/UserSafetyMonitor';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';

const AdminPanel = () => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(user?.role === UserRole.ADMIN);

  if (!isAdmin) {
    return <AdminLogin onLoginSuccess={() => setIsAdmin(true)} />;
  }

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/experts')) return 'experts';
    if (path.includes('/content')) return 'content';
    if (path.includes('/safety')) return 'safety';
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
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="experts">Expert Verification</TabsTrigger>
                <TabsTrigger value="content">Content Moderation</TabsTrigger>
                <TabsTrigger value="safety">User Safety</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </Card>

        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/experts" element={<ExpertVerification />} />
          <Route path="/content" element={<ContentModeration />} />
          <Route path="/safety" element={<UserSafetyMonitor />} />
        </Routes>
      </div>
    </Layout>
  );
};

export default AdminPanel;
