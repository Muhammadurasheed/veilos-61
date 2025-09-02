import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useFlagshipSanctuary } from '@/hooks/useFlagshipSanctuary';
import { FlagshipSanctuaryCreator } from '@/components/flagship/FlagshipSanctuaryCreator';
import { LiveAudioSpace } from '@/components/sanctuary/LiveAudioSpace';
import { SessionAcknowledgment } from '@/components/flagship/SessionAcknowledgment';
import { SessionWaitingRoom } from '@/components/flagship/SessionWaitingRoom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';

const FlagshipSanctuary: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const [showCreator, setShowCreator] = React.useState(!sessionId);
  const [showAcknowledgment, setShowAcknowledgment] = React.useState(false);
  const [hasAcknowledged, setHasAcknowledged] = React.useState(false);
  
  const {
    session,
    currentParticipant,
    isLoading,
    error,
    leaveSession,
    joinSession
  } = useFlagshipSanctuary({
    sessionId,
    autoJoin: false, // Don't auto-join, show acknowledgment first
    voiceModulation: true,
    moderationEnabled: true
  });

  // Check if we need to show acknowledgment screen
  React.useEffect(() => {
    if (sessionId && !hasAcknowledged && !currentParticipant) {
      const acknowledged = searchParams.get('acknowledged') === 'true';
      if (!acknowledged) {
        setShowAcknowledgment(true);
      } else {
        setHasAcknowledged(true);
      }
    }
  }, [sessionId, hasAcknowledged, currentParticipant, searchParams]);

  const handleAcknowledgmentJoin = async (acknowledged: boolean) => {
    if (acknowledged && sessionId) {
      setHasAcknowledged(true);
      setShowAcknowledgment(false);
      try {
        await joinSession(sessionId, { acknowledged: true });
      } catch (error) {
        console.error('Failed to join session:', error);
      }
    }
  };

  const handleAcknowledgmentDecline = () => {
    window.history.back();
  };

  // Show creator if no session ID
  if (!sessionId || showCreator) {
    return (
      <Layout>
        <div className="container py-8">
          <FlagshipSanctuaryCreator onClose={() => setShowCreator(false)} />
        </div>
      </Layout>
    );
  }

  // Show acknowledgment screen for new participants
  if (showAcknowledgment && session) {
    return (
      <SessionAcknowledgment
        session={session}
        onJoin={handleAcknowledgmentJoin}
        onDecline={handleAcknowledgmentDecline}
        isLoading={isLoading}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading flagship sanctuary...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show waiting room if session is scheduled
  if (session && (session.status === 'scheduled' || session.status === 'waiting') && hasAcknowledged) {
    return (
      <SessionWaitingRoom
        session={session}
        onLeave={leaveSession}
      />
    );
  }

  // Error state
  if (error || !session) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardContent className="text-center p-6">
              <h3 className="font-semibold text-lg mb-2">Session Not Available</h3>
              <p className="text-muted-foreground mb-4">
                {error || 'The sanctuary session could not be loaded.'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowCreator(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Main sanctuary interface (only show if participant is in session)
  if (!currentParticipant) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardContent className="text-center p-6">
              <h3 className="font-semibold text-lg mb-2">Access Required</h3>
              <p className="text-muted-foreground mb-4">
                Please acknowledge the session terms to participate.
              </p>
              <Button onClick={() => setShowAcknowledgment(true)}>
                Review & Join
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-4">
        <LiveAudioSpace
          session={{
            id: session.id,
            topic: session.topic,
            description: session.description,
            emoji: session.emoji,
            hostId: session.hostId,
            hostAlias: session.hostAlias,
            createdAt: session.createdAt,
            startTime: session.actualStartTime,
            isActive: session.status === 'live' || session.status === 'active',
            status: session.status === 'live' ? 'active' : session.status === 'scheduled' ? 'pending' : 'ended',
            mode: session.accessType === 'public' ? 'public' : session.accessType === 'invite_only' ? 'invite-only' : 'private',
            participants: session.participants.map(p => ({
              id: p.id,
              alias: p.alias,
              avatarIndex: p.avatarIndex,
              joinedAt: p.joinedAt,
              isHost: p.isHost,
              isMuted: p.isMuted,
              isModerator: p.isModerator,
              isBlocked: p.isBanned,
              audioLevel: p.audioLevel,
              connectionStatus: p.connectionStatus as 'connected' | 'connecting' | 'disconnected',
              handRaised: p.handRaised,
              speakingTime: p.speakingTime,
              reactions: p.reactions.map(r => ({
                id: `${p.id}-${r.timestamp}`,
                emoji: r.emoji,
                participantId: p.id,
                timestamp: r.timestamp,
                duration: r.ttl
              }))
            })),
            maxParticipants: session.maxParticipants,
            currentParticipants: session.participantCount,
            estimatedDuration: session.duration,
            tags: session.tags,
            language: session.language,
            expiresAt: session.expiresAt,
            allowAnonymous: session.allowAnonymous,
            recordingConsent: session.recordingEnabled,
            aiMonitoring: session.aiModerationEnabled,
            moderationLevel: session.moderationLevel,
            emergencyProtocols: session.emergencyProtocols && session.emergencyProtocols.length > 0,
            isRecorded: session.recordingEnabled,
            hostToken: session.hostToken,
            agoraChannelName: session.agoraChannelName,
            agoraToken: session.agoraToken,
            audioOnly: session.audioOnly,
            breakoutRooms: [],
            moderationEnabled: session.moderationEnabled,
            emergencyContactEnabled: session.emergencyContactEnabled
          }}
          currentUser={currentParticipant}
          onLeave={leaveSession}
        />
      </div>
    </Layout>
  );
};

export default FlagshipSanctuary;