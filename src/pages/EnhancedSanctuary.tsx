import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import LiveAudioRoom from '@/components/sanctuary/LiveAudioRoom';
import BreakoutRoomManager from '@/components/sanctuary/BreakoutRoomManager';
import SessionRecorder from '@/components/sanctuary/SessionRecorder';
import AIModerationDashboard from '@/components/sanctuary/AIModerationDashboard';
import EmergencyResponse from '@/components/sanctuary/EmergencyResponse';
import { 
  Users, 
  Mic, 
  Shield, 
  FileAudio, 
  Brain,
  Settings,
  Clock,
  Activity
} from 'lucide-react';
import { LiveSanctuarySession, LiveParticipant } from '@/types/sanctuary';
import { LiveSanctuaryApi } from '@/services/api';
import { SEOHead } from '@/components/seo/SEOHead';

const EnhancedSanctuary = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [session, setSession] = useState<LiveSanctuarySession | null>(null);
  const [participant, setParticipant] = useState<LiveParticipant | null>(null);
  const [activeTab, setActiveTab] = useState('audio');
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencySeverity, setEmergencySeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isLoading, setIsLoading] = useState(true);

  // Mock session data for demo
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      
      try {
        const response = await LiveSanctuaryApi.getSession(sessionId);
        
        if (response.success && response.data) {
          // Convert API data to LiveSanctuarySession format
          const sessionData: LiveSanctuarySession = {
            ...response.data,
            hostAlias: 'Host',
            status: 'active',
            participants: [],
            startTime: response.data.createdAt,
            estimatedDuration: 3600,
            tags: ['support'],
            language: 'en',
            isRecorded: false,
            recordingConsent: [],
            agoraChannelName: response.data.agoraChannelName || `sanctuary_${sessionId}`,
            agoraToken: response.data.agoraToken || 'mock-agora-token',
            breakoutRooms: [],
            moderationLevel: 'high' as const,
            emergencyProtocols: true,
            aiMonitoring: true
          };
          
          setSession(sessionData);
        } else {
          throw new Error(response.error || 'Session not found');
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
        // Fallback to mock data for development
        const mockSession: LiveSanctuarySession = {
          id: sessionId || 'sanctuary-1',
      topic: 'Anxiety & Stress Support Circle',
      description: 'A safe space for sharing and supporting each other through anxiety and stress',
      emoji: '🏛️',
      hostId: 'host-1',
      hostAlias: 'Sanctuary Guide',
      status: 'active',
      mode: 'public',
      participants: [],
      maxParticipants: 20,
      currentParticipants: 2,
      startTime: new Date().toISOString(),
      estimatedDuration: 3600,
      tags: ['anxiety', 'stress', 'support'],
      language: 'en',
      isRecorded: false,
      recordingConsent: false,
      agoraChannelName: `sanctuary_${sessionId}`,
      agoraToken: 'mock-agora-token',
      breakoutRooms: [],
      moderationLevel: 'high',
      emergencyProtocols: true,
      aiMonitoring: true,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      isActive: true,
      allowAnonymous: true,
      audioOnly: true,
      moderationEnabled: true,
      emergencyContactEnabled: true,
      createdAt: new Date().toISOString()
    };

        setSession(mockSession);
      }
      
      const mockParticipant: LiveParticipant = {
        id: 'user-123',
        alias: 'Anonymous Seeker',
        isHost: Math.random() > 0.8, // 20% chance of being host for demo
        isModerator: false,
        isMuted: true,
        isBlocked: false,
        handRaised: false,
        joinedAt: new Date().toISOString(),
        connectionStatus: 'connected',
        audioLevel: 0,
        speakingTime: 0,
        avatarIndex: Math.floor(Math.random() * 7) + 1,
        reactions: []
      };

      setParticipant(mockParticipant);
      setIsLoading(false);

      toast({
        title: "Welcome to the Sanctuary",
        description: "You've joined a safe space for support and guidance",
      });
    };
    
    fetchSession();
  }, [sessionId, toast]);

  const handleEmergencyAlert = (participantId: string, isCrisis: boolean) => {
    setEmergencyActive(true);
    setEmergencySeverity(isCrisis ? 'critical' : 'high');
    
    toast({
      title: "🚨 Emergency Protocol Activated",
      description: "Professional support is being contacted",
      variant: "destructive",
    });
  };

  const handleJoinBreakoutRoom = (roomId: string) => {
    toast({
      title: "Joining Breakout Room",
      description: "Moving to smaller group discussion",
    });
    // In production, this would navigate to the breakout room
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to Sanctuary...</p>
        </div>
      </div>
    );
  }

  if (!session || !participant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <p className="text-gray-600 mb-4">Unable to load sanctuary session</p>
            <Button onClick={() => navigate('/sanctuary')}>
              Return to Sanctuary List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <SEOHead
        title={`Live Sanctuary - ${session?.topic || 'Anonymous Audio Space'} | Veilo`}
        description="Join a live anonymous audio sanctuary for real-time emotional support and community connection"
        keywords="live audio sanctuary, anonymous support, real-time community, mental health"
      />
      
      {/* Emergency Response Overlay */}
      <EmergencyResponse
        sessionId={session.id}
        participantId={participant.id}
        severity={emergencySeverity}
        isActive={emergencyActive}
        onClose={() => setEmergencyActive(false)}
        onEscalate={(level) => setEmergencySeverity(level as any)}
      />

      {/* Main Content */}
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Session Header */}
        <Card className="mb-6 glass shadow-lg border-purple-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{session.emoji}</div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    {session.topic}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{session.description}</p>
                  <div className="flex items-center space-x-3 mt-3">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <Activity className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {session.participants.length}/{session.maxParticipants}
                    </Badge>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {Math.floor((Date.now() - new Date(session.startTime).getTime()) / 60000)} min
                    </Badge>
                    {participant.isHost && (
                      <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        Host
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <Button
                  variant="outline"
                  onClick={() => navigate('/sanctuary')}
                  className="mb-2"
                >
                  Leave Sanctuary
                </Button>
                <p className="text-sm text-gray-500">
                  Safe • Anonymous • Moderated
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Interface Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="audio" className="flex items-center space-x-2">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Audio Room</span>
            </TabsTrigger>
            <TabsTrigger value="breakout" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Breakout</span>
            </TabsTrigger>
            <TabsTrigger value="recording" className="flex items-center space-x-2">
              <FileAudio className="h-4 w-4" />
              <span className="hidden sm:inline">Recording</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Safety</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Audio Room Tab */}
          <TabsContent value="audio" className="space-y-0">
            <LiveAudioRoom 
              session={session} 
              participant={{
                id: participant.id,
                alias: participant.alias,
                isHost: participant.isHost,
                isModerator: participant.isModerator
              }} 
            />
          </TabsContent>

          {/* Breakout Rooms Tab */}
          <TabsContent value="breakout" className="space-y-6">
            <BreakoutRoomManager
              sessionId={session.id}
              isHost={participant.isHost}
              onJoinRoom={handleJoinBreakoutRoom}
            />
          </TabsContent>

          {/* Recording Tab */}
          <TabsContent value="recording" className="space-y-6">
            <SessionRecorder
              sessionId={session.id}
              sessionType="live-sanctuary"
              isHost={participant.isHost}
              participantCount={session.participants.length}
              onConsentRequest={() => {
                toast({
                  title: "Recording consent requested",
                  description: "All participants have been notified",
                });
              }}
            />
          </TabsContent>

          {/* AI Moderation Tab */}
          <TabsContent value="moderation" className="space-y-6">
            <AIModerationDashboard
              sessionId={session.id}
              sessionType="live-sanctuary"
              isHost={participant.isHost}
              isModerator={participant.isModerator}
              realTimeEnabled={true}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Session Settings */}
              <Card className="glass shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Session Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">AI Monitoring</span>
                    <Badge variant={session.aiMonitoring ? "default" : "secondary"}>
                      {session.aiMonitoring ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Moderation Level</span>
                    <Badge variant="outline">{session.moderationLevel}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Emergency Protocols</span>
                    <Badge variant={session.emergencyProtocols ? "default" : "secondary"}>
                      {session.emergencyProtocols ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Recording</span>
                    <Badge variant={session.isRecorded ? "destructive" : "secondary"}>
                      {session.isRecorded ? 'Recording' : 'Not Recording'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Participant Settings */}
              <Card className="glass shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Your Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Role</span>
                    <Badge variant={participant.isHost ? "default" : "outline"}>
                      {participant.isHost ? 'Host' : 'Participant'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Microphone</span>
                    <Badge variant={participant.isMuted ? "secondary" : "default"}>
                      {participant.isMuted ? 'Muted' : 'Unmuted'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Connection</span>
                    <Badge variant="default">{participant.connectionStatus}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Speaking Time</span>
                    <span className="text-sm text-gray-600">
                      {Math.floor(participant.speakingTime / 60)}m {participant.speakingTime % 60}s
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Emergency Quick Actions */}
            {participant.isHost && (
              <Card className="glass shadow-lg border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-700">
                    <Shield className="h-5 w-5 mr-2" />
                    Emergency Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="destructive"
                      onClick={() => handleEmergencyAlert('', false)}
                      className="justify-start"
                    >
                      Activate Emergency Protocol
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="justify-start border-orange-300 text-orange-600"
                      onClick={() => {
                        toast({
                          title: "All participants muted",
                          description: "Emergency mute activated for safety",
                        });
                      }}
                    >
                      Emergency Mute All
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="justify-start border-blue-300 text-blue-600"
                      onClick={() => {
                        toast({
                          title: "Professional support contacted",
                          description: "Crisis counselor notified",
                        });
                      }}
                    >
                      Contact Crisis Support
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="justify-start border-purple-300 text-purple-600"
                      onClick={() => {
                        toast({
                          title: "Session paused",
                          description: "Taking a safety break",
                        });
                      }}
                    >
                      Pause Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedSanctuary;