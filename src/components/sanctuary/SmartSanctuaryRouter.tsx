import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SanctuaryApi, LiveSanctuaryApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

/**
 * Smart router component that detects sanctuary session type 
 * and redirects to the appropriate specialized page
 */
const SmartSanctuaryRouter: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectAndRoute = async () => {
      if (!sessionId) {
        navigate('/sanctuary');
        return;
      }

      try {
        let sessionData;
        let sessionType: 'inbox' | 'live' = 'inbox';

        // First try to get session from regular sanctuary API
        try {
          const sanctuaryResponse = await SanctuaryApi.getSession(sessionId);
          if (sanctuaryResponse.success && sanctuaryResponse.data) {
            sessionData = sanctuaryResponse.data;
            // Determine type based on mode
            sessionType = sanctuaryResponse.data.mode === 'live-audio' ? 'live' : 'inbox';
          }
        } catch (error) {
          // If not found in sanctuary API, try live sanctuary API
          const liveResponse = await LiveSanctuaryApi.getSession(sessionId);
          if (liveResponse.success && liveResponse.data) {
            sessionData = liveResponse.data;
            sessionType = 'live';
          }
        }

        if (sessionData) {
          // Redirect to the appropriate specialized route
          const targetRoute = sessionType === 'live' 
            ? `/sanctuary/live/${sessionId}`
            : `/sanctuary/submit/${sessionId}`;
          
          navigate(targetRoute, { replace: true });
        } else {
          throw new Error('Session not found');
        }
      } catch (error) {
        console.error('Error detecting sanctuary session type:', error);
        toast({
          title: "Session not found",
          description: "The sanctuary session may have expired or been removed.",
          variant: "destructive"
        });
        navigate('/sanctuary');
      } finally {
        setIsLoading(false);
      }
    };

    detectAndRoute();
  }, [sessionId, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sanctuary...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default SmartSanctuaryRouter;