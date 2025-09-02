import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  Users, 
  Shield, 
  Mic, 
  Volume2, 
  CheckCircle,
  AlertTriangle,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { FlagshipSanctuarySession } from '@/types/flagship-sanctuary';

interface SessionAcknowledgmentProps {
  session: FlagshipSanctuarySession;
  onJoin: (acknowledgment: boolean) => Promise<void>;
  onDecline: () => void;
  isLoading: boolean;
}

export const SessionAcknowledgment: React.FC<SessionAcknowledgmentProps> = ({
  session,
  onJoin,
  onDecline,
  isLoading
}) => {
  const { toast } = useToast();
  const [acknowledged, setAcknowledged] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState<string>('');

  useEffect(() => {
    if (session.scheduledDateTime) {
      const updateCountdown = () => {
        const scheduled = new Date(session.scheduledDateTime!);
        const now = new Date();
        
        if (scheduled > now) {
          setTimeUntilStart(formatDistanceToNow(scheduled, { addSuffix: true }));
        } else {
          setTimeUntilStart('Session is ready to start');
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [session.scheduledDateTime]);

  const handleJoin = async () => {
    if (!acknowledged) {
      toast({
        title: "Acknowledgment Required",
        description: "Please acknowledge the session guidelines before joining",
        variant: "destructive"
      });
      return;
    }

    try {
      await onJoin(acknowledged);
    } catch (error) {
      toast({
        title: "Failed to Join",
        description: "Could not join the session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isScheduled = session.status === 'scheduled' && session.scheduledDateTime;
  const scheduledTime = session.scheduledDateTime ? new Date(session.scheduledDateTime) : null;
  const isLive = session.status === 'live' || session.status === 'active';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-2">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <CardTitle className="text-2xl mb-2">
              {session.emoji} {session.topic}
            </CardTitle>
            {session.description && (
              <p className="text-muted-foreground">{session.description}</p>
            )}
          </div>

          <div className="flex items-center justify-center space-x-4">
            <Badge variant={isLive ? "default" : "secondary"} className="px-3 py-1">
              {isLive ? "🔴 Live Now" : isScheduled ? "📅 Scheduled" : "⏳ Waiting"}
            </Badge>
            <Badge variant="outline">
              {session.accessType === 'public' ? '🌍 Public' : 
               session.accessType === 'invite_only' ? '🔗 Invite Only' : '🔒 Private'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Session Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/avatar-1.svg" />
                  <AvatarFallback>
                    {session.hostAlias.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{session.hostAlias}</p>
                  <p className="text-xs text-muted-foreground">Host</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <Users className="h-4 w-4" />
                <span>{session.participantCount || 0} / {session.maxParticipants} participants</span>
              </div>
            </div>

            <div className="space-y-3">
              {scheduledTime && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{format(scheduledTime, 'MMM dd, yyyy')}</span>
                </div>
              )}

              {scheduledTime && (
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{format(scheduledTime, 'HH:mm')}</span>
                </div>
              )}

              {session.duration && (
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{session.duration} minutes</span>
                </div>
              )}
            </div>
          </div>

          {/* Countdown */}
          {isScheduled && timeUntilStart && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Session starts</p>
                  <p className="font-semibold text-primary">{timeUntilStart}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Guidelines & Features */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Session Features & Guidelines
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Anonymous participation</span>
              </div>
              
              {session.voiceModulationEnabled && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Voice modulation available</span>
                </div>
              )}

              {session.moderationEnabled && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>AI-powered moderation</span>
                </div>
              )}

              {session.audioOnly && (
                <div className="flex items-center space-x-2">
                  <Mic className="h-4 w-4 text-blue-500" />
                  <span>Audio-only session</span>
                </div>
              )}

              {session.emergencyContactEnabled && (
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  <span>Emergency support available</span>
                </div>
              )}

              {session.recordingEnabled && (
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span>Session may be recorded</span>
                </div>
              )}
            </div>

            {/* Privacy Notice */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-start space-x-2">
                  <EyeOff className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Privacy & Safety</p>
                    <p>Your identity remains anonymous. Voice modulation and AI moderation help ensure a safe environment. Emergency protocols are active for crisis situations.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Acknowledgment */}
          <div className="space-y-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1"
              />
              <div className="text-sm">
                <p className="font-medium">I acknowledge that:</p>
                <ul className="mt-1 text-muted-foreground space-y-1">
                  <li>• I understand this is an anonymous support session</li>
                  <li>• I will respect other participants and maintain confidentiality</li>
                  <li>• I agree to follow community guidelines and safety protocols</li>
                  {session.recordingEnabled && (
                    <li>• I consent to potential session recording for safety purposes</li>
                  )}
                </ul>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleJoin}
              disabled={!acknowledged || isLoading}
              className="flex-1"
              size="lg"
            >
              {isLoading ? (
                "Joining..."
              ) : isLive ? (
                "Join Live Session"
              ) : (
                "Join Session"
              )}
            </Button>
            
            <Button
              onClick={onDecline}
              variant="outline"
              size="lg"
              disabled={isLoading}
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};