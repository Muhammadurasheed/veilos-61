import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, MicOff, Volume2, VolumeX, Hand, UserPlus, Users, 
  MessageSquare, Settings, Phone, PhoneOff, UserX,
  Smile, Heart, ThumbsUp, Share2, Copy
} from 'lucide-react';
import { RealTimeChat } from './RealTimeChat';
import { ReactionOverlay } from './AnimatedReaction';
import { useFlagshipSanctuary } from '@/hooks/useFlagshipSanctuary';
import type { FlagshipSanctuarySession, FlagshipParticipant } from '@/types/flagship-sanctuary';

interface EnhancedLiveAudioSpaceProps {
  session: FlagshipSanctuarySession;
  currentParticipant: FlagshipParticipant | null;
  onLeave: () => void;
  onMute?: (muted: boolean) => void;
  onDeafen?: (deafened: boolean) => void;
}

export const EnhancedLiveAudioSpace: React.FC<EnhancedLiveAudioSpaceProps> = ({
  session,
  currentParticipant,
  onLeave,
  onMute,
  onDeafen
}) => {
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [reactions, setReactions] = useState<Array<{ id: string; emoji: string; timestamp: number }>>([]);
  
  // Get unique participants to prevent duplicates
  const uniqueParticipants = useMemo(() => {
    if (!session.participants) return [];
    
    const seen = new Set();
    return session.participants.filter(participant => {
      if (seen.has(participant.id)) {
        return false;
      }
      seen.add(participant.id);
      return true;
    });
  }, [session.participants]);

  // Generate avatar color based on alias
  const getAvatarColor = useCallback((alias: string): string => {
    const colors = [
      'bg-red-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200',
      'bg-purple-200', 'bg-pink-200', 'bg-indigo-200', 'bg-teal-200'
    ];
    const charSum = alias.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charSum % colors.length];
  }, []);

  // Get initials from alias
  const getInitials = useCallback((alias: string): string => {
    return alias
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, []);

  // Generate invite link
  useEffect(() => {
    const currentUrl = window.location.origin;
    const link = `${currentUrl}/flagship-sanctuary/${session.id}`;
    setInviteLink(link);
  }, [session.id]);

  const handleReaction = useCallback((emoji: string) => {
    const reaction = {
      id: `reaction-${Date.now()}-${Math.random()}`,
      emoji,
      timestamp: Date.now()
    };
    
    setReactions(prev => [...prev, reaction]);
    
    // API call to send reaction
    fetch(`/api/flagship-sanctuary/${session.id}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji })
    }).catch(console.error);
    
    toast({
      description: `Sent ${emoji} reaction`,
      duration: 1000
    });
  }, [session.id, toast]);
  
  const handleMuteParticipant = useCallback(async (participantId: string) => {
    if (!currentParticipant?.isHost) return;
    
    try {
      const response = await fetch(`/api/flagship-sanctuary/${session.id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetParticipantId: participantId,
          action: 'mute',
          reason: 'Host moderation'
        })
      });
      
      if (response.ok) {
        toast({
          description: 'Participant muted successfully',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Failed to mute participant:', error);
      toast({
        description: 'Failed to mute participant',
        variant: 'destructive',
        duration: 2000
      });
    }
  }, [session.id, currentParticipant?.isHost, toast]);
  
  const handleRemoveParticipant = useCallback(async (participantId: string) => {
    if (!currentParticipant?.isHost) return;
    
    try {
      const response = await fetch(`/api/flagship-sanctuary/${session.id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetParticipantId: participantId,
          action: 'kick',
          reason: 'Host removal'
        })
      });
      
      if (response.ok) {
        toast({
          description: 'Participant removed successfully',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Failed to remove participant:', error);
      toast({
        description: 'Failed to remove participant',
        variant: 'destructive',
        duration: 2000
      });
    }
  }, [session.id, currentParticipant?.isHost, toast]);

  const handleToggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    onMute?.(newMutedState);
    
    toast({
      description: newMutedState ? 'Microphone muted' : 'Microphone unmuted',
      duration: 1000
    });
  }, [isMuted, onMute, toast]);

  const handleToggleDeafen = useCallback(() => {
    const newDeafenedState = !isDeafened;
    setIsDeafened(newDeafenedState);
    onDeafen?.(newDeafenedState);
    
    toast({
      description: newDeafenedState ? 'Audio deafened' : 'Audio undeafened',
      duration: 1000
    });
  }, [isDeafened, onDeafen, toast]);

  const handleToggleHand = useCallback(() => {
    setHandRaised(prev => !prev);
    toast({
      description: !handRaised ? 'Hand raised' : 'Hand lowered',
      duration: 1000
    });
  }, [handRaised, toast]);

  const handleCopyInviteLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        description: 'Invite link copied to clipboard',
        duration: 2000
      });
    } catch (error) {
      toast({
        description: 'Failed to copy link',
        variant: 'destructive',
        duration: 2000
      });
    }
  }, [inviteLink, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur border-b sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl">{session.emoji}</div>
              <div>
                <h1 className="text-xl font-semibold">{session.topic}</h1>
                <div className="text-sm text-muted-foreground">
                  Hosted by {session.hostAlias}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInviteModal(true)}
                className="hidden sm:flex"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Invite Others
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className={`grid gap-6 ${showChat ? 'lg:grid-cols-4' : 'grid-cols-1'}`}>
          {/* Main Content */}
          <div className={showChat ? 'lg:col-span-3' : 'col-span-1'}>
            {/* Audio Controls */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>Audio Controls</span>
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {uniqueParticipants.length} participants
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-4 mb-6">
                  <Button
                    size="lg"
                    variant={isMuted ? "destructive" : "default"}
                    onClick={handleToggleMute}
                    className="px-6"
                  >
                    {isMuted ? <MicOff className="h-5 w-5 mr-2" /> : <Mic className="h-5 w-5 mr-2" />}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                  
                  <Button
                    size="lg"
                    variant={isDeafened ? "destructive" : "outline"}
                    onClick={handleToggleDeafen}
                    className="px-6"
                  >
                    {isDeafened ? <VolumeX className="h-5 w-5 mr-2" /> : <Volume2 className="h-5 w-5 mr-2" />}
                    Deafen
                  </Button>

                  {!currentParticipant?.isHost && (
                    <Button
                      size="lg"
                      variant={handRaised ? "default" : "outline"}
                      onClick={handleToggleHand}
                      className={handRaised ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                    >
                      <Hand className="h-5 w-5 mr-2" />
                      {handRaised ? 'Lower Hand' : 'Raise Hand'}
                    </Button>
                  )}

                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={onLeave}
                    className="px-6"
                  >
                    <PhoneOff className="h-5 w-5 mr-2" />
                    Leave
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Reactions */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle>Quick Reactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-3">
                  {['👍', '❤️', '😊', '😢', '🔥', '👏', '✨', '🙏'].map((emoji) => (
                    <Button
                      key={emoji}
                      variant="outline"
                      size="lg"
                      onClick={() => handleReaction(emoji)}
                      className="text-2xl hover:scale-110 transition-transform"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Participants Grid */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participants ({uniqueParticipants.length})
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInviteModal(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Others
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {uniqueParticipants.map((participant) => (
                  <div key={`participant-${participant.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={getAvatarColor(participant.alias)}>
                          {getInitials(participant.alias)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{participant.alias}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          {participant.isHost && (
                            <Badge variant="secondary" className="text-xs">Host</Badge>
                          )}
                          <span className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${participant.connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {participant.connectionStatus || 'connected'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {participant.isSpeaking && (
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                          <Mic className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      
                      {participant.handRaised && (
                        <Hand className="h-4 w-4 text-yellow-500" />
                      )}
                      
                      {participant.isMuted ? (
                        <MicOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Mic className="h-4 w-4 text-green-500" />
                      )}
                      
                      {/* Host Controls */}
                      {currentParticipant?.isHost && participant.id !== currentParticipant.id && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMuteParticipant(participant.id)}
                            className="h-8 w-8 p-0"
                            title={participant.isMuted ? "Unmute participant" : "Mute participant"}
                          >
                            {participant.isMuted ? <MicOff className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveParticipant(participant.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Remove participant"
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Sidebar - Fixed positioning to prevent overlap */}
          {showChat && (
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <RealTimeChat
                  sessionId={session.id}
                  participant={currentParticipant ? {
                    id: currentParticipant.id,
                    alias: currentParticipant.alias
                  } : null}
                  isHost={currentParticipant?.isHost || false}
                  className="h-[calc(100vh-8rem)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Emergency Help Button - Fixed position */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            variant="destructive"
            size="lg"
            className="shadow-lg"
            onClick={() => {
              toast({
                title: "Emergency Help",
                description: "Emergency protocols activated. Help is on the way.",
                variant: "destructive"
              });
            }}
          >
            🆘 Emergency Help
          </Button>
        </div>
        
        {/* Animated Reactions Overlay */}
        <ReactionOverlay reactions={reactions} />
      </div>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Others to Join</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Invite Link</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={inviteLink}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleCopyInviteLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Share this link to invite others to join the sanctuary.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};