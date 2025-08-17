import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity,
  AlertTriangle,
  Shield,
  Users,
  Clock,
  Eye,
  TrendingUp,
  RefreshCw,
  Zap,
  Heart,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const RealTimePlatformMonitor = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sanctuary sessions monitoring
  const { data: sanctuaryData, refetch: refetchSanctuary } = useQuery({
    queryKey: ['sanctuaryMonitoring'],
    queryFn: async () => {
      const response = await fetch('/api/admin/monitoring/sanctuary-sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch sanctuary data');
      const data = await response.json();
      return data.data;
    },
    refetchInterval: autoRefresh ? 5000 : false, // 5 second refresh
  });

  // Crisis detection monitoring
  const { data: crisisData, refetch: refetchCrisis } = useQuery({
    queryKey: ['crisisMonitoring'],
    queryFn: async () => {
      const response = await fetch('/api/admin/monitoring/crisis-detection', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch crisis data');
      const data = await response.json();
      return data.data;
    },
    refetchInterval: autoRefresh ? 3000 : false, // 3 second refresh for critical data
  });

  // Content moderation monitoring
  const { data: moderationData, refetch: refetchModeration } = useQuery({
    queryKey: ['moderationQueue'],
    queryFn: async () => {
      const response = await fetch('/api/admin/moderation/queue', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch moderation data');
      const data = await response.json();
      return data.data;
    },
    refetchInterval: autoRefresh ? 10000 : false, // 10 second refresh
  });

  const handleManualRefresh = () => {
    refetchSanctuary();
    refetchCrisis();
    refetchModeration();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'paused':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'ended':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Platform Monitor</h2>
          <p className="text-muted-foreground">
            Live monitoring of sanctuary sessions, crisis detection, and content moderation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn(
              "border-green-200 bg-green-50 text-green-700",
              autoRefresh && "animate-pulse"
            )}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            {autoRefresh ? 'Live' : 'Paused'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Alerts */}
      {crisisData?.activeAlerts && crisisData.activeAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Active Crisis Alerts ({crisisData.activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {crisisData.activeAlerts.map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex items-center gap-3">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <div>
                      <div className="font-medium">{alert.category.replace('_', ' ').toUpperCase()}</div>
                      <div className="text-sm text-muted-foreground">
                        Session: {alert.sessionId} • {format(new Date(alert.detectedAt), 'HH:mm:ss')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-right">
                      <div className="font-medium">AI: {(alert.aiConfidence * 100).toFixed(0)}%</div>
                      {alert.assignedExpert && (
                        <div className="text-xs text-muted-foreground">{alert.assignedExpert}</div>
                      )}
                    </div>
                    <Button size="sm" variant="destructive">
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="sanctuary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sanctuary">Live Sessions</TabsTrigger>
          <TabsTrigger value="crisis">Crisis Detection</TabsTrigger>
          <TabsTrigger value="moderation">Content Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="sanctuary" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sanctuaryData?.totalActive || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Avg. {sanctuaryData?.metrics?.averageParticipants || 0} participants
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sanctuaryData?.metrics?.totalSubmissions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {sanctuaryData?.metrics?.moderationFlags || 0} flagged for review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Crisis Alerts</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{sanctuaryData?.metrics?.crisisAlerts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Active Sessions List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Sanctuary Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {sanctuaryData?.activeSessions?.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <Badge variant="outline" className={getSessionStatusColor(session.status)}>
                            {session.status.toUpperCase()}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {session.type.replace('-', ' ').toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{session.host}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.participantCount} participants • 
                            {session.submissionCount} submissions
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Duration: {Math.floor(session.duration / 60)}m {session.duration % 60}s
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={getSeverityColor(session.riskLevel)}
                        >
                          {session.riskLevel.toUpperCase()} RISK
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Monitor
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crisis" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Today's Alerts</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crisisData?.metrics?.totalToday || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {crisisData?.metrics?.resolved || 0} resolved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crisisData?.metrics?.averageResponseTime || 0}m</div>
                <p className="text-xs text-muted-foreground">
                  Average response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Escalated</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crisisData?.metrics?.escalated || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Require specialist intervention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {crisisData?.metrics ? 
                    Math.round(((crisisData.metrics.totalToday - crisisData.metrics.falsePositives) / crisisData.metrics.totalToday) * 100) || 0
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  AI detection accuracy
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Crisis Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {crisisData?.recentAlerts?.map((alert: any) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded">
                      <div className="flex items-center gap-4">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <div>
                          <div className="font-medium">{alert.category.replace('_', ' ').toUpperCase()}</div>
                          <div className="text-sm text-muted-foreground">{alert.content}</div>
                          <div className="text-xs text-muted-foreground">
                            Session: {alert.sessionId} • {format(new Date(alert.detectedAt), 'MMM dd, HH:mm')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={alert.status === 'resolved' ? 'default' : 'destructive'}>
                          {alert.status.toUpperCase()}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          AI: {(alert.aiConfidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Queue Total</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{moderationData?.summary?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Items awaiting review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{moderationData?.summary?.highPriority || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Urgent attention needed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Auto-Resolved</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{moderationData?.summary?.autoResolved || 0}</div>
                <p className="text-xs text-muted-foreground">
                  By AI moderation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{moderationData?.summary?.pendingReview || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Manual review required
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Content Moderation Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {moderationData?.queue?.slice(0, 10).map((item: any) => (
                    <div key={item._id} className="flex items-center justify-between p-4 border rounded">
                      <div className="flex-1">
                        <div className="font-medium truncate">{item.content?.substring(0, 100)}...</div>
                        <div className="text-sm text-muted-foreground">
                          By {item.author?.name || 'Anonymous'} • {format(new Date(item.createdAt), 'MMM dd, HH:mm')}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {item.aiModeration?.categories?.map((cat: string) => (
                            <Badge key={cat} variant="outline" className="text-xs">
                              {cat.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-medium">
                          AI: {(item.aiModeration?.confidence * 100).toFixed(0)}%
                        </div>
                        <Badge 
                          variant="outline" 
                          className={item.aiModeration?.confidence > 0.8 ? 'border-red-200 text-red-700' : 'border-yellow-200 text-yellow-700'}
                        >
                          {item.aiModeration?.recommendation?.replace('_', ' ')}
                        </Badge>
                        <div className="mt-2">
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimePlatformMonitor;