import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSanctuarySocket } from '@/hooks/useSanctuarySocket';
import { ReactionOverlay } from './AnimatedReaction';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Hand, 
  Users, 
  PhoneOff,
  Settings,
  AlertTriangle,
  Shield,
  Share2,
  Copy,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import type { LiveSanctuarySession, LiveParticipant } from '@/types/sanctuary';

interface EnhancedLiveAudioSpaceProps {
  session: LiveSanctuarySession;
  currentUser: {
    id: string;
    alias: string;
    avatarIndex?: number;
    isHost?: boolean;
    isModerator?: boolean;
  };
  onLeave: () => void;
}

interface ChatMessage {
  id: string;
  senderAlias: string;
  senderAvatarIndex: number;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'emoji-reaction';
}

export const EnhancedLiveAudioSpace = ({ session, currentUser, onLeave }: EnhancedLiveAudioSpaceProps) => {
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(true);
  const [isDeafened, setIsDeafened] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [participants, setParticipants] = useState<LiveParticipant[]>(session.participants || []);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [reactions, setReactions] = useState<Array<{ id: string; emoji: string; timestamp: number }>>([]);
  
  // Socket connection for real-time events
  const {
    onEvent,
    sendMessage,
    sendEmojiReaction,
    toggleHand,
    promoteToSpeaker,
    muteParticipant,
    kickParticipant,
    sendEmergencyAlert
  } = useSanctuarySocket({
    sessionId: session.id,
    participant: {
      id: currentUser.id,
      alias: currentUser.alias,
      isHost: currentUser.isHost,
      isModerator: currentUser.isModerator
    }
  });

  // Audio context and stream management
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate invite link
useEffect(() => {
  const currentUrl = window.location.origin;
  const link = `${currentUrl}/flagship-sanctuary/${session.id}`;
  setInviteLink(link);
}, [session.id]);

  // Auto-scroll chat messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // Listen for participant events
    const cleanupEvents = [
      onEvent('audio_participant_joined', (data) => {
        setParticipants(prev => [...prev, data.participant]);
        addSystemMessage(`${data.participant.alias} joined the audio space`);
      }),

      onEvent('audio_participant_left', (data) => {
        setParticipants(prev => prev.filter(p => p.id !== data.participantId));
        addSystemMessage(`${data.participantAlias} left the audio space`);
      }),

      onEvent('hand_raised', (data) => {
        setParticipants(prev => prev.map(p => 
          p.id === data.participantId 
            ? { ...p, handRaised: data.isRaised }
            : p
        ));
        
        if (data.isRaised) {
          toast({
            title: "Hand Raised",
            description: `${data.participantAlias} raised their hand`,
          });
        }
      }),

      onEvent('participant_muted', (data) => {
        setParticipants(prev => prev.map(p => 
          p.id === data.participantId 
            ? { ...p, isMuted: true }
            : p
        ));
        
        if (data.participantId === currentUser.id) {
          setIsMuted(true);
        }
      }),

      onEvent('emoji_reaction', (data) => {
        // Add reaction as chat message
        const reactionMessage: ChatMessage = {
          id: `reaction-${Date.now()}`,
          senderAlias: data.participantAlias,
          senderAvatarIndex: 1,
          content: data.emoji,
          timestamp: new Date(),
          type: 'emoji-reaction'
        };
        setMessages(prev => [...prev, reactionMessage]);

        // Add floating reaction animation
        const animatedReaction = {
          id: `animated-${Date.now()}-${Math.random()}`,
          emoji: data.emoji,
          timestamp: Date.now()
        };
        setReactions(prev => [...prev, animatedReaction]);
      }),

      // Remove this event listener as it doesn't exist in socket types
      // Chat messages will be handled via API polling or different socket events

      onEvent('emergency_alert', (data) => {
        toast({
          title: "🚨 Emergency Alert",
          description: data.message,
          variant: "destructive"
        });
      })
    ];

    return () => {
      cleanupEvents.forEach(cleanup => cleanup?.());
    };
  }, [onEvent, currentUser.id, toast]);

  // Initialize audio when component mounts
  useEffect(() => {
    initializeAudio();
    return () => {
      cleanup();
    };
  }, []);

  const addSystemMessage = (content: string) => {
    const systemMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      senderAlias: 'System',
      senderAvatarIndex: 0,
      content,
      timestamp: new Date(),
      type: 'system'
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      // Initialize audio context for level monitoring
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      micAnalyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(micAnalyserRef.current);
      
      // Start audio level monitoring
      monitorAudioLevel();
      
      toast({
        title: "Audio Ready",
        description: "Microphone access granted",
      });
    } catch (error) {
      console.error('Audio initialization failed:', error);
      toast({
        title: "Audio Access Required",
        description: "Please allow microphone access to participate",
        variant: "destructive"
      });
    }
  };

