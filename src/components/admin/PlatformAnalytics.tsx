import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AnalyticsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  DollarSign, 
  Activity,
  AlertTriangle,
  Shield,
  Server,
  Clock,
  Zap
} from 'lucide-react';

interface PlatformAnalytics {
  overview: {
    totalUsers: number;
    totalExperts: number;
    verifiedExperts: number;
    totalSessions: number;
    totalRevenue: number;
    averageRating: number;
    completionRate: number;
  };
  healthMetrics: any[];
  timeframe: string;
}

const PlatformAnalytics = () => {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [timeframe, setTimeframe] = useState('30d');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlatformAnalytics();
  }, [timeframe]);

  const fetchPlatformAnalytics = async () => {
    try {
      setLoading(true);
      const response = await AnalyticsApi.getPlatformAnalytics(timeframe);
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch platform analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = (value: number, type: string) => {
    switch (type) {
      case 'errorRate':
        if (value < 1) return { status: 'excellent', color: 'bg-green-500' };
        if (value < 5) return { status: 'good', color: 'bg-yellow-500' };
        return { status: 'poor', color: 'bg-red-500' };
      case 'responseTime':
        if (value < 200) return { status: 'excellent', color: 'bg-green-500' };
        if (value < 500) return { status: 'good', color: 'bg-yellow-500' };
        return { status: 'poor', color: 'bg-red-500' };
      case 'serverLoad':
        if (value < 70) return { status: 'excellent', color: 'bg-green-500' };
        if (value < 85) return { status: 'good', color: 'bg-yellow-500' };
        return { status: 'poor', color: 'bg-red-500' };
      default:
        return { status: 'unknown', color: 'bg-gray-500' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) return null;

  const latestHealth = analytics.healthMetrics[0] || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Platform Analytics</h2>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Platform Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.totalExperts} experts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Experts</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.verifiedExperts}</div>
            <Progress 
              value={(analytics.overview.verifiedExperts / analytics.overview.totalExperts) * 100} 
              className="h-2 mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.overview.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.totalSessions} sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.averageRating.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.completionRate.toFixed(1)}% completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Health */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Load</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestHealth.serverLoad || 0}%</div>
            <Progress 
              value={latestHealth.serverLoad || 0} 
              className={`h-2 mt-2 ${getHealthStatus(latestHealth.serverLoad || 0, 'serverLoad').color}`}
            />
            <Badge 
              variant={getHealthStatus(latestHealth.serverLoad || 0, 'serverLoad').status === 'excellent' ? 'default' : 'destructive'}
              className="mt-2"
            >
              {getHealthStatus(latestHealth.serverLoad || 0, 'serverLoad').status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestHealth.responseTime || 0}ms</div>
            <Badge 
              variant={getHealthStatus(latestHealth.responseTime || 0, 'responseTime').status === 'excellent' ? 'default' : 'destructive'}
              className="mt-2"
            >
              {getHealthStatus(latestHealth.responseTime || 0, 'responseTime').status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestHealth.errorRate || 0}%</div>
            <Badge 
              variant={getHealthStatus(latestHealth.errorRate || 0, 'errorRate').status === 'excellent' ? 'default' : 'destructive'}
              className="mt-2"
            >
              {getHealthStatus(latestHealth.errorRate || 0, 'errorRate').status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Content Safety */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Content Safety & Moderation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Active Users</span>
                <span className="text-sm text-muted-foreground">{latestHealth.activeUsers || 0}</span>
              </div>
              <Progress value={Math.min((latestHealth.activeUsers || 0) / 100 * 100, 100)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Flagged Content</span>
                <span className="text-sm text-muted-foreground">{latestHealth.flaggedContent || 0}</span>
              </div>
              <Progress value={Math.min((latestHealth.flaggedContent || 0) / 10 * 100, 100)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Moderated Content</span>
                <span className="text-sm text-muted-foreground">{latestHealth.moderatedContent || 0}</span>
              </div>
              <Progress value={Math.min((latestHealth.moderatedContent || 0) / 10 * 100, 100)} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Real-time Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span className="font-medium">Active Sessions</span>
              </div>
              <span className="text-2xl font-bold">{latestHealth.activeSessions || 0}</span>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Online Users</span>
              </div>
              <span className="text-2xl font-bold">{latestHealth.activeUsers || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformAnalytics;