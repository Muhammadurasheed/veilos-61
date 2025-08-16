import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { ArrowLeft, Copy, ExternalLink, MessageCircle, Clock, Users, Flag, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Submission {
  id: string;
  alias: string;
  message: string;
  timestamp: string;
}

interface SanctuarySession {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  mode: string;
  createdAt: string;
  expiresAt: string;
}

interface SanctuaryInboxData {
  session: SanctuarySession;
  submissions: Submission[];
}

const SanctuaryInbox = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [inboxData, setInboxData] = useState<SanctuaryInboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get host token from localStorage or URL params
  const getHostToken = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('hostToken');
    const tokenFromStorage = localStorage.getItem(`sanctuary_host_${id}`);
    return tokenFromUrl || tokenFromStorage;
  };

  const fetchInboxData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const hostToken = getHostToken();
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      
      const response = await fetch(
        `${apiBaseUrl}/sanctuary/sessions/${id}/submissions?hostToken=${hostToken}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(hostToken ? {} : { 'x-auth-token': localStorage.getItem('token') || '' })
          },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setInboxData(data.data);
      } else {
        setError(data.error || 'Failed to load inbox');
      }
    } catch (err) {
      console.error('Fetch inbox error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInboxData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchInboxData, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/sanctuary/${id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Share this link to collect anonymous messages.",
    });
  };

  const copyToSocial = (platform: 'whatsapp' | 'twitter') => {
    const shareUrl = `${window.location.origin}/sanctuary/${id}`;
    const text = `📮 Send me an anonymous message about: ${inboxData?.session?.topic}`;
    
    let socialUrl = '';
    if (platform === 'whatsapp') {
      socialUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`;
    } else if (platform === 'twitter') {
      socialUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    }
    
    window.open(socialUrl, '_blank');
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your sanctuary inbox...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !inboxData) {
    return (
      <Layout>
        <div className="container py-10">
          <div className="text-center min-h-[400px] flex flex-col items-center justify-center">
            <X className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Inbox not found</h2>
            <p className="text-muted-foreground mb-6">{error || 'This sanctuary session may have expired or been removed.'}</p>
            <Link to="/sanctuary">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Create New Sanctuary
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const { session, submissions } = inboxData;

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/sanctuary">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sanctuary
            </Button>
          </Link>
          <Badge variant={session.mode === 'anon-inbox' ? 'default' : 'secondary'}>
            <MessageCircle className="w-3 h-3 mr-1" />
            Anonymous Inbox
          </Badge>
        </div>

        {/* Session Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {session.emoji && (
                  <span className="text-2xl">{session.emoji}</span>
                )}
                <div>
                  <CardTitle className="text-xl">{session.topic}</CardTitle>
                  {session.description && (
                    <p className="text-muted-foreground mt-1">{session.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  {submissions.length}
                </Badge>
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  Expires {new Date(session.expiresAt).toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyShareLink} size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button onClick={() => copyToSocial('whatsapp')} variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Share on WhatsApp
              </Button>
              <Button onClick={() => copyToSocial('twitter')} variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Share on Twitter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Anonymous Messages ({submissions.length})
          </h2>

          {submissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium mb-2">No messages yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Share your link to start receiving anonymous messages
                </p>
                <Button onClick={copyShareLink} size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Share Link
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => (
                <Card key={submission.id} className="relative">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {submission.alias.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{submission.alias}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(submission.timestamp)}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-50 hover:opacity-100">
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {submission.message}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SanctuaryInbox;