import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
  ILocalAudioTrack
} from 'agora-rtc-sdk-ng';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Monitor, 
  MonitorOff,
  Volume2,
  VolumeX,
  Clock,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AgoraVideoCallProps {
  meetingId: string;
  channelName: string;
  token: string;
  appId: string;
  uid: string;
  expertName: string;
  isExpert?: boolean;
  onEndCall: () => void;
  onCallStarted?: () => void;
  onCallEnded?: () => void;
}

export const AgoraVideoCall: React.FC<AgoraVideoCallProps> = ({
  meetingId,
  channelName,
  token,
  appId,
  uid,
  expertName,
  isExpert = false,
  onEndCall,
  onCallStarted,
  onCallEnded
}) => {
  const [client, setClient] = useState<IAgoraRTCClient>();
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack>();
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack>();
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [showEndCallConfirm, setShowEndCallConfirm] = useState(false);
  const [callQuality, setCallQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const callStartTimeRef = useRef<number>();
  const durationIntervalRef = useRef<NodeJS.Timeout>();
  
  const { toast } = useToast();

  useEffect(() => {
    if (!appId) {
      toast({
        title: "Configuration Error",
        description: "Agora App ID is required. Please contact support.",
        variant: "destructive"
      });
      return;
    }

    initializeAgora();

    return () => {
      cleanup();
    };
  }, [appId, channelName, token, uid]);

  useEffect(() => {
    // Start call duration timer when connected
    if (connectionState === 'connected' && !callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        if (callStartTimeRef.current) {
          setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
        }
      }, 1000);
      onCallStarted?.();
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [connectionState, onCallStarted]);

  const initializeAgora = async () => {
    try {
      // Create Agora client
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(agoraClient);

      // Set up event listeners
      agoraClient.on('user-published', handleUserPublished);
      agoraClient.on('user-unpublished', handleUserUnpublished);
      agoraClient.on('user-left', handleUserLeft);
      agoraClient.on('connection-state-change', handleConnectionStateChange);
      agoraClient.on('network-quality', handleNetworkQuality);

      // Join channel
      await agoraClient.join(appId, channelName, token, uid);
      setConnectionState('connected');

      // Create and publish local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      // Play local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      // Publish tracks
      await agoraClient.publish([audioTrack, videoTrack]);

      toast({
        title: "Connected",
        description: "Successfully joined the meeting"
      });

    } catch (error) {
      console.error('Failed to initialize Agora:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to join the meeting. Please try again.",
        variant: "destructive"
      });
      setConnectionState('disconnected');
    }
  };

  const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'video' | 'audio') => {
    if (!client) return;

    await client.subscribe(user, mediaType);
    
    if (mediaType === 'video' && remoteVideoRef.current) {
      user.videoTrack?.play(remoteVideoRef.current);
    }
    
    if (mediaType === 'audio') {
      user.audioTrack?.play();
    }

    setRemoteUsers(users => {
      const existingUser = users.find(u => u.uid === user.uid);
      if (existingUser) {
        return users.map(u => u.uid === user.uid ? user : u);
      }
      return [...users, user];
    });
  };

  const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: 'video' | 'audio') => {
    // Handle user unpublishing media
    setRemoteUsers(users => users.map(u => u.uid === user.uid ? user : u));
  };

  const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
    setRemoteUsers(users => users.filter(u => u.uid !== user.uid));
  };

  const handleConnectionStateChange = (curState: string) => {
    console.log('Connection state changed to:', curState);
    if (curState === 'CONNECTED') {
      setConnectionState('connected');
    } else if (curState === 'DISCONNECTED') {
      setConnectionState('disconnected');
    }
  };

  const handleNetworkQuality = (stats: any) => {
    // Update call quality based on network stats
    const uplinkQuality = stats.uplinkNetworkQuality;
    if (uplinkQuality <= 2) {
      setCallQuality('excellent');
    } else if (uplinkQuality <= 3) {
      setCallQuality('good');
    } else if (uplinkQuality <= 4) {
      setCallQuality('fair');
    } else {
      setCallQuality('poor');
    }
  };

  const toggleVideo = async () => {
    if (!localVideoTrack) return;

    if (isVideoEnabled) {
      await localVideoTrack.setEnabled(false);
      setIsVideoEnabled(false);
    } else {
      await localVideoTrack.setEnabled(true);
      setIsVideoEnabled(true);
    }
  };

  const toggleAudio = async () => {
    if (!localAudioTrack) return;

    if (isAudioEnabled) {
      await localAudioTrack.setEnabled(false);
      setIsAudioEnabled(false);
    } else {
      await localAudioTrack.setEnabled(true);
      setIsAudioEnabled(true);
    }
  };

  const toggleScreenShare = async () => {
    if (!client) return;

    try {
      if (!isScreenSharing) {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "auto");
        
        if (localVideoTrack) {
          await client.unpublish(localVideoTrack);
          localVideoTrack.close();
        }
        
        await client.publish(screenTrack);
        setIsScreenSharing(true);
        
        toast({
          title: "Screen Sharing Started",
          description: "Your screen is now being shared"
        });
      } else {
        // Stop screen sharing and resume camera
        const [, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        
        await client.unpublish([localVideoTrack!]);
        await client.publish([localAudioTrack!, videoTrack]);
        
        setLocalVideoTrack(videoTrack);
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }
        
        setIsScreenSharing(false);
        
        toast({
          title: "Screen Sharing Stopped",
          description: "Camera feed resumed"
        });
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
      toast({
        title: "Screen Sharing Error",
        description: "Failed to start screen sharing",
        variant: "destructive"
      });
    }
  };

  const endCall = async () => {
    await cleanup();
    onCallEnded?.();
    onEndCall();
  };

  const cleanup = async () => {
    try {
      if (localVideoTrack) {
        localVideoTrack.close();
      }
      if (localAudioTrack) {
        localAudioTrack.close();
      }
      if (client) {
        await client.leave();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (connectionState === 'connecting') {
    return (
      <div className="flex items-center justify-center h-full bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Connecting to meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-black text-white relative">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Live
            </Badge>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {formatDuration(callDuration)}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", getQualityColor(callQuality))}>
              {callQuality}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {remoteUsers.length + 1} participants
            </Badge>
          </div>
        </div>

        {/* Video Container */}
        <div className="flex-1 relative">
          {/* Remote Video (Main) */}
          <div className="w-full h-full relative">
            {remoteUsers.length > 0 ? (
              <div 
                ref={remoteVideoRef}
                className="w-full h-full bg-gray-900 flex items-center justify-center"
              >
                {!remoteUsers[0]?.videoTrack && (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                      {expertName.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-lg">{expertName}</p>
                    <p className="text-sm text-gray-400">Camera is off</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-pulse text-6xl mb-4">📞</div>
                  <p className="text-lg">Waiting for {expertName} to join...</p>
                </div>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <Card className="absolute bottom-4 right-4 w-48 h-36 overflow-hidden border-2 border-white/20">
            <CardContent className="p-0 h-full">
              <div 
                ref={localVideoRef}
                className="w-full h-full bg-gray-800 flex items-center justify-center relative"
              >
                {!isVideoEnabled && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <VideoOff className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 text-xs bg-black/50 px-2 py-1 rounded">
                  You
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-3 bg-black/80 backdrop-blur-sm rounded-full px-6 py-3">
            <Button
              size="sm"
              variant={isAudioEnabled ? "secondary" : "destructive"}
              className="rounded-full h-12 w-12"
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            <Button
              size="sm"
              variant={isVideoEnabled ? "secondary" : "destructive"}
              className="rounded-full h-12 w-12"
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            <Button
              size="sm"
              variant={isScreenSharing ? "default" : "secondary"}
              className="rounded-full h-12 w-12"
              onClick={toggleScreenShare}
            >
              {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
            </Button>

            <Button
              size="sm"
              variant={isMuted ? "destructive" : "secondary"}
              className="rounded-full h-12 w-12"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>

            <Button
              size="sm"
              variant="destructive"
              className="rounded-full h-12 w-12"
              onClick={() => setShowEndCallConfirm(true)}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* End Call Confirmation */}
      <Dialog open={showEndCallConfirm} onOpenChange={setShowEndCallConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Meeting?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this meeting? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="destructive"
              onClick={endCall}
              className="flex-1"
            >
              End Meeting
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEndCallConfirm(false)}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};