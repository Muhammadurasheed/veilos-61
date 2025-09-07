import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, Shield, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { LiveParticipant } from '@/types/sanctuary';

interface EnhancedMuteControlsProps {
  isHost: boolean;
  participants: LiveParticipant[];
  currentParticipant?: LiveParticipant;
  onHostMuteParticipant: (participantId: string, shouldMute: boolean) => void;
  onHostMuteAll: () => void;
  onHostUnmuteAll: () => void;
}

export const EnhancedMuteControls: React.FC<EnhancedMuteControlsProps> = ({
  isHost,
  participants,
  currentParticipant,
  onHostMuteParticipant,
  onHostMuteAll,
  onHostUnmuteAll
}) => {
  if (!isHost) return null;

  const nonHostParticipants = participants.filter(p => !p.isHost && p.id !== currentParticipant?.id);
  const mutedParticipants = nonHostParticipants.filter(p => p.isMuted || p.hostMuted);
  const unmutedParticipants = nonHostParticipants.filter(p => !p.isMuted && !p.hostMuted);

  return (
    <div className="flex items-center space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Moderation
            <Badge variant="secondary" className="ml-2">
              {nonHostParticipants.length}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Participant Controls</h4>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onHostMuteAll}
                  disabled={mutedParticipants.length === nonHostParticipants.length}
                  title="Mute all participants"
                >
                  <VolumeX className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onHostUnmuteAll}
                  disabled={mutedParticipants.length === 0}
                  title="Unmute all participants"
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Total participants: {nonHostParticipants.length}</span>
                <span>Muted: {mutedParticipants.length}</span>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {nonHostParticipants.map((participant) => (
                <div 
                  key={participant.id} 
                  className="flex items-center justify-between p-2 rounded bg-muted/30"
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {participant.isMuted || participant.hostMuted ? (
                        <MicOff className="h-3 w-3 text-destructive" />
                      ) : (
                        <Mic className="h-3 w-3 text-green-500" />
                      )}
                      <span className="text-sm font-medium truncate max-w-24">
                        {participant.alias}
                      </span>
                    </div>
                    
                    {participant.hostMuted && (
                      <Badge variant="destructive" className="text-xs px-1">
                        Host Muted
                      </Badge>
                    )}
                    
                    {participant.isMuted && !participant.hostMuted && (
                      <Badge variant="secondary" className="text-xs px-1">
                        Self Muted
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onHostMuteParticipant(
                      participant.id, 
                      !(participant.isMuted || participant.hostMuted)
                    )}
                    className="h-6 w-6 p-0"
                  >
                    {participant.isMuted || participant.hostMuted ? (
                      <Volume2 className="h-3 w-3" />
                    ) : (
                      <VolumeX className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
              
              {nonHostParticipants.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-4">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No other participants in the session
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};