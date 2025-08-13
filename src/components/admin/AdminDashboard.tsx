import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExpertAnalytics from './ExpertAnalytics';
import PlatformAnalytics from './PlatformAnalytics';
import { 
  Users, 
  UserCheck, 
  MessageSquare, 
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Shield,
  Activity,
  BarChart3,
  PieChart
} from 'lucide-react';

const AdminDashboard = () => {
  // In a real application, this would come from an API
  const dashboardData = {
    totalExperts: 56,
    pendingExperts: 3,
    totalPosts: 427,
    flaggedPosts: 3,
    activeUsers: 215,
    sessionsToday: 18,
    totalSessions: 892,
    topTopics: [
      { name: 'Relationships', count: 82 },
      { name: 'MentalHealth', count: 68 },
      { name: 'Faith', count: 54 },
      { name: 'Family', count: 47 },
      { name: 'Career', count: 32 },
    ],
    alertedContent: [
      { type: 'self_harm', count: 2 },
      { type: 'abuse', count: 1 },
      { type: 'hate_speech', count: 0 },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Badge variant="outline" className="px-3 py-1">
          Real-time
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platform">Platform Analytics</TabsTrigger>
          <TabsTrigger value="experts">Expert Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Experts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.totalExperts}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.pendingExperts} pending approval
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  +18% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.totalPosts}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.flaggedPosts} flagged for review
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Sessions Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.totalSessions}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.sessionsToday} today
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platform">
          <PlatformAnalytics />
        </TabsContent>

        <TabsContent value="experts">
          <ExpertAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;