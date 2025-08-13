import { useState, useEffect, useCallback, useRef } from 'react';
import AgoraRTC, { 
  IAgoraRTCClient, 
  IMicrophoneAudioTrack, 
  IAgoraRTCRemoteUser,
  ClientRole
} from 'agora-rtc-sdk-ng';
import { useToast } from '@/hooks/use-toast';

interface AgoraConfig {
  appId: string;
  channel: string;
  token: string;
  uid?: string | number;
}

interface AudioStats {
  networkQuality: number;
  audioLevel: number;
  packetLoss: number;
  rtt: number;
}

interface ParticipantAudio {
  uid: string | number;
  alias: string;
  isMuted: boolean;
  audioLevel: number;
  isSpeaking: boolean;
}

export const useAgoraAudio = (config: AgoraConfig) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [participants, setParticipants] = useState<ParticipantAudio[]>([]);
  const [audioStats, setAudioStats] = useState<AudioStats>({
    networkQuality: 0,
    audioLevel: 0,
    packetLoss: 0,
    rtt: 0
  });
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>('disconnected');

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Initialize Agora client
  useEffect(() => {
    if (!config.appId || !config.channel) return;

    const client = AgoraRTC.createClient({ 
      mode: 'rtc', 
      codec: 'vp8',
      role: 'audience' // Start as audience, promote to host when needed
    });

    // Enhanced audio settings for voice chat
    AgoraRTC.setLogLevel(2); // Warning level
    
    clientRef.current = client;

    // Event listeners
    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-joined', handleUserJoined);
    client.on('user-left', handleUserLeft);
    client.on('connection-state-changed', handleConnectionStateChanged);
    client.on('network-quality', handleNetworkQuality);
    client.on('exception', handleException);

    return () => {
      cleanup();
    };
  }, [config.appId, config.channel]);

  const handleUserPublished = useCallback(async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (mediaType === 'audio') {
      try {
        await clientRef.current?.subscribe(user, mediaType);
        const audioTrack = user.audioTrack;
        
        if (audioTrack) {
          audioTrack.play();
          
          // Add participant to list
          setParticipants(prev => [
            ...prev.filter(p => p.uid !== user.uid),
            {
              uid: user.uid,
              alias: `User ${user.uid}`, // This would come from user metadata
              isMuted: false,
              audioLevel: 0,
              isSpeaking: false
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to subscribe to user:', error);
        toast({
          title: "Audio Error",
          description: "Failed to receive audio from a participant",
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  const handleUserUnpublished = useCallback((user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (mediaType === 'audio') {
      setParticipants(prev => prev.filter(p => p.uid !== user.uid));
    }
  }, []);

  const handleUserJoined = useCallback((user: IAgoraRTCRemoteUser) => {
    console.log('User joined:', user.uid);
  }, []);

  const handleUserLeft = useCallback((user: IAgoraRTCRemoteUser, reason: string) => {
    console.log('User left:', user.uid, reason);
    setParticipants(prev => prev.filter(p => p.uid !== user.uid));
  }, []);

  const handleConnectionStateChanged = useCallback((curState: string, revState: string, reason?: string) => {
    console.log('Connection state changed:', curState, revState, reason);
    
    if (curState === 'CONNECTED') {
      setIsConnected(true);
      setConnectionQuality('excellent');
      reconnectAttemptsRef.current = 0;
    } else if (curState === 'DISCONNECTED') {
      setIsConnected(false);
      setConnectionQuality('disconnected');
      
      // Auto-reconnect logic
      if (reason === 'LEAVE') return; // User intentionally left
      
      if (reconnectAttemptsRef.current < 3) {
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 2000 * reconnectAttemptsRef.current);
      }
    } else if (curState === 'RECONNECTING') {
      setConnectionQuality('poor');
      toast({
        title: "Reconnecting",
        description: "Attempting to restore audio connection...",
      });
    }
  }, []);

  const handleNetworkQuality = useCallback((stats: any) => {
    const quality = stats.uplinkNetworkQuality;
    setAudioStats(prev => ({
      ...prev,
      networkQuality: quality,
      packetLoss: stats.packetLoss || 0,
      rtt: stats.rtt || 0
    }));

    // Update connection quality indicator
    if (quality >= 4) setConnectionQuality('excellent');
    else if (quality >= 2) setConnectionQuality('good');
    else setConnectionQuality('poor');
  }, []);

  const handleException = useCallback((evt: any) => {
    console.error('Agora exception:', evt);
    toast({
      title: "Audio Error",
      description: "An audio issue occurred. Attempting to recover...",
      variant: "destructive"
    });
  }, [toast]);

  const connect = useCallback(async () => {
    if (!clientRef.current || !config.appId || !config.channel) return;

    setIsLoading(true);
    
    try {
      // Join channel
      await clientRef.current.join(
        config.appId,
        config.channel,
        config.token || null,
        config.uid || null
      );

      toast({
        title: "Connected",
        description: "Successfully joined the audio sanctuary",
      });

    } catch (error) {
      console.error('Failed to connect:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to join the audio room. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [config, toast]);

  const disconnect = useCallback(async () => {
    if (!clientRef.current) return;

    try {
      await cleanup();
      toast({
        title: "Disconnected",
        description: "Left the audio sanctuary",
      });
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }, [toast]);

  const startMicrophone = useCallback(async () => {
    if (!clientRef.current) return;

    try {
      // Set client role to host to enable publishing
      await clientRef.current.setClientRole('host');
      
      // Create audio track with enhanced settings
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'high_quality_stereo',
        ANS: true, // Agora Noise Suppression
        AEC: true, // Agora Echo Cancellation
        AGC: true, // Agora Gain Control
      });

      localAudioTrackRef.current = audioTrack;

      // Publish audio track
      await clientRef.current.publish([audioTrack]);
      
      setIsMuted(false);

      // Start audio level monitoring
      audioLevelIntervalRef.current = setInterval(() => {
        const level = audioTrack.getVolumeLevel() * 100;
        setAudioStats(prev => ({ ...prev, audioLevel: level }));
      }, 100);

      toast({
        title: "Microphone On",
        description: "You can now speak in the sanctuary",
      });

    } catch (error) {
      console.error('Failed to start microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopMicrophone = useCallback(async () => {
    if (!clientRef.current || !localAudioTrackRef.current) return;

    try {
      // Stop audio level monitoring
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
        audioLevelIntervalRef.current = null;
      }

      // Unpublish and close track
      await clientRef.current.unpublish([localAudioTrackRef.current]);
      localAudioTrackRef.current.close();
      localAudioTrackRef.current = null;

      // Set back to audience
      await clientRef.current.setClientRole('audience');

      setIsMuted(true);
      setAudioStats(prev => ({ ...prev, audioLevel: 0 }));

      toast({
        title: "Microphone Off",
        description: "You are now muted",
      });

    } catch (error) {
      console.error('Failed to stop microphone:', error);
    }
  }, [toast]);

  const toggleMicrophone = useCallback(async () => {
    if (isMuted) {
      await startMicrophone();
    } else {
      await stopMicrophone();
    }
  }, [isMuted, startMicrophone, stopMicrophone]);

  const adjustVolume = useCallback((uid: string | number, volume: number) => {
    const remoteUser = clientRef.current?.remoteUsers.find(user => user.uid === uid);
    if (remoteUser?.audioTrack) {
      remoteUser.audioTrack.setVolume(volume);
    }
  }, []);

  const cleanup = useCallback(async () => {
    // Clear intervals and timeouts
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close local tracks
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.close();
      localAudioTrackRef.current = null;
    }

    // Leave channel and cleanup
    if (clientRef.current) {
      await clientRef.current.leave();
      clientRef.current.removeAllListeners();
      clientRef.current = null;
    }

    // Reset state
    setIsConnected(false);
    setIsMuted(true);
    setParticipants([]);
    setConnectionQuality('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);

  return {
    // Connection state
    isConnected,
    isLoading,
    connectionQuality,
    
    // Audio state
    isMuted,
    participants,
    audioStats,
    
    // Actions
    connect,
    disconnect,
    toggleMicrophone,
    startMicrophone,
    stopMicrophone,
    adjustVolume,
    
    // Advanced features
    cleanup
  };
};