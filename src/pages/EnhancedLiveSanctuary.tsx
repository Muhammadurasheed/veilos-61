import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Phone,
  PhoneOff,
  Settings,
  Shield,
  AlertTriangle,
  Clock,
  Loader2,
  HandIcon,
  MessageSquare,
  Share2
} from 'lucide-react';
import { RealTimeChat } from '@/components/sanctuary/RealTimeChat';
import { LiveSanctuaryApi } from '@/services/api';
import { useSanctuarySocket } from '@/hooks/useSanctuarySocket';
import { cn } from '@/lib/utils';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';

interface LiveSanctuarySession {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  hostId: string;
  hostAlias: string;
  agoraChannelName: string;
  agoraToken: string;
  hostToken?: string;
  maxParticipants: number;
  currentParticipants: number;
  allowAnonymous: boolean;
  audioOnly: boolean;
  moderationEnabled: boolean;
  emergencyContactEnabled: boolean;
  status: string;
  isActive: boolean;
  participants: Array<{
    id: string;
    alias: string;
    isHost: boolean;
    isModerator: boolean;
    isMuted: boolean;
    handRaised: boolean;
    avatarIndex: number;
    connectionStatus: string;
    audioLevel: number;
  }>;
  expiresAt: string;
}

const EnhancedLiveSanctuary: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const joinedRef = useRef(false);
  
  const [session, setSession] = useState<LiveSanctuarySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isDeafened, setIsDeafened] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [userRole, setUserRole] = useState<'host' | 'participant'>('participant');

  // Initialize sanctuary socket (always call hooks unconditionally)
  const sanctuarySocket = useSanctuarySocket({
    sessionId: session?.id || '',
    participant: {
      id: 'current-user-id', // This should come from user context
      alias: 'Current User', // This should come from user context
      isHost: userRole === 'host',
      isModerator: userRole === 'host'
    }
  });

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId || sessionId === 'undefined') {
        console.error('❌ Invalid session ID:', sessionId);
        setError('Invalid session ID provided');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching live sanctuary session:', sessionId);
        
        const response = await LiveSanctuaryApi.getSession(sessionId);
        
        console.log('📡 Live sanctuary response:', response);
        
        if (response.success && response.data) {
          // Access nested session data correctly
          const sessionData = response.data.session || response.data;
          setSession(sessionData);
          
          // Determine user role from URL params
          const role = searchParams.get('role') as 'host' | 'participant' || 'participant';
          setUserRole(role);
          
          console.log('✅ Live sanctuary session loaded:', {
            sessionId,
            topic: sessionData.topic,
            role,
            participants: sessionData.currentParticipants
          });
          
          toast({
            title: 'Sanctuary Loaded',
            description: `Connected to "${sessionData.topic}"`,
          });
        } else {
          throw new Error(response.error || 'Session not found');
        }
      } catch (err) {
        console.error('❌ Failed to load sanctuary session:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load session';
        setError(errorMessage);
        
        toast({
          title: 'Connection Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, searchParams, toast]);

  // Auto-join when authenticated and session loaded
  useEffect(() => {
    const doJoin = async () => {
      if (!sessionId || !session || !isAuthenticated || !user || joinedRef.current) return;
      
      try {
        const response = await LiveSanctuaryApi.joinSession(sessionId, { 
          alias: user.alias || 'Participant' 
        });
        
        if (response.success) {
          joinedRef.current = true;
          toast({ 
            title: 'Joined Successfully', 
            description: 'You are now connected to the sanctuary.' 
          });
        }
      } catch (err: any) {
        console.error('❌ Auto-join failed:', err);
        toast({ 
          title: 'Join Failed', 
          description: err.message || 'Unable to join this sanctuary automatically.',
          variant: 'destructive' 
        });
      }
    };
    
    doJoin();
  }, [sessionId, session, isAuthenticated, user, toast]);

  // Handle leaving the sanctuary
  const handleLeaveSanctuary = async () => {
    try {
      if (sessionId) {
        await LiveSanctuaryApi.leaveSession(sessionId);
      }
      navigate('/sanctuary');
    } catch (err) {
      console.error('❌ Failed to leave sanctuary:', err);
      toast({
        title: 'Error',
        description: 'Failed to leave sanctuary properly',
        variant: 'destructive',
      });
      // Navigate anyway
      navigate('/sanctuary');
    }
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    // TODO: Implement actual audio muting with Agora SDK
    toast({
      title: isMuted ? 'Unmuted' : 'Muted',
      description: isMuted ? 'You can now speak' : 'Your microphone is muted',
    });
  };

  // Handle deafen toggle
  const handleDeafenToggle = () => {
    setIsDeafened(!isDeafened);
    // TODO: Implement actual audio deafening with Agora SDK
    toast({
      title: isDeafened ? 'Audio Enabled' : 'Audio Disabled',
      description: isDeafened ? 'You can now hear others' : 'Audio from others is disabled',
    });
  };

  // Handle hand raise
  const handleHandRaise = () => {
    const newHandState = !handRaised;
    setHandRaised(newHandState);
    sanctuarySocket?.toggleHand(newHandState);
    
    toast({
      title: newHandState ? 'Hand Raised' : 'Hand Lowered',
      description: newHandState ? 'The host will be notified' : 'Your hand has been lowered',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading sanctuary session...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !session) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">Session Not Found</CardTitle>
              <CardDescription>
                {error || 'The sanctuary session could not be loaded.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/sanctuary')} variant="outline">
                Return to Sanctuary
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 max-w-6xl">
        {/* Session Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{session.emoji || '🎙️'}</div>
                <div>
                  <CardTitle className="text-2xl">{session.topic}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {session.description || 'A safe space for supportive discussion'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Live
                </Badge>
                {userRole === 'host' && (
                  <Badge variant="secondary">
                    <Shield className="w-3 h-3 mr-1" />
                    Host
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Audio Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[500px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    Audio Session
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {session.currentParticipants} / {session.maxParticipants}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Participants Grid */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {session.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className={cn(
                        "flex flex-col items-center p-4 rounded-lg border-2 transition-colors",
                        participant.audioLevel > 0
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      )}
                    >
                      <Avatar className="w-16 h-16 mb-2">
                        <AvatarImage src={`/avatars/avatar-${participant.avatarIndex}.svg`} />
                        <AvatarFallback>{participant.alias.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      
                      <p className="font-medium text-sm text-center truncate w-full">
                        {participant.alias}
                      </p>
                      
                      <div className="flex items-center gap-1 mt-1">
                        {participant.isHost && (
                          <Shield className="w-3 h-3 text-purple-500" />
                        )}
                        {participant.isMuted ? (
                          <MicOff className="w-3 h-3 text-red-500" />
                        ) : (
                          <Mic className="w-3 h-3 text-green-500" />
                        )}
                        {participant.handRaised && (
                          <HandIcon className="w-3 h-3 text-yellow-500" />
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        {participant.connectionStatus}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Audio Controls */}
                <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Button
                    variant={isMuted ? "destructive" : "outline"}
                    size="lg"
                    onClick={handleMuteToggle}
                    className="flex-1 max-w-32"
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                  
                  <Button
                    variant={isDeafened ? "destructive" : "outline"}
                    size="lg"
                    onClick={handleDeafenToggle}
                    className="flex-1 max-w-32"
                  >
                    {isDeafened ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  
                  {userRole !== 'host' && (
                    <Button
                      variant={handRaised ? "default" : "outline"}
                      size="lg"
                      onClick={handleHandRaise}
                      className="flex-1 max-w-32"
                    >
                      <HandIcon className="w-5 h-5" />
                    </Button>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={handleLeaveSanctuary}
                    className="flex-1 max-w-32"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Host</span>
                  <span className="font-medium">{session.hostAlias}</span>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Participants</span>
                  <span className="font-medium">
                    {session.currentParticipants} / {session.maxParticipants}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expires</span>
                  <span className="font-medium text-sm">
                    {new Date(session.expiresAt).toLocaleString()}
                  </span>
                </div>
                
                {session.moderationEnabled && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>AI Moderation Active</span>
                    </div>
                  </>
                )}
                
                {session.emergencyContactEnabled && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span>Emergency Protocols</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Real-time Chat */}
            <RealTimeChat
              sessionId={sessionId || 'demo-session'}
              participant={user ? {
                id: user.id || 'anonymous-user',
                alias: user.alias || 'Anonymous'
              } : null}
              className="h-[500px]"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EnhancedLiveSanctuary;