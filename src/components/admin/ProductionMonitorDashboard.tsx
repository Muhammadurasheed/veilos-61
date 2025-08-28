import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Activity, AlertTriangle, CheckCircle, TrendingUp, 
  Database, Wifi, Shield, Clock, Users, Zap 
} from 'lucide-react';
import { apiRequest } from '@/services/api';

const ProductionMonitorDashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      const [healthResponse, metricsResponse, alertsResponse] = await Promise.all([
        apiRequest('GET', '/health/detailed'),
        apiRequest('GET', '/metrics'),
        apiRequest('GET', '/alerts')
      ]);

      setHealthData(healthResponse.data);
      setMetrics(metricsResponse.data);
      setAlerts(Array.isArray(alertsResponse.data) ? alertsResponse.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await apiRequest('POST', `/alerts/${alertId}/acknowledge`);
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading monitoring data...</div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Production Monitor</h1>
        <Badge variant={healthData?.status === 'healthy' ? 'default' : 'destructive'}>
          {healthData?.status?.toUpperCase()}
        </Badge>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Active Alerts</h2>
          {alerts.map(alert => (
            <Alert key={alert.id} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between w-full">
                <span>{alert.message}</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => acknowledgeAlert(alert.id)}
                >
                  Acknowledge
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(healthData?.checks?.database?.status)}`} />
              <span className="text-sm">{healthData?.checks?.database?.connection}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {healthData?.checks?.database?.responseTime}ms response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">WebSocket</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthData?.checks?.websocket?.connectedSockets}</div>
            <p className="text-xs text-muted-foreground">Active connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(healthData?.checks?.system?.memory?.process?.rss || 0)}MB
            </div>
            <Progress 
              value={(healthData?.checks?.system?.memory?.process?.heapUsed / healthData?.checks?.system?.memory?.process?.heapTotal) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((healthData?.uptime || 0) / 3600)}h
            </div>
            <p className="text-xs text-muted-foreground">System uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-2xl font-bold">{metrics?.performance?.requests?.lastHour || 0}</div>
              <p className="text-sm text-muted-foreground">Requests (last hour)</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{metrics?.performance?.requests?.averageResponseTime || 0}ms</div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{metrics?.performance?.requests?.errorRate || 0}%</div>
              <p className="text-sm text-muted-foreground">Error Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-2xl font-bold">{metrics?.cache?.size || 0}</div>
              <p className="text-sm text-muted-foreground">Cached Items</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{metrics?.cache?.hitRate || 0}%</div>
              <p className="text-sm text-muted-foreground">Hit Rate</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{metrics?.cache?.memoryUsage || 0}KB</div>
              <p className="text-sm text-muted-foreground">Memory Usage</p>
            </div>
            <div>
              <Progress value={(metrics?.cache?.size / metrics?.cache?.maxSize) * 100} className="mt-2" />
              <p className="text-sm text-muted-foreground">Capacity</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionMonitorDashboard;