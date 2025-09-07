import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useFlagshipSanctuary } from '@/hooks/useFlagshipSanctuary';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';
import { FlagshipSanctuaryCreator } from '@/components/flagship/FlagshipSanctuaryCreator';
import { EnhancedLiveAudioSpace } from '@/components/sanctuary/EnhancedLiveAudioSpace';
import { SessionAcknowledgment } from '@/components/flagship/SessionAcknowledgment';
import { SessionWaitingRoom } from '@/components/flagship/SessionWaitingRoom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Plus, UserPlus, LogIn } from 'lucide-react';

const FlagshipSanctuary: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [showCreator, setShowCreator] = React.useState(!sessionId);
  const [showAcknowledgment, setShowAcknowledgment] = React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const [hasAcknowledged, setHasAcknowledged] = React.useState(false);
  const [countdownComplete, setCountdownComplete] = React.useState(false);
  const smartJoinTriggeredRef = React.useRef(false);
  const acknowledgmentShownRef = React.useRef(false);
  const sessionParticipantKey = React.useRef<string | null>(null);
  
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
    autoJoin: false, // Load session data but don't auto-join
    voiceModulation: true,
    moderationEnabled: true
  });

// Handle session participant persistence
React.useEffect(() => {
  if (sessionId && user?.id) {
    sessionParticipantKey.current = `session_participant_${sessionId}_${user.id}`;
    const participantData = localStorage.getItem(sessionParticipantKey.current);
    if (participantData) {
      try {
        const data = JSON.parse(participantData);
        setHasAcknowledged(data.acknowledged || false);
        console.log('🔄 Restored participant state for:', user.alias);
      } catch (error) {
        console.warn('Failed to parse participant data:', error);
      }
    }
  }
}, [sessionId, user?.id]);

  // Authentication guard - check if user is logged in and redirect immediately
  React.useEffect(() => {
    if (!authLoading && sessionId && !isAuthenticated && session) {
      console.log('🔒 User not authenticated, redirecting to auth');
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/auth?mode=login&returnTo=${returnUrl}`);
      return;
    }
  }, [authLoading, sessionId, isAuthenticated, session, navigate]);

// Smart acknowledgment display logic - show only AFTER conversion is complete
React.useEffect(() => {
  if (!sessionId || !session || acknowledgmentShownRef.current) return;
  
  // Don't show acknowledgment during scheduled countdown - wait for conversion
  const isScheduledButNotStarted = session.scheduledDateTime && 
    new Date(session.scheduledDateTime) > new Date() &&
    (session.status === 'scheduled' || session.status === 'waiting');
    
  if (isScheduledButNotStarted) {
    console.log('⏳ Session is scheduled but not started yet, waiting...');
    return;
  }
  
  const canJoinNow = !session.scheduledDateTime || 
    new Date(session.scheduledDateTime) <= new Date() || 
    session.status === 'live' || 
    session.status === 'active';
    
  if (canJoinNow && !hasAcknowledged && !currentParticipant && isAuthenticated && !showAcknowledgment) {
    console.log('📋 Showing acknowledgment screen (conversion complete)');
    acknowledgmentShownRef.current = true;
    setShowAcknowledgment(true);
  }
}, [sessionId, session, hasAcknowledged, currentParticipant, isAuthenticated, showAcknowledgment]);

  const handleAcknowledgmentJoin = async (acknowledged: boolean) => {
    if (acknowledged && sessionId && user?.id) {
      // Prevent duplicate acknowledgments
      if (hasAcknowledged) {
        console.log('⚠️ User already acknowledged, preventing duplicate join');
        return;
      }
      
      setHasAcknowledged(true);
      setShowAcknowledgment(false);
      
      // Persist acknowledgment state
      if (sessionParticipantKey.current) {
        localStorage.setItem(sessionParticipantKey.current, JSON.stringify({
          acknowledged: true,
          timestamp: new Date().toISOString(),
          userId: user.id
        }));
      }
      
      try {
        // Use smart join logic for acknowledgment flow to handle session conversion
        const { FlagshipSessionManager } = await import('@/services/flagshipSessionManager');
        const result = await FlagshipSessionManager.joinSessionSmart(sessionId, { 
          acknowledged: true,
          alias: user.alias,
          participantId: user.id
        });
        
        if (result.success) {
          if (result.needsRedirect && result.redirectUrl) {
            console.log('🔄 Acknowledgment: Redirecting to converted session:', result.redirectUrl);
            window.location.replace(result.redirectUrl);
            return;
          }
          
          console.log('✅ Acknowledgment: Smart join successful, updating frontend state...');
          
          // Smart join succeeded, now update frontend state via hook's joinSession
          const hookJoinSuccess = await joinSession(sessionId, { 
            acknowledged: true,
            alias: user.alias,
            participantId: user.id
          });
          
          if (!hookJoinSuccess) {
            console.warn('⚠️ Smart join succeeded but hook join failed - user may already be in session');
          }
          
        } else {
          console.error('❌ Acknowledgment: Smart join failed:', result.error);
          // Fallback to regular join
          await joinSession(sessionId, { acknowledged: true, alias: user.alias, participantId: user.id });
        }
      } catch (error) {
        console.error('❌ Failed to join session:', error);
        // Fallback to regular join
        try {
          await joinSession(sessionId, { acknowledged: true, alias: user.alias, participantId: user.id });
        } catch (fallbackError) {
          console.error('❌ Fallback join also failed:', fallbackError);
        }
      }
    }
  };

  const handleAcknowledgmentDecline = () => {
    window.history.back();
  };

// Auto-join only after explicit acknowledgment by the user - prevent double calls
React.useEffect(() => {
  if (!sessionId || !session || currentParticipant || !isAuthenticated || !user?.id) return;
  if (smartJoinTriggeredRef.current) return;
  
  const acknowledged = hasAcknowledged; // do not trust URL params
  const timeReached = session.scheduledDateTime && new Date(session.scheduledDateTime) <= new Date();
  const sessionLive = session.status === 'live' || session.status === 'active';
  
  if (acknowledged && (sessionLive || timeReached) && joinStatus === 'idle') {
    console.log('🎯 Starting auto-join process...');
    smartJoinTriggeredRef.current = true;
      
      const handleSmartJoin = async () => {
        try {
          const { FlagshipSessionManager } = await import('@/services/flagshipSessionManager');
          const result = await FlagshipSessionManager.joinSessionSmart(sessionId, { 
            acknowledged: true,
            alias: user.alias,
            participantId: user.id
          });
          
          if (result.success) {
            if (result.needsRedirect && result.redirectUrl) {
              console.log('🔄 Redirecting to converted session:', result.redirectUrl);
              window.location.replace(result.redirectUrl);
              return;
            }
            
            console.log('✅ Auto-join: Smart join successful, updating frontend state...');
            
            // Smart join succeeded, now update frontend state via hook's joinSession
            const hookJoinSuccess = await joinSession(sessionId, { 
              acknowledged: true,
              alias: user.alias,
              participantId: user.id
            });
            
            if (!hookJoinSuccess) {
              console.warn('⚠️ Auto-join: Smart join succeeded but hook join failed - user may already be in session');
            }
            
          } else {
            console.error('❌ Auto-join: Smart join failed:', result.error);
            // Fallback to regular join
            try {
              await joinSession(sessionId, { acknowledged: true, alias: user.alias, participantId: user.id });
            } catch (fallbackError) {
              console.error('❌ Auto-join: Fallback join also failed:', fallbackError);
            }
          }
        } catch (error) {
          console.error('❌ Auto-join: Failed to load session manager:', error);
          // Fallback to regular join
          try {
            await joinSession(sessionId, { acknowledged: true, alias: user.alias, participantId: user.id });
          } catch (fallbackError) {
            console.error('❌ Auto-join: Fallback join also failed:', fallbackError);
          }
        }
      };

      handleSmartJoin();
    }
}, [sessionId, session, currentParticipant, hasAcknowledged, joinStatus, joinSession, isAuthenticated, user]);

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

  // This logic is now handled in the waiting room section below

  // Loading state
  if (isLoading || authLoading) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {authLoading ? 'Authenticating...' : 'Loading flagship sanctuary...'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // This is handled by the redirect effect above, no need for dialog
  const AuthDialog = () => null;

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
        console.log('⏰ Countdown complete - session should convert automatically');
        setCountdownComplete(true);
        // Don't set showAcknowledgment here - let it be handled after conversion
      }}
    />
  );
}

// For instant sessions or when scheduled time is reached, show acknowledgment if needed
const canJoinNow = !!session && (isInstantSession || timeReachedNow || session.status === 'live' || session.status === 'active');

// Only show acknowledgment once per session to prevent double acknowledgment
if (session && !hasAcknowledged && !currentParticipant && canJoinNow && showAcknowledgment && isAuthenticated) {
  return (
    <>
      <SessionAcknowledgment
        session={session}
        onJoin={handleAcknowledgmentJoin}
        onDecline={handleAcknowledgmentDecline}
        isLoading={isLoading}
      />
      <AuthDialog />
    </>
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
            participants: (session.participants || []).map(p => ({
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
              reactions: (p.reactions || []).map(r => ({
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
            aiMonitoring: session.moderationEnabled,
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
      <AuthDialog />
    </Layout>
  );
};

export default FlagshipSanctuary;