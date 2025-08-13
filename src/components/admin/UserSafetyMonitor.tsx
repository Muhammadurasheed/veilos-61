import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AdminApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Ban, 
  CheckCircle, 
  Clock,
  Flag,
  User,
  MessageSquare
} from 'lucide-react';

interface SafetyAlert {
  id: string;
  type: 'content' | 'behavior' | 'report';
  severity: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  userId: string;
  userName: string;
  timestamp: Date;
  status: 'open' | 'investigating' | 'resolved';
  details: any;
}

const UserSafetyMonitor = () => {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSafetyAlerts();
  }, []);

  const fetchSafetyAlerts = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockAlerts: SafetyAlert[] = [
        {
          id: 'alert-1',
          type: 'content',
          severity: 'high',
          description: 'Inappropriate content detected in post',
          userId: 'user-123',
          userName: 'Anonymous User',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'open',
          details: { postId: 'post-456', aiConfidence: 0.92 }
        },
        {
          id: 'alert-2',
          type: 'behavior',
          severity: 'medium',
          description: 'Multiple users reported harassment',
          userId: 'user-789',
          userName: 'Anonymous Expert',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          status: 'investigating',
          details: { reportCount: 3, sessionIds: ['session-1', 'session-2'] }
        },
        {
          id: 'alert-3',
          type: 'report',
          severity: 'urgent',
          description: 'Self-harm indication detected',
          userId: 'user-456',
          userName: 'Anonymous Shadow',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          status: 'open',
          details: { keywords: ['self-harm', 'suicide'], aiConfidence: 0.98 }
        },
        {
          id: 'alert-4',
          type: 'content',
          severity: 'low',
          description: 'Mild inappropriate language',
          userId: 'user-321',
          userName: 'Anonymous Beacon',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'resolved',
          details: { messageId: 'msg-789', moderatorAction: 'warning_sent' }
        }
      ];
      setAlerts(mockAlerts);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch safety alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (alertId: string, newStatus: string) => {
    try {
      // Update alert status - replace with actual API call
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: newStatus as any } : alert
      ));
      
      toast({
        title: "Alert Updated",
        description: `Alert status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update alert status",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'investigating': return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content': return <MessageSquare className="h-4 w-4" />;
      case 'behavior': return <User className="h-4 w-4" />;
      case 'report': return <Flag className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const severityMatch = filterSeverity === 'all' || alert.severity === filterSeverity;
    const statusMatch = filterStatus === 'all' || alert.status === filterStatus;
    return severityMatch && statusMatch;
  });

  const urgentAlerts = alerts.filter(alert => alert.severity === 'urgent' && alert.status === 'open');
  const openAlerts = alerts.filter(alert => alert.status === 'open');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">User Safety Monitor</h2>
        </div>
        <div className="flex space-x-2">
          {urgentAlerts.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {urgentAlerts.length} Urgent
            </Badge>
          )}
          <Badge variant="outline">
            {openAlerts.length} Open Alerts
          </Badge>
        </div>
      </div>

      {/* Safety Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Alerts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{openAlerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentAlerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {alerts.filter(a => a.status === 'resolved' && 
                new Date(a.timestamp).toDateString() === new Date().toDateString()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Safety Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(alert.type)}
                      <span className="capitalize">{alert.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${getSeverityColor(alert.severity)} text-white border-transparent`}
                    >
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {alert.description}
                  </TableCell>
                  <TableCell>{alert.userName}</TableCell>
                  <TableCell>
                    {new Date(alert.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(alert.status)}
                      <span className="capitalize">{alert.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      
                      {alert.status === 'open' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Investigate
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Update Alert Status</AlertDialogTitle>
                              <AlertDialogDescription>
                                Mark this alert as under investigation?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleStatusUpdate(alert.id, 'investigating')}
                              >
                                Start Investigation
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {alert.status === 'investigating' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Resolve
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Resolve Alert</AlertDialogTitle>
                              <AlertDialogDescription>
                                Mark this alert as resolved?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleStatusUpdate(alert.id, 'resolved')}
                              >
                                Resolve Alert
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSafetyMonitor;