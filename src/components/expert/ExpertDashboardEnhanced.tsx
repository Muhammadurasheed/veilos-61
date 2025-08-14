import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/useApi';
import {
  DollarSign,
  Clock,
  Star,
  TrendingUp,
  Calendar,
  MessageSquare,
  Video,
  Phone,
  AlertTriangle,
  Award,
  Target,
  BarChart3,
  Wallet,
  CreditCard,
  ArrowUpRight,
  Users,
  Zap
} from 'lucide-react';

interface EarningsData {
  balance: {
    available: number;
    pending: number;
    lifetime: number;
  };
  statistics: {
    totalConsultations: number;
    averageRating: number;
    totalMinutes: number;
    responseTime: number;
    completionRate: number;
  };
  monthlyStats: Array<{
    month: string;
    earnings: number;
    consultations: number;
    minutes: number;
    averageRating: number;
  }>;
  payout: {
    method: string;
    schedule: string;
    minimumAmount: number;
    hasStripeAccount: boolean;
  };
}

interface Consultation {
  id: string;
  type: 'chat' | 'voice' | 'video' | 'emergency';
  duration: number;
  pricing: {
    totalAmount: number;
    currency: string;
  };
  session: {
    status: string;
    scheduledAt: string;
    actualDuration?: number;
  };
  client: {
    alias: string;
    avatarIndex: number;
  };
  content: {
    topic?: string;
    urgencyLevel: string;
  };
  rating?: {
    clientRating?: number;
  };
}

const ExpertDashboardEnhanced: React.FC = () => {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const { toast } = useToast();
  const earningsApi = useApi<EarningsData>();
  const consultationsApi = useApi<{ consultations: Consultation[] }>();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [earningsData, consultationsData] = await Promise.all([
        earningsApi.execute(() => 
          fetch('/api/stripe/earnings', {
            headers: { 'x-auth-token': localStorage.getItem('token') || '' }
          }).then(res => res.json())
        ),
        consultationsApi.execute(() =>
          fetch('/api/consultations?limit=10', {
            headers: { 'x-auth-token': localStorage.getItem('token') || '' }
          }).then(res => res.json())
        )
      ]);

      if (earningsData) setEarnings(earningsData);
      if (consultationsData) setConsultations(consultationsData.consultations);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getConsultationTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'voice': return <Phone className="h-4 w-4" />;
      case 'emergency': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'emergency': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  if (!earnings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expert Dashboard</h1>
          <p className="text-muted-foreground">
            Track your consultations, earnings, and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Wallet className="h-4 w-4 mr-2" />
            Request Payout
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(earnings.balance.available)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{formatCurrency(earnings.balance.pending)} pending
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnings.statistics.totalConsultations}</div>
            <p className="text-xs text-muted-foreground">
              {earnings.statistics.totalMinutes} total minutes
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {earnings.statistics.averageRating.toFixed(1)}
              <Star className="h-5 w-5 fill-current text-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              {earnings.statistics.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(earnings.balance.lifetime)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg {earnings.statistics.responseTime}min response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="consultations">Consultations</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Consultations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {consultations.slice(0, 5).map((consultation) => (
                  <div key={consultation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`/avatars/avatar-${consultation.client.avatarIndex}.svg`} />
                        <AvatarFallback>{consultation.client.alias[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{consultation.client.alias}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getConsultationTypeIcon(consultation.type)}
                          <span>{consultation.duration}min</span>
                          <div className={`w-2 h-2 rounded-full ${getUrgencyColor(consultation.content.urgencyLevel)}`} />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(consultation.pricing.totalAmount)}</p>
                      <Badge variant={consultation.session.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {consultation.session.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm text-muted-foreground">{earnings.statistics.completionRate}%</span>
                  </div>
                  <Progress value={earnings.statistics.completionRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Average Rating</span>
                    <span className="text-sm text-muted-foreground">{earnings.statistics.averageRating.toFixed(1)}/5.0</span>
                  </div>
                  <Progress value={(earnings.statistics.averageRating / 5) * 100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm text-muted-foreground">{earnings.statistics.responseTime}min avg</span>
                  </div>
                  <Progress value={Math.max(0, 100 - (earnings.statistics.responseTime * 2))} className="h-2" />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Expert Level: </span>
                    <Badge variant="secondary">
                      {earnings.statistics.totalConsultations > 100 ? 'Master' :
                       earnings.statistics.totalConsultations > 50 ? 'Advanced' :
                       earnings.statistics.totalConsultations > 10 ? 'Intermediate' : 'Beginner'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consultations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Consultations</CardTitle>
              <CardDescription>Manage and track your consultation sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consultations.map((consultation) => (
                  <div key={consultation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={`/avatars/avatar-${consultation.client.avatarIndex}.svg`} />
                        <AvatarFallback>{consultation.client.alias[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{consultation.client.alias}</p>
                        <p className="text-sm text-muted-foreground">{consultation.content.topic || 'General consultation'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getConsultationTypeIcon(consultation.type)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(consultation.session.scheduledAt).toLocaleDateString()} • {consultation.duration}min
                          </span>
                          <div className={`w-2 h-2 rounded-full ${getUrgencyColor(consultation.content.urgencyLevel)}`} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(consultation.pricing.totalAmount)}</p>
                        {consultation.rating?.clientRating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current text-yellow-500" />
                            <span className="text-xs">{consultation.rating.clientRating}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant={consultation.session.status === 'completed' ? 'default' : 'secondary'}>
                        {consultation.session.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Monthly Earnings Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {earnings.monthlyStats.slice(-6).map((month) => (
                    <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{month.month}</p>
                        <p className="text-sm text-muted-foreground">{month.consultations} consultations</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(month.earnings)}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                          <span className="text-sm">{month.averageRating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payout Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Available Balance</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(earnings.balance.available)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Pending Balance</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {formatCurrency(earnings.balance.pending)}
                  </p>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm font-medium">Payout Method</p>
                  <Badge variant="outline">{earnings.payout.method.replace('_', ' ')}</Badge>
                  
                  <p className="text-sm font-medium">Schedule</p>
                  <Badge variant="outline">{earnings.payout.schedule}</Badge>
                  
                  <p className="text-xs text-muted-foreground">
                    Minimum payout: {formatCurrency(earnings.payout.minimumAmount)}
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  disabled={earnings.balance.available < earnings.payout.minimumAmount}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Request Payout
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Analytics
              </CardTitle>
              <CardDescription>
                Detailed insights into your consultation performance and growth opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Consultation Types</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Chat</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Voice</span>
                      <span className="text-sm font-medium">30%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Video</span>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Emergency</span>
                      <span className="text-sm font-medium">5%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Peak Hours</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">9AM - 12PM</span>
                      <span className="text-sm font-medium">35%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">2PM - 5PM</span>
                      <span className="text-sm font-medium">40%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">7PM - 10PM</span>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Client Retention</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">New Clients</span>
                      <span className="text-sm font-medium">60%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Returning</span>
                      <span className="text-sm font-medium">40%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpertDashboardEnhanced;