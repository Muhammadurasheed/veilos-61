import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Share2,
  Twitter,
  MessageCircle,
  Link as LinkIcon
} from 'lucide-react';
import { SanctuaryApi, LiveSanctuaryApi } from '@/services/api';

interface EnhancedSanctuaryFlowProps {
  sessionId: string;
  sessionType: 'inbox' | 'live';
}

const EnhancedSanctuaryFlow: React.FC<EnhancedSanctuaryFlowProps> = ({ 
  sessionId,
  sessionType 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [sessionData, setSessionData] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [alias, setAlias] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
    try {
      let response;
      let actualSessionType = sessionType;
      
      // Try to determine session type from URL first
      if (sessionType === 'live') {
        response = await LiveSanctuaryApi.getSession(sessionId);
      } else if (sessionType === 'inbox') {
        response = await SanctuaryApi.getSession(sessionId);
      } else {
        // For generic routes, try both APIs to determine type
        try {
          response = await SanctuaryApi.getSession(sessionId);
          if (response.success) {
            // Update session type based on mode
            actualSessionType = response.data.mode === 'live-audio' ? 'live' : 'inbox';
          }
        } catch {
          // If not found in regular sanctuary, try live sanctuary
          response = await LiveSanctuaryApi.getSession(sessionId);
          if (response.success) {
            actualSessionType = 'live';
          }
        }
      }

      if (response?.success && response.data) {
        setSessionData(response.data);
      } else {
        throw new Error(response?.error || 'Session not found');
      }
    } catch (error) {
        console.error('Failed to fetch session:', error);
        toast({
          title: "Session not found",
          description: "The sanctuary session may have expired or been removed.",
          variant: "destructive"
        });
        navigate('/sanctuary');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, sessionType, navigate, toast]);

  // Join session
  const handleJoin = async () => {
    if (!alias.trim()) {
      toast({
        title: "Alias required",
        description: "Please enter an alias to join the sanctuary.",
        variant: "destructive"
      });
      return;
    }

    setJoining(true);
    
    try {
      let response;
      
      if (sessionType === 'live') {
        response = await LiveSanctuaryApi.joinSession(sessionId, { alias: alias.trim() });
      } else {
        response = await SanctuaryApi.joinSession(sessionId, { alias: alias.trim() });
      }

      if (response?.success && response.data) {
        setParticipant(response.data);
        setHasJoined(true);
        
        toast({
          title: "Joined sanctuary!",
          description: `Welcome to ${sessionData.topic}`,
        });

        // Navigate to appropriate sanctuary experience
        if (sessionType === 'live') {
          // For live audio, redirect to enhanced sanctuary with participant data
          navigate(`/sanctuary/live/${sessionId}`, { 
            state: { participant: response.data } 
          });
        } else {
          // For inbox, show submission form
          navigate(`/sanctuary/submit/${sessionId}`);
        }
      } else {
        throw new Error(response?.error || 'Failed to join session');
      }
    } catch (error: any) {
      toast({
        title: "Failed to join",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setJoining(false);
    }
  };

  // Share functionality
  const shareSession = (platform: 'twitter' | 'whatsapp' | 'copy') => {
    const url = window.location.href;
    const text = `Join me in this safe sanctuary space: ${sessionData.topic}`;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Sanctuary link has been copied to your clipboard."
        });
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sanctuary...</p>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <p className="text-gray-600 mb-4">Sanctuary session not found</p>
            <Button onClick={() => navigate('/sanctuary')}>
              Create New Sanctuary
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container mx-auto p-4 max-w-2xl pt-20">
        {/* Session Information */}
        <Card className="glass shadow-xl border-purple-200 mb-6">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">{sessionData.emoji || '🏛️'}</div>
            <CardTitle className="text-3xl font-bold text-gray-800 mb-2">
              {sessionData.topic}
            </CardTitle>
            {sessionData.description && (
              <p className="text-gray-600 text-lg">
                {sessionData.description}
              </p>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {sessionType === 'live' ? (
                  <>
                    <Mic className="h-3 w-3 mr-1" />
                    Live Audio
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Anonymous Inbox
                  </>
                )}
              </Badge>
              
              {sessionType === 'live' && (
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  {sessionData.currentParticipants || 0}/{sessionData.maxParticipants || 50}
                </Badge>
              )}
              
              <Badge variant="outline" className="text-purple-700">
                Safe & Anonymous
              </Badge>
            </div>

            {/* Join Form */}
            {!hasJoined && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose your anonymous alias
                  </label>
                  <Input
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder={sessionType === 'live' ? 'Speaker Name' : 'Anonymous Name'}
                    className="text-center text-lg"
                    maxLength={20}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleJoin();
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    This will be visible to others in the sanctuary
                  </p>
                </div>

                <Button
                  onClick={handleJoin}
                  disabled={joining || !alias.trim()}
                  className="w-full text-lg py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {joining ? "Joining..." : sessionType === 'live' ? "Join Live Audio" : "Enter Sanctuary"}
                </Button>
              </div>
            )}

            {/* Session Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-center text-sm text-gray-600">
                <div>
                  <div className="font-semibold text-gray-800">
                    {sessionType === 'live' ? 'Participants' : 'Messages Received'}
                  </div>
                  <div>{sessionType === 'live' ? sessionData.currentParticipants || 0 : sessionData.participantCount || 0}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Expires</div>
                  <div>
                    {new Date(sessionData.expiresAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Options */}
        <Card className="glass shadow-lg border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-lg">
              <Share2 className="h-5 w-5 mr-2" />
              Invite Others to This Sanctuary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => shareSession('whatsapp')}
                className="flex flex-col items-center gap-2 h-16 hover:bg-green-50"
              >
                <MessageCircle className="h-5 w-5 text-green-600" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => shareSession('twitter')}
                className="flex flex-col items-center gap-2 h-16 hover:bg-blue-50"
              >
                <Twitter className="h-5 w-5 text-blue-500" />
                <span className="text-xs">Twitter</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => shareSession('copy')}
                className="flex flex-col items-center gap-2 h-16 hover:bg-gray-50"
              >
                <LinkIcon className="h-5 w-5 text-gray-600" />
                <span className="text-xs">Copy Link</span>
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              Share this sanctuary with people who might need support
            </p>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/sanctuary')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Sanctuary Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSanctuaryFlow;