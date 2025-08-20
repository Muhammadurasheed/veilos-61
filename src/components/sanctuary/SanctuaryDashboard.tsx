import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { MessageCircle, Users, Clock, ExternalLink, Plus, Inbox, Share2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SanctuarySession {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  mode: string;
  createdAt: string;
  expiresAt: string;
  submissionCount: number;
  participantCount: number;
  lastActivity: string;
  timeRemaining: number; // in minutes
}

interface SanctuaryDashboardProps {
  className?: string;
}

export const SanctuaryDashboard: React.FC<SanctuaryDashboardProps> = ({ className }) => {
  const [sanctuaries, setSanctuaries] = useState<SanctuarySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMySanctuaries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setSanctuaries([]);
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/host-recovery/my-sanctuaries`, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setSanctuaries(data.data || []);
      } else {
        setError(data.error || 'Failed to load sanctuaries');
      }
    } catch (err) {
      console.error('Error fetching sanctuaries:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySanctuaries();
  }, []);

  const copyShareLink = (sanctuaryId: string) => {
    const shareUrl = `${window.location.origin}/sanctuary/submit/${sanctuaryId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Share link copied!",
      description: "Send this link to collect anonymous messages.",
    });
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes <= 0) return 'Expired';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">My Sanctuaries</h2>
          <Link to="/sanctuary">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </Link>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          My Sanctuaries
        </h2>
        <Link to="/sanctuary">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {sanctuaries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No sanctuaries yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first sanctuary to start collecting anonymous messages
            </p>
            <Link to="/sanctuary">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Sanctuary
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sanctuaries.map((sanctuary) => (
            <Card key={sanctuary.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    {sanctuary.emoji && (
                      <span className="text-lg">{sanctuary.emoji}</span>
                    )}
                    <div>
                      <h3 className="font-medium text-sm">{sanctuary.topic}</h3>
                      {sanctuary.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {sanctuary.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={sanctuary.timeRemaining > 0 ? 'default' : 'secondary'}>
                    {formatTimeRemaining(sanctuary.timeRemaining)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {sanctuary.submissionCount} messages
                    </div>
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {sanctuary.participantCount} participants
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {format(new Date(sanctuary.lastActivity), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Link to={`/sanctuary/inbox/${sanctuary.id}`}>
                      <Button size="sm" variant="default">
                        <Inbox className="w-3 h-3 mr-1" />
                        View Inbox
                        {sanctuary.submissionCount > 0 && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {sanctuary.submissionCount}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyShareLink(sanctuary.id)}
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                  </div>
                  
                  <Link 
                    to={`/sanctuary/submit/${sanctuary.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="ghost">
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};