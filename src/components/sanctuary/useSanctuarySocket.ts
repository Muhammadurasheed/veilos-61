import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSanctuarySocketProps {
  sessionId: string;
  participantId: string;
  participantAlias: string;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
  onHandRaised?: (data: any) => void;
  onSpeakerPromoted?: (data: any) => void;
  onParticipantMuted?: (data: any) => void;
  onParticipantKicked?: (data: any) => void;
  onEmojiReaction?: (data: any) => void;
  onEmergencyAlert?: (data: any) => void;
  onForceReconnect?: () => void;
}

export const useSanctuarySocket = ({
  sessionId,
  participantId,
  participantAlias,
  onParticipantJoined,
  onParticipantLeft,
  onHandRaised,
  onSpeakerPromoted,
  onParticipantMuted,
  onParticipantKicked,
  onEmojiReaction,
  onEmergencyAlert,
  onForceReconnect
}: UseSanctuarySocketProps) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(process.env.VITE_BACKEND_URL || 'http://localhost:3000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socketRef.current = socket;

    // Join audio room
    socket.emit('join_audio_room', {
      sessionId,
      participant: {
        id: participantId,
        alias: participantAlias,
        isHost: false,
        isModerator: false
      }
    });

    // Set up event listeners
    socket.on('audio_participant_joined', onParticipantJoined || (() => {}));
    socket.on('audio_participant_left', onParticipantLeft || (() => {}));
    socket.on('hand_raised', onHandRaised || (() => {}));
    socket.on('speaker_promoted', onSpeakerPromoted || (() => {}));
    socket.on('participant_muted', onParticipantMuted || (() => {}));
    socket.on('participant_kicked', onParticipantKicked || (() => {}));
    socket.on('emoji_reaction', onEmojiReaction || (() => {}));
    socket.on('emergency_alert', onEmergencyAlert || (() => {}));
    
    // Handle force disconnect
    socket.on('kicked_from_room', () => {
      onForceReconnect?.();
    });

    socket.on('force_muted', () => {
      console.log('Force muted by moderator');
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, participantId, participantAlias]);

  // Socket action methods
  const raiseHand = (isRaised: boolean) => {
    socketRef.current?.emit('raise_hand', { sessionId, isRaised });
  };

  const promoteToSpeaker = (participantId: string) => {
    socketRef.current?.emit('promote_to_speaker', { sessionId, participantId });
  };

  const muteParticipant = (participantId: string) => {
    socketRef.current?.emit('mute_participant', { sessionId, participantId });
  };

  const kickParticipant = (participantId: string) => {
    socketRef.current?.emit('kick_participant', { sessionId, participantId });
  };

  const sendEmojiReaction = (emoji: string) => {
    socketRef.current?.emit('send_emoji_reaction', { sessionId, emoji });
  };

  const sendEmergencyAlert = (alertType: string, message: string) => {
    socketRef.current?.emit('emergency_alert', { sessionId, alertType, message });
  };

  return {
    raiseHand,
    promoteToSpeaker,
    muteParticipant,
    kickParticipant,
    sendEmojiReaction,
    sendEmergencyAlert
  };
};