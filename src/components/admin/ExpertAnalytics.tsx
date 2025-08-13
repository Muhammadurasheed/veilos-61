import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { AnalyticsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Clock, 
  Star, 
  DollarSign, 
  Users, 
  CheckCircle,
  Award,
  Activity
} from 'lucide-react';

interface ExpertAnalytics {
  expertId: string;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  averageRating: number;
  totalRevenue: number;
  averageResponseTime: number;
  totalHours: number;
  sessionMetrics: any[];
  timeframe: string;
}

interface ExpertAnalyticsProps {
  expertId?: string;
}

const ExpertAnalytics = ({ expertId }: ExpertAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<ExpertAnalytics | null>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('30d');
  const [sortBy, setSortBy] = useState('rating');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (expertId) {
      fetchExpertAnalytics();
    } else {
      fetchRankings();
    }
  }, [expertId, timeframe, sortBy]);

  const fetchExpertAnalytics = async () => {
    try {
      setLoading(true);
      const response = await AnalyticsApi.getExpertAnalytics(expertId!, timeframe);
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch expert analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const response = await AnalyticsApi.getExpertRankings(sortBy, 20);
      if (response.success) {
        setRankings(response.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch expert rankings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (expertId && analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Expert Analytics</h2>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.completedSessions} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</div>
              <div className="flex items-center mt-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(analytics.averageRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.totalRevenue}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalHours.toFixed(1)} hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageResponseTime.toFixed(1)}s</div>
              <p className="text-xs text-muted-foreground">
                Average response
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm text-muted-foreground">{analytics.completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={analytics.completionRate} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Rating Score</span>
                <span className="text-sm text-muted-foreground">{((analytics.averageRating / 5) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(analytics.averageRating / 5) * 100} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{analytics.completedSessions} Sessions Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm">{analytics.totalHours.toFixed(1)} Total Hours</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.sessionMetrics.slice(0, 10).map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      {new Date(session.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{session.duration} min</TableCell>
                    <TableCell>
                      {session.satisfactionScore ? (
                        <div className="flex items-center">
                          {session.satisfactionScore}
                          <Star className="h-3 w-3 ml-1 text-yellow-400 fill-current" />
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>${session.revenue}</TableCell>
                    <TableCell>
                      <Badge variant={session.completed ? 'default' : 'secondary'}>
                        {session.completed ? 'Completed' : 'Incomplete'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expert Rankings View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Expert Rankings</h2>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">By Rating</SelectItem>
            <SelectItem value="revenue">By Revenue</SelectItem>
            <SelectItem value="sessions">By Sessions</SelectItem>
            <SelectItem value="responseTime">By Response Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Top Performing Experts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Expert</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Response Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.map((expert, index) => (
                <TableRow key={expert.id}>
                  <TableCell>
                    <Badge variant={index < 3 ? 'default' : 'secondary'}>
                      #{index + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {expert.expertId?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {expert.expertId?.specialization || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {expert.averageRating.toFixed(1)}
                      <Star className="h-3 w-3 ml-1 text-yellow-400 fill-current" />
                    </div>
                  </TableCell>
                  <TableCell>{expert.totalSessions}</TableCell>
                  <TableCell>${expert.totalRevenue}</TableCell>
                  <TableCell>{expert.averageResponseTime.toFixed(1)}s</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpertAnalytics;