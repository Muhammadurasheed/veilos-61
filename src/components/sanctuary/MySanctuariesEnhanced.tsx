import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  AlertTriangle,
  Mic,
  Search,
  Filter
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
  type?: 'flagship-live' | 'flagship-scheduled' | 'regular';
  scheduledDateTime?: string;
  liveSessionId?: string;
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
  const [activeTab, setActiveTab] = useState<'all' | 'live-audio' | 'anonymous-inbox'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Load sanctuaries with enhanced analytics
  const loadSanctuaries = React.useCallback(async (showRefreshIndicator = false) => {
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
                     (import.meta.env.DEV ? 'http://localhost:3000' : 'http://localhost:3000');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include auth token if available  
      const authToken = localStorage.getItem('veilo-auth-token');
      if (authToken) {
        headers['x-auth-token'] = authToken;
      }

      // Try to get flagship sanctuary sessions first
      let flagshipSessions: EnhancedSanctuary[] = [];
      let flagshipAnalytics = null;
      
      if (authToken) {
        try {
          const flagshipResponse = await fetch(`${apiUrl}/api/flagship-sanctuary/user/sessions`, {
            headers
          });
          
          if (flagshipResponse.ok) {
            const flagshipData = await flagshipResponse.json();
            console.log('🏁 Flagship sessions response:', flagshipData);
            if (flagshipData.success) {
              // Handle both direct array and wrapped data
              if (Array.isArray(flagshipData.data)) {
                flagshipSessions = flagshipData.data;
                flagshipAnalytics = flagshipData.analytics;
              } else if (flagshipData.data && Array.isArray(flagshipData.data.data)) {
                flagshipSessions = flagshipData.data.data;
                flagshipAnalytics = flagshipData.data.analytics;
              } else {
                console.warn('⚠️ Flagship sessions data is not an array:', flagshipData);
                flagshipSessions = [];
              }
            } else {
              console.warn('⚠️ Flagship sessions request failed:', flagshipData.message);
              flagshipSessions = [];
            }
          } else {
            console.warn('⚠️ Flagship sessions request failed:', flagshipResponse.status);
            flagshipSessions = [];
          }
        } catch (flagshipError) {
          console.error('❌ Error fetching flagship sanctuary sessions:', flagshipError);
          flagshipSessions = [];
        }
      }

      // Get regular sanctuary sessions
      let regularSessions: EnhancedSanctuary[] = [];
      let regularAnalytics = null;
      
      if (hostTokens.length > 0) {
        const params = new URLSearchParams();
        params.append('hostTokens', hostTokens.join(','));

        const response = await fetch(`${apiUrl}/api/host-recovery/my-sanctuaries?${params.toString()}`, {
          headers
        });

        const data = await response.json();
        
        if (data.success) {
          regularSessions = data.data || [];
          regularAnalytics = data.analytics;
        }
      }

      // Combine sessions - ensure both are arrays
      const validFlagshipSessions = Array.isArray(flagshipSessions) ? flagshipSessions : [];
      const validRegularSessions = Array.isArray(regularSessions) ? regularSessions : [];
      const allSessions = [...validFlagshipSessions, ...validRegularSessions];
      
      // Combine analytics
      const combinedAnalytics = {
        total: allSessions.length,
        active: allSessions.filter(s => s.status === 'active').length,
        expiringSoon: allSessions.filter(s => s.status === 'expiring_soon').length,
        expired: allSessions.filter(s => s.status === 'expired').length,
        totalMessages: allSessions.reduce((sum, s) => sum + s.submissionCount, 0),
        totalParticipants: allSessions.reduce((sum, s) => sum + s.uniqueParticipants, 0),
        averageEngagement: allSessions.length > 0 ? 
          Math.round(allSessions.reduce((sum, s) => sum + s.engagementScore, 0) / allSessions.length) : 0,
        mostActiveSession: allSessions.length > 0 ? 
          allSessions.reduce((prev, current) => 
            current.participantCount > prev.participantCount ? current : prev
          ) : null
      };
      
      setSanctuaries(allSessions);
      setAnalytics(combinedAnalytics);
      
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

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sanctuaries;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(session => 
        session.topic.toLowerCase().includes(query) ||
        session.description?.toLowerCase().includes(query)
      );
    }

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(session => {
        if (activeTab === 'live-audio') {
          return session.mode === 'live-audio' || session.type?.startsWith('flagship');
        } else if (activeTab === 'anonymous-inbox') {
          return session.mode === 'anon-inbox' || session.type === 'regular';
        }
        return true;
      });
    }

    // Sort sessions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'activity':
          return (b.participantCount || 0) - (a.participantCount || 0);
        case 'status':
          // Active first, then by status priority
          if (a.status !== b.status) {
            const statusOrder = { 'active': 0, 'expiring_soon': 1, 'expired': 2 };
            return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
          }
          return a.topic.localeCompare(b.topic);
        default:
          return 0;
      }
    });

    return filtered;
  }, [sanctuaries, searchQuery, activeTab, sortBy]);

  const handleViewInbox = (sanctuary: EnhancedSanctuary) => {
    // Update last accessed time
    localStorage.setItem(`sanctuary-last-accessed-${sanctuary.id}`, new Date().toISOString());
    
    // Handle different sanctuary types
    if (sanctuary.type === 'flagship-live') {
      navigate(`/flagship-sanctuary/${sanctuary.id}`);
    } else if (sanctuary.type === 'flagship-scheduled') {
      if (sanctuary.liveSessionId) {
        navigate(`/flagship-sanctuary/${sanctuary.liveSessionId}`);
      } else {
        navigate(`/flagship-sanctuary/${sanctuary.id}`);
      }
    } else {
      navigate(`/sanctuary/inbox/${sanctuary.id}`);
    }
  };

  const handleCopyShareLink = (sanctuaryId: string, sanctuary: EnhancedSanctuary) => {
    let shareUrl;
    
    if (sanctuary.type === 'flagship-live' || sanctuary.type === 'flagship-scheduled') {
shareUrl = `${window.location.origin}/flagship-sanctuary/${sanctuaryId}`;
    } else {
      shareUrl = `${window.location.origin}/sanctuary/submit/${sanctuaryId}`;
    }
    
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Share Link Copied!",
      description: "The sanctuary link has been copied to your clipboard.",
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
                  Manage your live audio sessions and anonymous inboxes
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
                  <p className="text-sm font-medium">Active Sessions</p>
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

      {/* Search and Sort Controls */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sanctuaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="activity">Most Active</SelectItem>
            <SelectItem value="status">By Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sanctuaries Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Archive className="h-3 w-3" />
                All ({sanctuaries.length})
              </TabsTrigger>
              <TabsTrigger value="live-audio" className="flex items-center gap-2">
                <Mic className="h-3 w-3" />
                Live Audio ({sanctuaries.filter(s => s.mode === 'live-audio' || s.type?.startsWith('flagship')).length})
              </TabsTrigger>
              <TabsTrigger value="anonymous-inbox" className="flex items-center gap-2">
                <MessageCircle className="h-3 w-3" />
                Anonymous Inbox ({sanctuaries.filter(s => s.mode === 'anon-inbox' || s.type === 'regular').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredAndSortedSessions.length > 0 ? (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {filteredAndSortedSessions.map((sanctuary) => (
                      <SanctuaryCard 
                        key={sanctuary.id} 
                        sanctuary={sanctuary} 
                        onView={() => handleViewInbox(sanctuary)}
                        onCopyLink={() => handleCopyShareLink(sanctuary.id, sanctuary)}
                        onRemove={() => handleRemoveSanctuary(sanctuary.id)}
                        getStatusColor={getStatusColor}
                        formatTimeRemaining={formatTimeRemaining}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchQuery ? 'No matching sanctuaries' : 
                       activeTab === 'all' ? 'No Sanctuaries Yet' :
                       activeTab === 'live-audio' ? 'No Live Audio Sessions' : 'No Anonymous Inboxes'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery ? 'Try adjusting your search terms or filters.' :
                       'Create your first sanctuary to start receiving anonymous feedback or host live audio sessions.'}
                    </p>
                    {!searchQuery && (
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
    </div>
  );
};

// Sanctuary Card Component
const SanctuaryCard = ({ 
  sanctuary, 
  onView, 
  onCopyLink, 
  onRemove, 
  getStatusColor, 
  formatTimeRemaining 
}: {
  sanctuary: EnhancedSanctuary;
  onView: () => void;
  onCopyLink: () => void;
  onRemove: () => void;
  getStatusColor: (status: string) => string;
  formatTimeRemaining: (minutes: number, status: string) => string;
}) => {
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{sanctuary.emoji}</div>
            <div>
              <CardTitle className="text-base font-medium line-clamp-1">
                {sanctuary.topic}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={sanctuary.status === 'active' ? 'default' : 
                          sanctuary.status === 'expiring_soon' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {sanctuary.type?.startsWith('flagship') ? 'Live Audio' : 'Anonymous Inbox'}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", getStatusColor(sanctuary.status))}>
                  {sanctuary.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onCopyLink}>
              <Copy className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Sanctuary</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the sanctuary from your dashboard. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onRemove}>Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span>{sanctuary.submissionCount || 0}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{sanctuary.uniqueParticipants || 0}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span>{sanctuary.engagementScore}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className={getStatusColor(sanctuary.status)}>
              {formatTimeRemaining(sanctuary.timeRemaining, sanctuary.status)}
            </span>
          </div>
        </div>
        
        {sanctuary.description && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {sanctuary.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            Created {formatDistanceToNow(new Date(sanctuary.createdAt), { addSuffix: true })}
          </span>
          
          {sanctuary.scheduledDateTime && (
            <span className="text-xs text-muted-foreground">
              Scheduled: {format(new Date(sanctuary.scheduledDateTime), 'MMM d, h:mm a')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MySanctuariesEnhanced;