import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  MessageCircle, 
  Clock, 
  Plus,
  Eye,
  Trash2,
  Copy,
  Calendar,
  Users,
  Archive,
  TrendingUp,
  Activity,
  Timer,
  Target,
  RefreshCw,
  Settings,
  Share2,
  BarChart3,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';

interface EnhancedSanctuary {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  mode: 'anon-inbox' | 'live-audio' | 'text-room';
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
  submissionCount: number;
  participantCount: number;
  uniqueParticipants: number;
  recentActivity: number;
  lastActivity: string;
  timeRemaining: number;
  engagementScore: number;
  averageMessageLength: number;
  hostToken?: string;
  status: 'active' | 'expiring_soon' | 'expired';
}

interface SanctuaryAnalytics {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  totalMessages: number;
  totalParticipants: number;
  averageEngagement: number;
  mostActiveSession: EnhancedSanctuary | null;
}

const MySanctuariesEnhanced = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sanctuaries, setSanctuaries] = useState<EnhancedSanctuary[]>([]);
  const [analytics, setAnalytics] = useState<SanctuaryAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Load sanctuaries with enhanced analytics
  const loadSanctuaries = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Collect host tokens from localStorage
      const hostTokens: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('sanctuary-host-') && !key.endsWith('-expires')) {
          const hostToken = localStorage.getItem(key);
          if (hostToken) {
            // Verify token hasn't expired
            const expiryKey = `${key}-expires`;
            const expiryTime = localStorage.getItem(expiryKey);
            if (expiryTime && new Date(expiryTime) > new Date()) {
              hostTokens.push(hostToken);
            } else {
              // Clean up expired token
              localStorage.removeItem(key);
              localStorage.removeItem(expiryKey);
            }
          }
        }
      }

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 
                     (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api');
      
      const params = new URLSearchParams();
      if (hostTokens.length > 0) {
        params.append('hostTokens', hostTokens.join(','));
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include auth token if available
      const authToken = localStorage.getItem('token');
      if (authToken) {
        headers['x-auth-token'] = authToken;
      }

      const response = await fetch(`${apiUrl}/host-recovery/my-sanctuaries?${params.toString()}`, {
        headers
      });

      const data = await response.json();
      
      if (data.success) {
        setSanctuaries(data.data || []);
        setAnalytics(data.analytics || null);
      } else {
        throw new Error(data.error || 'Failed to load sanctuaries');
      }
    } catch (err) {
      console.error('Error fetching sanctuaries:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to server';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Failed to Load Sanctuaries',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSanctuaries();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadSanctuaries(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadSanctuaries]);

  const handleViewInbox = (sanctuary: EnhancedSanctuary) => {
    // Update last accessed time
    localStorage.setItem(`sanctuary-last-accessed-${sanctuary.id}`, new Date().toISOString());
    navigate(`/sanctuary/inbox/${sanctuary.id}`);
  };

  const handleCopyShareLink = (sanctuaryId: string) => {
    const shareUrl = `${window.location.origin}/sanctuary/submit/${sanctuaryId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Share Link Copied!",
      description: "The sanctuary submission link has been copied to your clipboard.",
    });
  };

  const handleRemoveSanctuary = (sanctuaryId: string) => {
    // Remove from localStorage
    localStorage.removeItem(`sanctuary-host-${sanctuaryId}`);
    localStorage.removeItem(`sanctuary-host-${sanctuaryId}-expires`);
    localStorage.removeItem(`sanctuary-last-accessed-${sanctuaryId}`);
    
    // Update state
    setSanctuaries(prev => prev.filter(s => s.id !== sanctuaryId));
    
    toast({
      title: "Sanctuary Removed",
      description: "The sanctuary has been removed from your dashboard.",
    });
  };

  const getFilteredSanctuaries = () => {
    switch (activeTab) {
      case 'active':
        return sanctuaries.filter(s => s.status === 'active');
      case 'expiring':
        return sanctuaries.filter(s => s.status === 'expiring_soon');
      case 'expired':
        return sanctuaries.filter(s => s.status === 'expired');
      default:
        return sanctuaries;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'expiring_soon': return 'text-yellow-600';
      case 'expired': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeRemaining = (minutes: number, status: string) => {
    if (status === 'expired') return 'Expired';
    if (minutes <= 0) return 'Expired';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  const filteredSanctuaries = getFilteredSanctuaries();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-muted rounded"></div>
                  <div>
                    <div className="w-32 h-6 bg-muted rounded mb-2"></div>
                    <div className="w-48 h-4 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-20 h-9 bg-muted rounded"></div>
                  <div className="w-24 h-9 bg-muted rounded"></div>
                </div>
              </div>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="w-16 h-4 bg-muted rounded mb-2"></div>
                  <div className="w-8 h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="flex items-center gap-2">
                  My Sanctuaries
                  {refreshing && <RefreshCw className="h-4 w-4 animate-spin" />}
                </CardTitle>
                <CardDescription>
                  Flagship sanctuary management dashboard with advanced analytics
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => loadSanctuaries(true)}
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                Refresh
              </Button>
              
              <Button asChild size="sm">
                <Link to="/sanctuary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Analytics Dashboard */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Active Sanctuaries</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total Messages</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.totalMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Participants</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics.totalParticipants}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Avg Engagement</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics.averageEngagement}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sanctuaries Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Archive className="h-3 w-3" />
                All ({sanctuaries.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                Active ({analytics?.active || 0})
              </TabsTrigger>
              <TabsTrigger value="expiring" className="flex items-center gap-2">
                <Timer className="h-3 w-3" />
                Expiring ({analytics?.expiringSoon || 0})
              </TabsTrigger>
              <TabsTrigger value="expired" className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Expired ({analytics?.expired || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredSanctuaries.length > 0 ? (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4 pr-4">
                    {filteredSanctuaries.map((sanctuary) => (
                      <Card 
                        key={sanctuary.id}
                        className={cn(
                          "transition-all hover:shadow-md",
                          sanctuary.status === 'expired' && "opacity-70"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              {sanctuary.emoji && (
                                <span className="text-2xl">{sanctuary.emoji}</span>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-medium truncate">{sanctuary.topic}</h3>
                                  <Badge 
                                    variant={sanctuary.mode === 'live-audio' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {sanctuary.mode === 'live-audio' ? 'Live Audio' : 'Anonymous Inbox'}
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className={cn("text-xs", getStatusColor(sanctuary.status))}
                                  >
                                    {sanctuary.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                
                                {sanctuary.description && (
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                    {sanctuary.description}
                                  </p>
                                )}
                                
                                {/* Progress Bar for Time Remaining */}
                                {sanctuary.status !== 'expired' && (
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                      <span>Time Remaining</span>
                                      <span>{formatTimeRemaining(sanctuary.timeRemaining, sanctuary.status)}</span>
                                    </div>
                                    <Progress 
                                      value={sanctuary.status === 'expiring_soon' ? 
                                        Math.max(10, (sanctuary.timeRemaining / 60) * 100) : 
                                        sanctuary.timeRemaining > 1440 ? 100 : (sanctuary.timeRemaining / 1440) * 100
                                      }
                                      className="h-2"
                                    />
                                  </div>
                                )}
                                
                                {/* Enhanced Metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <MessageCircle className="h-3 w-3" />
                                    <span>{sanctuary.submissionCount} messages</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{sanctuary.uniqueParticipants} unique</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Activity className="h-3 w-3" />
                                    <span>{sanctuary.recentActivity} recent</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    <span>{sanctuary.engagementScore} score</span>
                                  </div>
                                </div>
                                
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <span>Created {formatDistanceToNow(new Date(sanctuary.createdAt), { addSuffix: true })}</span>
                                  {sanctuary.lastActivity && (
                                    <span className="ml-3">
                                      Last activity {formatDistanceToNow(new Date(sanctuary.lastActivity), { addSuffix: true })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {sanctuary.status !== 'expired' && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleViewInbox(sanctuary)}
                                    className="flex items-center gap-1"
                                  >
                                    <Eye className="h-3 w-3" />
                                    Inbox
                                    {sanctuary.submissionCount > 0 && (
                                      <Badge variant="secondary" className="ml-1 px-1">
                                        {sanctuary.submissionCount}
                                      </Badge>
                                    )}
                                  </Button>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopyShareLink(sanctuary.id)}
                                  >
                                    <Share2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Sanctuary</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Remove this sanctuary from your dashboard? This won't delete the sanctuary itself.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleRemoveSanctuary(sanctuary.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">
                      {activeTab === 'active' ? 'No active sanctuaries' : 
                       activeTab === 'expiring' ? 'No expiring sanctuaries' :
                       activeTab === 'expired' ? 'No expired sanctuaries' : 'No sanctuaries yet'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {activeTab === 'all' ? 
                        'Create your first sanctuary to start collecting anonymous feedback' :
                        `No sanctuaries in the ${activeTab} category`
                      }
                    </p>
                    {activeTab === 'all' && (
                      <Button asChild>
                        <Link to="/sanctuary">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Sanctuary
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Most Active Session Highlight */}
      {analytics?.mostActiveSession && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Zap className="h-5 w-5" />
              Most Active Sanctuary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {analytics.mostActiveSession.emoji && (
                  <span className="text-xl">{analytics.mostActiveSession.emoji}</span>
                )}
                <div>
                  <h4 className="font-medium">{analytics.mostActiveSession.topic}</h4>
                  <p className="text-sm text-muted-foreground">
                    {analytics.mostActiveSession.submissionCount} messages • 
                    {analytics.mostActiveSession.uniqueParticipants} participants • 
                    Score: {analytics.mostActiveSession.engagementScore}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => handleViewInbox(analytics.mostActiveSession!)}
                size="sm"
              >
                <Eye className="h-3 w-3 mr-1" />
                View Inbox
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MySanctuariesEnhanced;