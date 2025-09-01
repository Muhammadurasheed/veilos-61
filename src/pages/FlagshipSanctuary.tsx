import React from 'react';
import { useParams } from 'react-router-dom';
import { useFlagshipSanctuary } from '@/hooks/useFlagshipSanctuary';
import { FlagshipSanctuaryCreator } from '@/components/flagship/FlagshipSanctuaryCreator';
import { LiveAudioSpace } from '@/components/sanctuary/LiveAudioSpace';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';

const FlagshipSanctuary: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [showCreator, setShowCreator] = React.useState(!sessionId);
  
  const {
    session,
    currentParticipant,
    isLoading,
    error,
    leaveSession
  } = useFlagshipSanctuary({
    sessionId,
    autoJoin: !!sessionId,
    voiceModulation: true,
    moderationEnabled: true
  });

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

  // Error state
  if (error || !session || !currentParticipant) {
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

  // Main sanctuary interface
  return (
    <Layout>
      <div className="container py-4">
        <LiveAudioSpace
          session={{
            ...session,
            isActive: session.status === 'live',
            mode: session.accessType === 'public' ? 'public' : 'private'
          }}
          currentUser={currentParticipant}
          onLeave={leaveSession}
        />
      </div>
    </Layout>
  );
};

export default FlagshipSanctuary;