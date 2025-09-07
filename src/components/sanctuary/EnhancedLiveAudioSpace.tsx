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
  type: 'text' | 'system' | 'emoji-reaction' | 'media';
  attachment?: any;
  replyTo?: string;
}

export const EnhancedLiveAudioSpace = ({ session, currentUser, onLeave }: EnhancedLiveAudioSpaceProps) => {
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(true);
  const [isDeafened, setIsDeafened] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isHostMuted, setIsHostMuted] = useState(false); // Track if host muted this user
  
  // Filter unique participants to prevent duplicates
  const uniqueParticipants = React.useMemo(() => {
    const seen = new Set();
    return (session.participants || []).filter(p => {
      if (seen.has(p.id)) {
        return false;
      }
      seen.add(p.id);
      return true;
    });
  }, [session.participants]);
  
  const [participants, setParticipants] = useState<LiveParticipant[]>(uniqueParticipants);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Update participants when session data changes
  useEffect(() => {
    setParticipants(uniqueParticipants);
  }, [uniqueParticipants]);
  
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [reactions, setReactions] = useState<Array<{ id: string; emoji: string; timestamp: number }>>([]);
  
  // Hydrate chat cache on mount
  useEffect(() => {
    import('./ChatMessageCache').then(({ chatMessageCache }) => {
      const cachedMessages = chatMessageCache.loadMessages(session.id);
      if (cachedMessages.length > 0) {
        console.log('💬 Hydrating cached messages:', cachedMessages.length);
        const hydratedMessages: ChatMessage[] = cachedMessages.map(cached => ({
          id: cached.id,
          senderAlias: cached.senderAlias,
          senderAvatarIndex: cached.senderAvatarIndex,
          content: cached.content,
          timestamp: new Date(cached.timestamp),
          type: cached.type as 'text' | 'system' | 'emoji-reaction' | 'media',
          attachment: cached.attachment
        }));
        setMessages(hydratedMessages);
      }
    });
  }, [session.id]);
  
  // Socket connection for real-time events
  const {
    onEvent,
    sendMessage,
    sendEmojiReaction,
    toggleHand,
    promoteToSpeaker,
    muteParticipant,
    unmuteParticipant,
    unmuteAll,
    kickParticipant,
    sendEmergencyAlert,
    leaveSanctuary
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
      // Join/Leave events
      onEvent('participant_joined', (data) => {
        console.log('Participant joined:', data);
        setParticipants(prev => {
          // Prevent duplicate participants
          const exists = prev.find(p => p.id === data.participant.id);
          if (exists) return prev;
          return [...prev, data.participant];
        });
        addSystemMessage(`${data.participant.alias} joined the sanctuary`);
      }),

      onEvent('participant_left', (data) => {
        console.log('Participant left:', data);
        setParticipants(prev => prev.filter(p => p.id !== data.participantId));
        addSystemMessage(`${data.participantAlias} left the sanctuary`);
      }),

      onEvent('audio_participant_joined', (data) => {
        console.log('Audio participant joined:', data);
        setParticipants(prev => {
          // Update existing participant or add new one
          const existing = prev.find(p => p.id === data.participant.id);
          if (existing) {
            return prev.map(p => 
              p.id === data.participant.id 
                ? { ...p, connectionStatus: 'connected' as const }
                : p
            );
          }
          return [...prev, data.participant];
        });
      }),

      onEvent('audio_participant_left', (data) => {
        console.log('Audio participant left:', data);
        setParticipants(prev => prev.filter(p => p.id !== data.participantId));
        addSystemMessage(`${data.participantAlias} left the audio space`);
      }),

      onEvent('hand_raised', (data) => {
        console.log('Hand raised:', data);
        setParticipants(prev => prev.map(p => 
          p.id === data.participantId 
            ? { ...p, handRaised: data.isRaised }
            : p
        ));
        
        if (data.isRaised && data.participantId !== currentUser.id) {
          toast({
            title: "Hand Raised",
            description: `${data.participantAlias} raised their hand`,
          });
        }
      }),

      onEvent('participant_muted', (data) => {
        console.log('Participant muted:', data);
        setParticipants(prev => prev.map(p => 
          p.id === data.participantId 
            ? { ...p, isMuted: true }
            : p
        ));
        
        if (data.participantId === currentUser.id) {
          setIsMuted(true);
          setIsHostMuted(true); // Lock mute state when host mutes
          toast({
            title: "You've been muted",
            description: "A moderator has muted your microphone",
            variant: "destructive"
          });
        }
      }),

      onEvent('participant_unmuted', (data) => {
        console.log('Participant unmuted:', data);
        setParticipants(prev => prev.map(p => 
          p.id === data.participantId 
            ? { ...p, isMuted: false }
            : p
        ));
        
        if (data.participantId === currentUser.id) {
          setIsHostMuted(false); // Unlock mute state when host unmutes
          toast({
            title: "You've been unmuted",
            description: "A moderator has unmuted your microphone",
          });
        }
      }),

      onEvent('participant_kicked', (data) => {
        console.log('Participant kicked:', data);
        setParticipants(prev => prev.filter(p => p.id !== data.participantId));
        
        if (data.participantId === currentUser.id) {
          toast({
            title: "Removed from sanctuary",
            description: "You have been removed by a moderator",
            variant: "destructive"
          });
          // Redirect after a short delay
          setTimeout(() => {
            onLeave();
          }, 2000);
        } else {
          addSystemMessage(`${data.participantId} was removed from the sanctuary`);
        }
      }),

      onEvent('new_message', (data) => {
        console.log('New message received:', data);
        
        // Check if this message is already in our messages array to prevent duplicates
        setMessages(prev => {
          const exists = prev.find(m => m.id === data.id);
          if (exists) {
            console.log('Duplicate message ignored:', data.id);
            return prev;
          }
          
          const messageType = (data.type === 'text' || data.type === 'emoji-reaction' || data.type === 'media' || data.type === 'system') 
            ? data.type 
            : 'text';
          
          const newMessage: ChatMessage = {
            id: data.id,
            senderAlias: data.senderAlias,
            senderAvatarIndex: data.senderAvatarIndex || 1,
            content: data.content,
            timestamp: new Date(data.timestamp),
            type: messageType,
            attachment: data.attachment,
            replyTo: data.replyTo
          };
          
          return [...prev, newMessage];
        });
      }),

      onEvent('emoji_reaction', (data) => {
        console.log('Emoji reaction received:', data);
        
        // Add floating reaction animation with unique ID and timeout
        const reactionId = data.id || `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setReactions(prev => {
          const newReactions = [...prev, {
            id: reactionId,
            emoji: data.emoji,
            timestamp: Date.now()
          }];
          // Limit to 5 active reactions for performance
          return newReactions.slice(-5);
        });

        // Remove reaction after 3 seconds
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== reactionId));
        }, 3000);

        // Add to chat messages
        const reactionMessage: ChatMessage = {
          id: `reaction-${data.timestamp}`,
          senderAlias: data.participantAlias,
          senderAvatarIndex: 1,
          content: data.emoji,
          timestamp: new Date(data.timestamp),
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
    // Enhanced mute logic with host override
    const participant = session?.participants.find(p => p.id === currentParticipant?.id);
    
    // If host has muted the participant, they cannot unmute themselves
    if (participant?.hostMuted || isHostMuted) {
      if (isMuted) {
        toast({
          title: "Cannot unmute",
          description: "You have been muted by the host",
          variant: "destructive"
        });
        return;
      }
    }
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (agoraClient && localMicrophoneTrack) {
      localMicrophoneTrack.setEnabled(!newMutedState);
    }
    
    // Update server with self-mute state (not host-mute)
    if (socketActions.updateParticipantState) {
      socketActions.updateParticipantState({
        sessionId: session?.id || '',
        participantId: currentParticipant?.id || '',
        updates: { 
          isMuted: newMutedState,
          // Only clear hostMuted if unmuting and not host-muted
          ...((!newMutedState && !participant?.hostMuted) ? { hostMuted: false } : {})
        }
      });
    }
  };

  // Host-only functions for mute control
  const hostMuteParticipant = useCallback((participantId: string, shouldMute: boolean) => {
    if (!currentParticipant?.isHost) return;
    
    if (socketActions.hostMuteParticipant) {
      socketActions.hostMuteParticipant({
        sessionId: session?.id || '',
        participantId,
        muted: shouldMute
      });
    }
  }, [currentParticipant?.isHost, session?.id, socketActions]);

  const hostMuteAll = useCallback(() => {
    if (!currentParticipant?.isHost || !session) return;
    
    const nonHostParticipants = session.participants.filter(p => !p.isHost && p.id !== currentParticipant?.id);
    nonHostParticipants.forEach(participant => {
      hostMuteParticipant(participant.id, true);
    });
    
    toast({
      title: "All participants muted",
      description: `Muted ${nonHostParticipants.length} participants`,
    });
  }, [currentParticipant?.isHost, currentParticipant?.id, session, hostMuteParticipant, toast]);

  const hostUnmuteAll = useCallback(() => {
    if (!currentParticipant?.isHost || !session) return;
    
    const mutedParticipants = session.participants.filter(p => 
      !p.isHost && p.id !== currentParticipant?.id && (p.isMuted || p.hostMuted)
    );
    
    mutedParticipants.forEach(participant => {
      hostMuteParticipant(participant.id, false);
    });
    
    toast({
      title: "All participants unmuted",
      description: `Unmuted ${mutedParticipants.length} participants`,
    });
  }, [currentParticipant?.isHost, currentParticipant?.id, session, hostMuteParticipant, toast]);

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

  const handleSendMessage = async (messageContent?: string, type?: 'text' | 'emoji-reaction' | 'media', attachment?: any, replyTo?: string) => {
    const content = messageContent || newMessage.trim();
    if (!content && !attachment) return;

    // Clear input only if using the local newMessage
    if (!messageContent) {
      setNewMessage('');
    }

    // Send message via socket hook with reply support
    sendMessage(content, type || 'text', attachment, replyTo);
  };

  const handleEmojiReaction = (emoji: string) => {
    sendEmojiReaction(emoji);
    
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
                    disabled={isHostMuted && isMuted} // Disable unmute if host muted
                    className={`px-8 py-4 text-lg ${isHostMuted && isMuted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isHostMuted && isMuted ? 'You have been muted by a moderator' : ''}
                  >
                    {isMuted ? (
                      <MicOff className="h-6 w-6 mr-3" />
                    ) : (
                      <Mic className="h-6 w-6 mr-3" />
                    )}
                    {isMuted ? (isHostMuted ? 'Muted by Host' : 'Unmute') : 'Mute'}
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
                    onClick={() => {
                      leaveSanctuary();
                      onLeave();
                    }}
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
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
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
                          <div className="text-sm text-muted-foreground flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              participant.connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <span>{participant.connectionStatus}</span>
                          </div>
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

            {/* Emergency Controls - Fixed Position to Avoid Overlap */}
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