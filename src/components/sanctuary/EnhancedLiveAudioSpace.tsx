import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSanctuarySocket } from '@/hooks/useSanctuarySocket';
import { ReactionOverlay } from './AnimatedReaction';
import { EnhancedChatPanel } from './EnhancedChatPanel';
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

interface LiveParticipant {
  id: string;
  alias: string;
  isHost?: boolean;
  isModerator?: boolean;
  isMuted?: boolean;
  handRaised?: boolean;
  avatarIndex?: number;
  joinedAt?: string;
  hostMuted?: boolean;
  lastSeen?: Date;
  isKicked?: boolean;
  reactions?: any[];
}

interface EnhancedLiveAudioSpaceProps {
  session: any;
  currentUser: {
    id: string;
    alias: string;
    isHost?: boolean;
    isModerator?: boolean;
    avatarIndex?: number;
  };
  onLeave: () => void;
}

interface ChatMessage {
  id: string;
  senderAlias: string;
  senderAvatarIndex: number;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'emoji-reaction' | 'media';
  attachment?: any;
  replyTo?: string;
}

const EnhancedLiveAudioSpace = ({ session, currentUser, onLeave }: EnhancedLiveAudioSpaceProps) => {
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(true);
  const [isDeafened, setIsDeafened] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isHostMuted, setIsHostMuted] = useState(false);
  
  // Filter unique participants to prevent duplicates
  const uniqueParticipants = React.useMemo(() => {
    const seen = new Set();
    return (session.participants || []).filter((p: any) => {
      if (seen.has(p.id)) {
        return false;
      }
      seen.add(p.id);
      return true;
    });
  }, [session.participants]);
  
  const [participants, setParticipants] = useState<any[]>(uniqueParticipants);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load cached messages on mount
  useEffect(() => {
    const loadCachedMessages = async () => {
      try {
        const { chatMessageCache } = await import('./ChatMessageCache');
        const cachedMessages = chatMessageCache.loadMessages(session.id);
        if (cachedMessages.length > 0) {
          console.log('📥 Loading cached messages:', cachedMessages.length);
          const hydratedMessages: ChatMessage[] = cachedMessages.map(cached => ({
            id: cached.id,
            senderAlias: cached.senderAlias,
            senderAvatarIndex: cached.senderAvatarIndex || 0,
            content: cached.content,
            timestamp: new Date(cached.timestamp),
            type: cached.type as 'text' | 'system' | 'emoji-reaction' | 'media',
            attachment: cached.attachment,
            replyTo: cached.replyTo
          }));
          setMessages(hydratedMessages);
        }
      } catch (error) {
        console.error('Error loading cached messages:', error);
      }
    };
    
    loadCachedMessages();
  }, [session.id]);

  const {
    onEvent,
    sendMessage,
    toggleHand,
    sendEmojiReaction,
    promoteToSpeaker,
    muteParticipant,
    unmuteParticipant,
    unmuteAll,
    kickParticipant,
    sendEmergencyAlert,
    leaveSanctuary,
  } = useSanctuarySocket({
    sessionId: session.id,
    participant: {
      id: currentUser.id,
      alias: currentUser.alias,
      isHost: currentUser.isHost,
      isModerator: currentUser.isModerator
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Set up socket event listeners
  useEffect(() => {
    if (!onEvent) return;

    const cleanupEvents = [
      onEvent('participant_joined', (data) => {
        console.log('Participant joined:', data);
        setParticipants(prev => {
          const exists = prev.find(p => p.id === data.participant.id);
          if (exists) return prev;
          return [...prev, data.participant];
        });
      }),

      onEvent('participant_left', (data) => {
        setParticipants(prev => prev.filter(p => p.id !== data.participantId));
      }),

      onEvent('audio_participant_joined', (data) => {
        console.log('Audio participant joined:', data);
        setParticipants(prev => {
          const existing = prev.find(p => p.id === data.participant.id);
          if (existing) {
            return prev.map(p => p.id === data.participant.id ? { ...p, ...data.participant } : p);
          }
          return [...prev, data.participant];
        });
      }),

      onEvent('audio_participant_left', (data) => {
        setParticipants(prev => prev.filter(p => p.id !== data.participantId));
      }),

      onEvent('hand_raised', (data) => {
        setParticipants(prev => 
          prev.map(p => 
            p.id === data.participantId 
              ? { ...p, handRaised: data.isRaised }
              : p
          )
        );

        if (data.isRaised && data.participantId !== currentUser.id) {
          toast({
            title: "Hand Raised",
            description: `${data.participantAlias} wants to speak`,
          });
        }
      }),

      onEvent('participant_muted', (data) => {
        setParticipants(prev => 
          prev.map(p => 
            p.id === data.participantId 
              ? { ...p, isMuted: true, hostMuted: true }
              : p
          )
        );

        if (data.participantId === currentUser.id) {
          setIsHostMuted(true);
          setIsMuted(true);
          toast({
            title: "You've been muted",
            description: "A moderator has muted your microphone",
            variant: "destructive"
          });
        }
      }),

      onEvent('participant_unmuted', (data) => {
        setParticipants(prev => 
          prev.map(p => 
            p.id === data.participantId 
              ? { ...p, isMuted: false, hostMuted: false }
              : p
          )
        );

        if (data.participantId === currentUser.id) {
          setIsHostMuted(false);
          toast({
            title: "You're unmuted",
            description: "A moderator has unmuted your microphone",
          });
        }
      }),

      onEvent('participant_kicked', (data) => {
        setParticipants(prev => prev.filter(p => p.id !== data.participantId));

        if (data.participantId === currentUser.id) {
          toast({
            title: "Removed from sanctuary",
            description: "You have been removed by a moderator",
            variant: "destructive"
          });
          setTimeout(() => {
            onLeave();
          }, 2000);
        } else {
          toast({
            title: "Participant removed",
            description: `${data.participantId} has been removed`
          });
        }
      }),

      onEvent('new_message', (data) => {
        console.log('📨 New message received:', data);
        
        setMessages(prev => {
          const exists = prev.find(m => m.id === data.id);
          if (exists) {
            console.log('⚠️ Duplicate message detected, skipping:', data.id);
            return prev;
          }

          const newMessage: ChatMessage = {
            id: data.id,
            senderAlias: data.senderAlias,
            senderAvatarIndex: data.senderAvatarIndex || 0,
            content: data.content,
            timestamp: new Date(data.timestamp),
            type: data.type as 'text' | 'system' | 'emoji-reaction' | 'media',
            attachment: data.attachment,
            replyTo: data.replyTo
          };

          // Cache the message
          import('./ChatMessageCache').then(({ chatMessageCache }) => {
            const messageToCache = {
              ...newMessage,
              timestamp: newMessage.timestamp.toISOString()
            };
            const existingMessages = chatMessageCache.loadMessages(session.id);
            chatMessageCache.saveMessages(session.id, [...existingMessages, messageToCache]);
          });

          return [...prev, newMessage];
        });
      }),

      onEvent('emoji_reaction', (data) => {
        console.log('Emoji reaction:', data);

        setReactions(prev => {
          const newReactions = [...prev, {
            id: data.id || Math.random().toString(36),
            emoji: data.emoji,
            x: Math.random() * 100,
            y: Math.random() * 100,
            timestamp: Date.now()
          }];
          return newReactions;
        });

        setTimeout(() => {
          setReactions(prev => prev.filter(r => Date.now() - r.timestamp < 3000));
        }, 3000);

        const reactionMessage: ChatMessage = {
          id: `reaction-${Date.now()}`,
          senderAlias: data.participantAlias,
          senderAvatarIndex: 0,
          content: data.emoji,
          timestamp: new Date(),
          type: 'emoji-reaction'
        };
        setMessages(prev => [...prev, reactionMessage]);
      }),

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
  }, [onEvent, currentUser.id, toast, onLeave]);

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
          autoGainControl: true,
          sampleRate: 44100,
          sampleSize: 16,
          channelCount: 1
        } 
      });
      
      streamRef.current = stream;
      
      // Create audio context for level monitoring
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      micAnalyserRef.current = analyser;
      
      monitorAudioLevel();
      
      toast({
        title: "Audio initialized",
        description: "Your microphone is ready"
      });
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      toast({
        title: "Audio Error",
        description: "Could not access your microphone",
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
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedLevel = Math.round((average / 255) * 100);
        setAudioLevel(normalizedLevel);
        requestAnimationFrame(checkLevel);
      }
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
    const participant = participants.find(p => p.id === currentUser.id);
    
    // If host muted, user cannot unmute themselves
    if (participant?.hostMuted || isHostMuted) {
      if (isMuted) {
        toast({
          title: "Cannot unmute",
          description: "You have been muted by a moderator",
          variant: "destructive"
        });
        return;
      }
    }

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !newMutedState;
      }
    }
    
    toast({
      title: newMutedState ? "Muted" : "Unmuted",
      description: newMutedState ? "Your microphone is now muted" : "Your microphone is now active"
    });
  };

  const handleToggleDeafen = () => {
    setIsDeafened(!isDeafened);
    toast({
      title: isDeafened ? "Undeafened" : "Deafened",
      description: isDeafened ? "You can now hear others" : "You cannot hear others"
    });
  };

  const handleRaiseHand = () => {
    const newHandState = !handRaised;
    setHandRaised(newHandState);
    toggleHand(newHandState);
    
    toast({
      title: newHandState ? "Hand raised" : "Hand lowered",
      description: newHandState ? "You want to speak" : "You no longer want to speak"
    });
  };

  const handleCopyInviteLink = async () => {
    try {
      const inviteLink = `${window.location.origin}/sanctuary/${session.id}`;
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Link copied",
        description: "Invite link copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy invite link",
        variant: "destructive" 
      });
    }
  };

  const handleSendMessage = async (messageContent?: string, type?: 'text' | 'emoji-reaction' | 'media', attachment?: any, replyTo?: string) => {
    if (!messageContent?.trim() && !attachment) return;
    
    const content = messageContent || '';
    if (content) {
      sendMessage(content, type, attachment, replyTo);
    }
  };

  const handleEmojiReaction = (emoji: string) => {
    sendEmojiReaction(emoji);
    
    toast({
      title: "Reaction sent",
      description: `You reacted with ${emoji}`
    });
  };

  const formatTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const inviteLink = `${window.location.origin}/sanctuary/${session.id}`;

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

              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  await leaveSanctuary();
                  onLeave();
                }}
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                Leave
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Panel - Audio Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mic className="h-5 w-5" />
                  <span>Audio Controls</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    variant={isMuted ? "destructive" : "default"}
                    onClick={handleToggleMute}
                    className="w-full justify-start"
                    disabled={isHostMuted}
                  >
                    {isMuted ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        {isHostMuted ? "Muted by Host" : "Unmute"}
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Mute
                      </>
                    )}
                  </Button>

                  <Button
                    variant={isDeafened ? "destructive" : "outline"}
                    onClick={handleToggleDeafen}
                    className="w-full justify-start"
                  >
                    {isDeafened ? (
                      <>
                        <VolumeX className="h-4 w-4 mr-2" />
                        Undeafen
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 mr-2" />
                        Deafen
                      </>
                    )}
                  </Button>

                  {!currentUser.isHost && (
                    <Button
                      variant={handRaised ? "default" : "outline"}
                      onClick={handleRaiseHand}
                      className="w-full justify-start"
                    >
                      <Hand className="h-4 w-4 mr-2" />
                      {handRaised ? "Lower Hand" : "Raise Hand"}
                    </Button>
                  )}
                </div>

                {/* Audio Level Indicator */}
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

            {/* Quick Reactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Quick Reactions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {['👍', '❤️', '😂', '🔥', '👏', '🤔', '😮', '💯'].map((emoji) => (
                    <Button
                      key={emoji}
                      variant="outline"
                      size="sm"
                      onClick={() => handleEmojiReaction(emoji)}
                      className="aspect-square p-2 text-lg hover:scale-110 transition-transform"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Participants */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Participants ({participants.length})</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`p-4 rounded-lg border transition-all ${
                        participant.id === currentUser.id 
                          ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10' 
                          : 'bg-card hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`/avatars/avatar-${participant.avatarIndex || 1}.svg`} />
                            <AvatarFallback>{participant.alias?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{participant.alias}</h3>
                              {participant.isHost && (
                                <Badge variant="secondary" className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Host
                                </Badge>
                              )}
                              {participant.isModerator && (
                                <Badge variant="outline" className="text-xs">
                                  Moderator
                                </Badge>
                              )}
                              {participant.id === currentUser.id && (
                                <Badge variant="outline" className="text-xs">
                                  You
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-1">
                              {participant.isMuted ? (
                                <MicOff className="h-4 w-4 text-red-500" />
                              ) : (
                                <Mic className="h-4 w-4 text-green-500" />
                              )}
                              
                              {participant.handRaised && (
                                <Hand className="h-4 w-4 text-yellow-500 animate-bounce" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Host Controls */}
                        {(currentUser.isHost || currentUser.isModerator) && participant.id !== currentUser.id && (
                          <div className="flex items-center space-x-2">
                            {participant.handRaised && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => promoteToSpeaker(participant.id)}
                              >
                                Allow
                              </Button>
                            )}
                            {participant.isMuted ? (
                              <Button
                                size="sm" 
                                variant="default"
                                onClick={() => unmuteParticipant(participant.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Unmute
                              </Button>
                            ) : (
                              <Button
                                size="sm" 
                                variant="outline"
                                onClick={() => muteParticipant(participant.id)}
                              >
                                Mute
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => kickParticipant(participant.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        )}

                        {/* Unmute All Button - Only show for host/moderator */}
                        {(currentUser.isHost || currentUser.isModerator) && participants.some(p => p.isMuted && p.id !== currentUser.id) && (
                          <div className="mt-4 pt-4 border-t">
                            <Button
                              variant="outline"
                              onClick={unmuteAll}
                              className="w-full"
                            >
                              Unmute All Participants
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

          {/* Right Panel - Session Info & Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Share2 className="h-5 w-5" />
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

            {/* Enhanced Chat Panel with Mention Support */}
            <EnhancedChatPanel
              isVisible={isChatVisible}
              onToggle={() => setIsChatVisible(false)}
              messages={messages}
              participants={participants}
              currentUserAlias={currentUser.alias}
              sessionId={session.id}
              onSendMessage={handleSendMessage}
            />

            {/* Emergency Controls */}
            <Card className="border-red-200 mt-4">
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
                  <div className="text-xs text-muted-foreground">
                    Use only in genuine emergencies
                  </div>
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

export default EnhancedLiveAudioSpace;