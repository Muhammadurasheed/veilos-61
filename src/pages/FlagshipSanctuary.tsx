import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useFlagshipSanctuary } from '@/hooks/useFlagshipSanctuary';
import { FlagshipSanctuaryCreator } from '@/components/flagship/FlagshipSanctuaryCreator';
import { EnhancedLiveAudioSpace } from '@/components/sanctuary/EnhancedLiveAudioSpace';
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
  const [countdownComplete, setCountdownComplete] = React.useState(false);
  const smartJoinTriggeredRef = React.useRef(false);
  
  const {
    session,
    currentParticipant,
    isLoading,
    error,
    leaveSession,
    joinSession,
    joinStatus
  } = useFlagshipSanctuary({
    sessionId,
    autoJoin: false,
    voiceModulation: true,
    moderationEnabled: true
  });

// Decide to show acknowledgment screen proactively (no URL auto-ack)
React.useEffect(() => {
  if (sessionId && !hasAcknowledged && !currentParticipant) {
    setShowAcknowledgment(true);
  }
}, [sessionId, hasAcknowledged, currentParticipant]);

  const handleAcknowledgmentJoin = async (acknowledged: boolean) => {
    if (acknowledged && sessionId && !hasAcknowledged) {
      console.log('🎯 Starting acknowledgment flow for session:', sessionId);
      setHasAcknowledged(true);
      setShowAcknowledgment(false);
      
      try {
        // Directly join via hook to avoid double backend calls
        const success = await joinSession(sessionId, { acknowledged: true });
        
        if (success) {
          console.log('✅ Acknowledgment: Successfully joined session');
        } else {
          console.error('❌ Acknowledgment: Join failed');
          // Reset acknowledgment state on failure
          setHasAcknowledged(false);
          setShowAcknowledgment(true);
        }
      } catch (error) {
        console.error('❌ Failed to join session:', error);
        // Reset acknowledgment state on failure
        setHasAcknowledged(false);
        setShowAcknowledgment(true);
      }
    }
  };

  const handleAcknowledgmentDecline = () => {
    window.history.back();
  };

// Auto-join effect for direct access (not needed for scheduled sessions)
React.useEffect(() => {
  const isDirectAccess = !searchParams.get('scheduled');
  
  if (sessionId && session && !currentParticipant && !hasAcknowledged && 
      joinStatus !== 'joining' && joinStatus !== 'joined' && isDirectAccess) {
    
    console.log('🎯 Auto-join for direct access to session:', sessionId);
    
    // For direct access, join immediately without acknowledgment
    joinSession(sessionId, { acknowledged: true }).catch(error => {
      console.error('❌ Auto-join failed:', error);
    });
  }
}, [sessionId, session, currentParticipant, hasAcknowledged, joinStatus, joinSession, searchParams]);

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

  // Check if session is scheduled but not yet started
  const isWaitingForScheduledStart = session && 
    session.scheduledDateTime && 
    new Date(session.scheduledDateTime) > new Date() &&
    (session.status === 'scheduled' || session.status === 'waiting');

  // Check if this is an instant session (no scheduled time)
  const isInstantSession = session && !session.scheduledDateTime;
  const timeReachedNow = session?.scheduledDateTime ? new Date(session.scheduledDateTime) <= new Date() : false;

  // Show waiting room for scheduled sessions that haven't started yet
if (isWaitingForScheduledStart) {
  return (
    <SessionWaitingRoom
      session={session}
      onLeave={leaveSession}
      onCountdownComplete={() => {
        setCountdownComplete(true);
        setShowAcknowledgment(true);
      }}
    />
  );
}

// For instant sessions or when scheduled time is reached, show acknowledgment if needed
const canJoinNow = !!session && (isInstantSession || timeReachedNow || session.status === 'live' || session.status === 'active');
if (session && !hasAcknowledged && !currentParticipant && canJoinNow) {
  if (showAcknowledgment) {
    return (
      <SessionAcknowledgment
        session={session}
        onJoin={handleAcknowledgmentJoin}
        onDecline={handleAcknowledgmentDecline}
        isLoading={isLoading}
      />
    );
  } else {
    // Avoid "Access Required" flicker while turning on acknowledgment
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Preparing to join…</p>
          </div>
        </div>
      </Layout>
    );
  }
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

  // Show transitional state while joining/starting
  if (joinStatus === 'joining' || joinStatus === 'starting') {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {joinStatus === 'starting' ? 'Starting your sanctuary…' : 'Joining sanctuary…'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

// Main sanctuary interface (only show if participant is in session)
if (!currentParticipant) {
  // If we can join now, avoid showing the Access card to prevent flicker
  if (canJoinNow) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Preparing to join…</p>
          </div>
        </div>
      </Layout>
    );
  }

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
        <EnhancedLiveAudioSpace
          session={session}
          currentParticipant={currentParticipant}
          onLeave={leaveSession}
        />
      </div>
    </Layout>
  );
};

export default FlagshipSanctuary;