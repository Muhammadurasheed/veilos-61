
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Video, VideoOff, Phone, Shield, Clock } from 'lucide-react';
import { useUserContext } from '@/contexts/UserContext';
import { formatDuration } from '@/lib/alias';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface VideoCallProps {
  sessionId: string;
  expertName: string;
  expertAvatar: string;
  onEndCall: () => void;
}

/**
 * VideoCall Component for Veilo sessions
 * 
 * Integration Notes:
 * This component is a placeholder for video call functionality.
 * For a production implementation, you need to integrate with a WebRTC service like:
 * 
 * 1. ZegoCloud - https://www.zegocloud.com/
 * 2. Daily.co - https://www.daily.co/
 * 3. LiveKit - https://livekit.io/
 * 
 * Required Environment Variables:
 * - VITE_VIDEO_API_KEY - API key for the chosen video service
 * - VITE_VIDEO_APP_ID - App ID for the chosen video service
 * - VITE_VIDEO_SECRET - Secret key for the chosen video service
 * 
 * Estimated Implementation Time:
 * 2-3 days including testing and optimization
 */

const VideoCall = ({ sessionId, expertName, expertAvatar, onEndCall }: VideoCallProps) => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isVoiceMasked, setIsVoiceMasked] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Start the call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Handle muting microphone
  const toggleMute = () => {
    setIsMicMuted(!isMicMuted);
    // In a real implementation, this would call the WebRTC API to mute the microphone
  };

  // Handle turning video on/off
  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    // In a real implementation, this would call the WebRTC API to turn off the camera
  };

  // Handle voice masking toggle
  const toggleVoiceMasking = () => {
    setIsVoiceMasked(!isVoiceMasked);
    // In a real implementation, this would apply voice modulation effects
    toast({
      title: isVoiceMasked ? "Voice masking disabled" : "Voice masking enabled",
      description: isVoiceMasked 
        ? "Your natural voice will now be heard" 
        : "Your voice will now be masked for privacy"
    });
  };

  // Handle ending the call
  const handleEndCall = () => {
    // In a real implementation, this would disconnect from the WebRTC service
    setIsCallEnded(true);
  };

  // Handle submitting feedback after the call
  const handleSubmitFeedback = () => {
    // In a real implementation, this would send the feedback to the backend
    toast({
      title: "Thanks for your feedback!",
      description: "Your session has been saved and rated."
    });
    onEndCall();
  };

  return (
    <>
      <Card className="w-full h-[70vh] flex flex-col overflow-hidden">
        <CardContent className="flex-grow p-0 relative flex flex-col">
          {/* Main video area */}
          <div className="w-full h-full bg-gray-900 relative flex items-center justify-center">
            {/* Expert video (or placeholder if video is off) */}
            {isVideoOff ? (
              <div className="flex flex-col items-center">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={expertAvatar} alt={expertName} />
                  <AvatarFallback>{expertName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="text-white mt-4 text-xl font-medium">{expertName}</p>
                <p className="text-gray-300">Video is disabled</p>
              </div>
            ) : (
              <div className="w-full h-full bg-gray-800">
                {/* This would be the actual video stream in a real implementation */}
                <div className="flex items-center justify-center h-full">
                  <p className="text-white text-opacity-50">Video stream would appear here</p>
                </div>
              </div>
            )}
            
            {/* Self view */}
            <div className="absolute bottom-4 right-4 w-1/4 max-w-[180px] aspect-video bg-gray-800 rounded-lg border-2 border-gray-700 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-white text-opacity-50 text-sm">
                {user?.alias || 'You'}
              </div>
            </div>
            
            {/* Call duration */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {formatDuration(callDuration)}
            </div>
          </div>
          
          {/* Call controls */}
          <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
            <Button 
              variant="outline" 
              size="icon" 
              className={cn(
                "rounded-full border-gray-600",
                isMicMuted 
                  ? "bg-red-500 text-white hover:bg-red-600" 
                  : "bg-gray-700 text-white hover:bg-gray-600"
              )}
              onClick={toggleMute}
            >
              {isMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className={cn(
                "rounded-full border-gray-600",
                isVideoOff 
                  ? "bg-red-500 text-white hover:bg-red-600" 
                  : "bg-gray-700 text-white hover:bg-gray-600"
              )}
              onClick={toggleVideo}
            >
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>
            <Button 
              variant="destructive" 
              size="lg" 
              className="rounded-full px-8"
              onClick={handleEndCall}
            >
              <Phone className="h-5 w-5 rotate-[-135deg]" />
              <span className="ml-2">End Call</span>
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className={cn(
                "rounded-full border-gray-600",
                isVoiceMasked 
                  ? "bg-veilo-blue text-white hover:bg-veilo-blue-dark" 
                  : "bg-gray-700 text-white hover:bg-gray-600"
              )}
              onClick={toggleVoiceMasking}
              title={isVoiceMasked ? "Disable voice masking" : "Enable voice masking"}
            >
              <Shield className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isCallEnded} onOpenChange={setIsCallEnded}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Call Ended</DialogTitle>
            <DialogDescription>
              Your session with {expertName} has ended. We'd appreciate your feedback on this session.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">How would you rate this session?</p>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant="ghost"
                    className={cn(
                      "text-2xl px-2",
                      rating >= star ? "text-yellow-500" : "text-gray-300"
                    )}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="mb-4 space-y-2">
              <Label htmlFor="voice-mask">Voice masking preference for future calls</Label>
              <div className="flex items-center space-x-2">
                <Switch id="voice-mask" checked={isVoiceMasked} onCheckedChange={setIsVoiceMasked} />
                <Label htmlFor="voice-mask">Enable voice masking</Label>
              </div>
            </div>
            
            <textarea
              className="w-full h-24 p-2 border rounded-md"
              placeholder="Any additional feedback about your session (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => onEndCall()}
            >
              Skip Feedback
            </Button>
            <Button 
              onClick={handleSubmitFeedback}
              disabled={rating === 0}
              className="bg-veilo-blue hover:bg-veilo-blue-dark"
            >
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VideoCall;