const monitorAudioLevel = () => {
  if (!micAnalyserRef.current) return;

  const dataArray = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
  
  const checkLevel = () => {
    if (micAnalyserRef.current) {
      micAnalyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(Math.floor((average / 255) * 100));
    }
    requestAnimationFrame(checkLevel);
  };
  
  checkLevel();
};

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const handleToggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
        
        toast({
          title: isMuted ? "Microphone On" : "Microphone Off",
          description: isMuted ? "You can now speak" : "Your microphone is muted",
        });
      }
    }
  };

  const handleToggleDeafen = () => {
    setIsDeafened(!isDeafened);
    toast({
      title: isDeafened ? "Audio On" : "Audio Off", 
      description: isDeafened ? "You can now hear others" : "Audio output disabled",
    });
  };

  const handleRaiseHand = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    toggleHand(newState);
    
    toast({
      title: newState ? "Hand Raised" : "Hand Lowered",
      description: newState ? "Waiting for host permission to speak" : "Hand lowered",
    });
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Invite Link Copied",
        description: "Share this link to invite others to join",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    // Add message locally for immediate feedback
    const localMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      senderAlias: currentUser.alias,
      senderAvatarIndex: currentUser.avatarIndex || 1,
      content: messageContent,
      timestamp: new Date(),
      type: 'text'
    };
    setMessages(prev => [...prev, localMessage]);

    // Send message via socket hook
    sendMessage(messageContent, 'text');
  };

  const handleEmojiReaction = (emoji: string) => {
    sendEmojiReaction(emoji);
    
    // Add local reaction animation immediately for better UX
    const localReaction = {
      id: `local-${Date.now()}-${Math.random()}`,
      emoji: emoji,
      timestamp: Date.now()
    };
    setReactions(prev => [...prev, localReaction]);
    
    toast({
      title: `${emoji} Reaction Sent`,
      description: "Your reaction was shared with everyone",
    });
  };

  const formatTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">{session.emoji}</div>
              <div>
                <h1 className="text-xl font-semibold">{session.topic}</h1>
                <p className="text-sm text-muted-foreground">
                  Hosted by {session.hostAlias}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyInviteLink}
                className="hidden sm:flex"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Invite Others
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChatVisible(!isChatVisible)}
                className="relative"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
                {messages.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 px-1 min-w-[20px] h-5">
                    {messages.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Audio Controls */}
          <div className="lg:col-span-3">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Audio Controls</span>
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {participants.length} participants
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center space-x-4 mb-6">
                  <Button
                    size="lg"
                    variant={isMuted ? "destructive" : "default"}
                    onClick={handleToggleMute}
                    className="px-8 py-4 text-lg"
                  >
                    {isMuted ? (
                      <MicOff className="h-6 w-6 mr-3" />
                    ) : (
                      <Mic className="h-6 w-6 mr-3" />
                    )}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                  
                  <Button
                    size="lg" 
                    variant={isDeafened ? "destructive" : "outline"}
                    onClick={handleToggleDeafen}
                    className="px-8 py-4 text-lg"
                  >
                    {isDeafened ? (
                      <VolumeX className="h-6 w-6 mr-3" />
                    ) : (
                      <Volume2 className="h-6 w-6 mr-3" />
                    )}
                    {isDeafened ? 'Undeafen' : 'Deafen'}
                  </Button>

                  {!currentUser.isHost && (
                    <Button
                      size="lg"
                      variant={handRaised ? "default" : "outline"}
                      onClick={handleRaiseHand}
                      className={`px-8 py-4 text-lg ${handRaised ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}`}
                    >
                      <Hand className="h-6 w-6 mr-3" />
                      {handRaised ? 'Lower Hand' : 'Raise Hand'}
                    </Button>
                  )}

                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={onLeave}
                    className="px-8 py-4 text-lg"
                  >
                    <PhoneOff className="h-6 w-6 mr-3" />
                    Leave
                  </Button>
                </div>

{/* Audio Level Indicator - Waveform */}
{!isMuted && (
  <div className="flex items-center justify-center space-x-3">
    <Mic className="h-5 w-5 text-green-500" />
    <div className="flex items-end space-x-1 h-10">
      {Array.from({ length: 12 }).map((_, i) => {
        const level = Math.max(4, Math.min(100, audioLevel + (i % 3 - 1) * 8));
        return (
          <div
            key={i}
            className="w-1.5 rounded-full bg-gradient-to-b from-green-400 to-green-600 transition-all duration-150"
            style={{ height: `${level}%` }}
          />
        );
      })}
    </div>
    <span className="text-sm text-muted-foreground min-w-[3rem]">{audioLevel}%</span>
  </div>
)}
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {participants.map((participant, index) => (
                    <div key={`${participant.id}-${index}`} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={`/avatars/avatar-${participant.avatarIndex || 1}.svg`} />
                          <AvatarFallback className="text-lg">
                            {participant.alias.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-lg">{participant.alias}</p>
                            {participant.isHost && (
                              <Badge className="bg-gradient-to-r from-primary to-primary/80">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Host
                              </Badge>
                            )}
                            {participant.isModerator && (
                              <Badge variant="outline">
                                <Shield className="h-3 w-3 mr-1" />
                                Mod
                              </Badge>
                            )}
                            {participant.handRaised && (
                              <Hand className="h-5 w-5 text-yellow-500 animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              participant.connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            {participant.connectionStatus}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {participant.isMuted ? (
                          <MicOff className="h-5 w-5 text-red-500" />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Mic className="h-5 w-5 text-green-500" />
                            {/* Audio level bars */}
                            <div className="flex space-x-1">
                              {[...Array(3)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1 h-4 rounded-full transition-colors ${
                                    (participant.audioLevel || 0) > (i + 1) * 33
                                      ? 'bg-green-500'
                                      : 'bg-muted'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Host/Moderator Controls */}
                        {(currentUser.isHost || currentUser.isModerator) && participant.id !== currentUser.id && (
                          <div className="flex space-x-2">
                            {participant.handRaised && (
                              <Button
                                size="sm"
                                onClick={() => promoteToSpeaker(participant.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Allow
                              </Button>
                            )}
                            <Button
                              size="sm" 
                              variant="outline"
                              onClick={() => muteParticipant(participant.id)}
                            >
                              Mute
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => kickParticipant(participant.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            {/* Quick Reactions */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Quick Reactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {['👍', '👏', '❤️', '😂', '🤔', '👎', '🔥', '✨', '🙏'].map((emoji) => (
                    <Button
                      key={emoji}
                      variant="outline"
                      onClick={() => handleEmojiReaction(emoji)}
                      className="text-2xl p-3 h-auto hover:scale-110 transition-transform duration-200 hover:shadow-lg"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Share Link Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Share2 className="h-5 w-5 mr-2" />
                  Invite Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleCopyInviteLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link to invite others to join the session
                </p>
              </CardContent>
            </Card>

            {/* Chat Panel */}
            {isChatVisible && (
              <Card className="h-96 mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>Chat</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsChatVisible(false)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 h-full flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0">
                    {messages.map((message) => (
                      <div key={message.id} className="space-y-1">
                        {message.type === 'system' ? (
                          <div className="text-center">
                            <Badge variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              {message.content}
                            </Badge>
                          </div>
                        ) : message.type === 'emoji-reaction' ? (
                          <div className="text-center">
                            <span className="text-2xl">{message.content}</span>
                            <p className="text-xs text-muted-foreground">
                              {message.senderAlias} • {formatTime(message.timestamp)}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-start space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={`/avatars/avatar-${message.senderAvatarIndex}.svg`} />
                              <AvatarFallback className="text-xs">
                                {message.senderAlias.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1">
                                <p className="text-xs font-medium truncate">
                                  {message.senderAlias}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(message.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm break-words">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="flex items-center space-x-2 pt-2 border-t mt-auto">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Emergency Controls */}
            <Card className="border-red-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <Button
                    variant="destructive"
                    onClick={() => sendEmergencyAlert('help_needed', 'Emergency assistance requested')}
                    className="w-full"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Emergency Help
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Use only in genuine emergencies
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Animated Reactions Overlay */}
      <ReactionOverlay reactions={reactions} />
    </div>
  );
};