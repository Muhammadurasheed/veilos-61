import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSanctuaryRealtime } from '@/hooks/useSanctuaryRealtime';
import { MessageCircle, Users, Clock, Share2, Settings, Copy, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SanctuarySubmission {
  id: string;
  alias: string;
  message: string;
  timestamp: string;
}

interface SanctuarySession {
  id: string;
  topic: string;
  description: string;
  emoji: string;
  mode: string;
  expiresAt: string;
  createdAt: string;
  submissions: SanctuarySubmission[];
}

export const SanctuaryHostDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SanctuarySession | null>(null);
  const [submissions, setSubmissions] = useState<SanctuarySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get host token from localStorage or URL params
  const hostToken = localStorage.getItem(`sanctuary_host_${id}`) || 
                   new URLSearchParams(window.location.search).get('hostToken');

  const {
    isConnected,
    connectionQuality,
    totalSubmissions,
    markMessageAsRead,
    requestNotificationPermission
  } = useSanctuaryRealtime({
    sanctuaryId: id!,
    hostToken: hostToken || undefined,
    onNewSubmission: (submission) => {
      setSubmissions(prev => [...prev, submission]);
    },
    enableNotifications: true
  });

  useEffect(() => {
    if (!id) {
      navigate('/sanctuary');
      return;
    }

    fetchSanctuarySession();
    requestNotificationPermission();
  }, [id, navigate]);

  useEffect(() => {
    // Store host token for persistence
    if (hostToken && id) {
      localStorage.setItem(`sanctuary_host_${id}`, hostToken);
    }
  }, [hostToken, id]);

  const fetchSanctuarySession = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/sanctuary/sessions/${id}/submissions?hostToken=${hostToken}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sanctuary session');
      }

      const data = await response.json();
      if (data.success) {
        setSession(data.data.session);
        setSubmissions(data.data.submissions || []);
      } else {
        throw new Error(data.error || 'Failed to fetch sanctuary session');
      }
    } catch (error) {
      console.error('Error fetching sanctuary:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sanctuary session. You may not be authorized to view this.',
        variant: 'destructive',
      });
      navigate('/sanctuary');
    } finally {
      setIsLoading(false);
    }
  };

  const copyShareLink = () => {
    const shareLink = `${window.location.origin}/sanctuary/submit/${id}`;
    navigator.clipboard.writeText(shareLink);
    toast({
      title: 'Link Copied!',
      description: 'Share this link to collect anonymous messages.',
    });
  };

  const getConnectionStatus = () => {
    if (!isConnected) return { text: 'Disconnected', color: 'bg-destructive' };
    
    switch (connectionQuality.status) {
      case 'excellent': return { text: 'Excellent', color: 'bg-success' };
      case 'good': return { text: 'Good', color: 'bg-warning' };
      case 'poor': return { text: 'Poor', color: 'bg-orange-500' };
      default: return { text: 'Unknown', color: 'bg-muted' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="text-lg text-muted-foreground">Loading sanctuary dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-xl font-semibold">Sanctuary Not Found</h2>
            <p className="text-muted-foreground">
              This sanctuary may have expired or you may not have permission to access it.
            </p>
            <Button onClick={() => navigate('/sanctuary')}>
              Create New Sanctuary
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const connectionStatus = getConnectionStatus();
  const timeRemaining = new Date(session.expiresAt).getTime() - Date.now();
  const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));
  const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{session.emoji}</span>
              <h1 className="text-3xl font-bold">{session.topic}</h1>
            </div>
            {session.description && (
              <p className="text-lg text-muted-foreground">{session.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectionStatus.color}`}></div>
              {connectionStatus.text}
            </Badge>
            <Button onClick={copyShareLink} variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share Link
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalSubmissions || submissions.length}</p>
                  <p className="text-sm text-muted-foreground">Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{hoursRemaining}h {minutesRemaining}m</p>
                  <p className="text-sm text-muted-foreground">Time Left</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{new Set(submissions.map(s => s.alias)).size}</p>
                  <p className="text-sm text-muted-foreground">Contributors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <ExternalLink className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{session.mode === 'anon-inbox' ? 'Inbox' : 'Live'}</p>
                  <p className="text-sm text-muted-foreground">Mode</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Anonymous Messages</span>
              <Badge variant="secondary">{submissions.length} total</Badge>
            </CardTitle>
            <CardDescription>
              Messages will appear here in real-time as people submit them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Share your sanctuary link to start receiving anonymous messages
                  </p>
                  <Button onClick={copyShareLink} variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Share Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission, index) => (
                    <Card key={submission.id || index} className="transition-all hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {submission.alias}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(submission.timestamp), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {submission.message}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-8 p-4 bg-muted/30 rounded-lg">
          <div className="text-sm text-muted-foreground">
            Created {format(new Date(session.createdAt), 'MMM d, yyyy at h:mm a')}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/sanctuary')}
            >
              Create New Sanctuary
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};