import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AnalyticsApi, { SystemHealth, UserSafetyAlert, ContentModerationItem, PlatformAnalytics } from '@/services/analyticsApi';
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
  Server,
  Clock,
  Zap,
  Eye,
  Ban,
  DollarSign,
  Target,
  Bell,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const EnhancedAdminDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Data states
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics | null>(null);
  const [safetyAlerts, setSafetyAlerts] = useState<UserSafetyAlert[]>([]);
  const [moderationQueue, setModerationQueue] = useState<ContentModerationItem[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [growthMetrics, setGrowthMetrics] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [timeframe, autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        healthResponse,
        analyticsResponse,
        alertsResponse,
        moderationResponse,
        revenueResponse,
        growthResponse
      ] = await Promise.all([
        AnalyticsApi.getSystemHealth(),
        AnalyticsApi.getPlatformAnalytics(timeframe),
        AnalyticsApi.getUserSafetyAlerts('pending'),
        AnalyticsApi.getModerationQueue('pending'),
        AnalyticsApi.getRevenueAnalytics(timeframe),
        AnalyticsApi.getGrowthMetrics(timeframe)
      ]);

      if (healthResponse.success) setSystemHealth(healthResponse.data as SystemHealth);
      if (analyticsResponse.success) setPlatformAnalytics(analyticsResponse.data as PlatformAnalytics);
      if (alertsResponse.success) setSafetyAlerts(alertsResponse.data as UserSafetyAlert[]);
      if (moderationResponse.success) setModerationQueue(moderationResponse.data as ContentModerationItem[]);
      if (revenueResponse.success) setRevenueData(revenueResponse.data);
      if (growthResponse.success) setGrowthMetrics(growthResponse.data);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = async (contentId: string, action: 'approve' | 'reject') => {
    try {
      await AnalyticsApi.moderateContent(contentId, action);
      setModerationQueue(prev => prev.filter(item => item.id !== contentId));
      
      toast({
        title: "Success",
        description: `Content ${action}d successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} content`,
        variant: "destructive",
      });
    }
  };

  const handleSafetyAlertUpdate = async (alertId: string, status: 'pending' | 'investigating' | 'resolved' | 'escalated') => {
    try {
      await AnalyticsApi.updateSafetyAlert(alertId, { status });
      setSafetyAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status } : alert
      ));
      
      toast({
        title: "Success",
        description: "Safety alert updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update safety alert",
        variant: "destructive",
      });
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Real-time platform monitoring and control center</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
            
            <Button onClick={fetchDashboardData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Health Alert */}
        {systemHealth && systemHealth.overall !== 'healthy' && (
          <Alert className={`border-l-4 ${systemHealth.overall === 'critical' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              System health status: <span className={`font-semibold ${getHealthStatusColor(systemHealth.overall)}`}>
                {systemHealth.overall.toUpperCase()}
              </span>
              {systemHealth.alerts.length > 0 && ` - ${systemHealth.alerts.length} active alerts`}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="safety">Safety Monitor</TabsTrigger>
            <TabsTrigger value="moderation">Content Queue</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
            <TabsTrigger value="business">Business Intel</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformAnalytics?.overview.totalUsers || 0}</div>
                  <p className="text-xs text-gray-600">Active platform users</p>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Verified Experts</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformAnalytics?.overview.verifiedExperts || 0}</div>
                  <p className="text-xs text-gray-600">
                    of {platformAnalytics?.overview.totalExperts || 0} total experts
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Safety Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{safetyAlerts.length}</div>
                  <p className="text-xs text-gray-600">Pending review</p>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Moderation Queue</CardTitle>
                  <Eye className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{moderationQueue.length}</div>
                  <p className="text-xs text-gray-600">Items to review</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <Shield className="h-6 w-6 mb-2" />
                    Review Safety Alerts
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Eye className="h-6 w-6 mb-2" />
                    Moderate Content
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <UserCheck className="h-6 w-6 mb-2" />
                    Verify Experts
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Platform Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={growthMetrics?.userGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="users" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="experts" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Session Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: platformAnalytics?.overview.completionRate || 0 },
                          { name: 'Incomplete', value: 100 - (platformAnalytics?.overview.completionRate || 0) }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Safety Monitor Tab */}
          <TabsContent value="safety" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  User Safety Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {safetyAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{alert.alertType}</Badge>
                            {alert.aiConfidence && (
                              <Badge variant="secondary">AI: {Math.round(alert.aiConfidence * 100)}%</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-800 mb-1">{alert.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSafetyAlertUpdate(alert.id, 'investigating')}
                          >
                            Investigate
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleSafetyAlertUpdate(alert.id, 'resolved')}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Moderation Tab */}
          <TabsContent value="moderation" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Content Moderation Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {moderationQueue.map((item) => (
                      <div key={item.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{item.contentType}</Badge>
                            <Badge className={getSeverityColor(item.flagReason)}>
                              {item.flagReason}
                            </Badge>
                            {item.aiConfidence && (
                              <Badge variant="secondary">AI: {Math.round(item.aiConfidence * 100)}%</Badge>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleModerationAction(item.id, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleModerationAction(item.id, 'reject')}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-800 mb-2">{item.content}</p>
                        <p className="text-xs text-gray-500">
                          Flagged by {item.flaggedBy} • {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system" className="space-y-6">
            {systemHealth && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Card className="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">CPU Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-2">{systemHealth.metrics.cpuUsage}%</div>
                      <Progress value={systemHealth.metrics.cpuUsage} className="h-2" />
                    </CardContent>
                  </Card>
                  
                  <Card className="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Memory Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-2">{systemHealth.metrics.memoryUsage}%</div>
                      <Progress value={systemHealth.metrics.memoryUsage} className="h-2" />
                    </CardContent>
                  </Card>
                  
                  <Card className="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Response Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemHealth.metrics.responseTime}ms</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Error Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemHealth.metrics.errorRate}%</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle>System Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {systemHealth.alerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <span>{alert.message}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => AnalyticsApi.acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Business Intelligence Tab */}
          <TabsContent value="business" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Revenue Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">
                    ${platformAnalytics?.overview.totalRevenue?.toLocaleString() || 0}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={revenueData?.daily || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Key Performance Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Average Rating</span>
                      <span className="font-bold">{platformAnalytics?.overview.averageRating}/5.0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Session Completion Rate</span>
                      <span className="font-bold">{platformAnalytics?.overview.completionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Expert Verification Rate</span>
                      <span className="font-bold">
                        {platformAnalytics?.overview.totalExperts ? 
                          Math.round((platformAnalytics.overview.verifiedExperts / platformAnalytics.overview.totalExperts) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;