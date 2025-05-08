
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Video, MessageSquare, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import VideoCall from './VideoCall';
import { useToast } from '@/hooks/use-toast';

interface SessionChatProps {
  expertId: string;
  expertName: string;
  expertSpecialization: string;
  expertAvatar: string;
  sessionId?: string;
}

type SessionStatus = 'initial' | 'requested' | 'scheduled' | 'active' | 'completed';

const SessionChat = ({ 
  expertId, 
  expertName, 
  expertSpecialization,
  expertAvatar,
  sessionId 
}: SessionChatProps) => {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(sessionId ? 'active' : 'initial');
  const [sessionDate, setSessionDate] = useState<Date | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const toastShownRef = useRef(false);

  useEffect(() => {
    // If session exists, fetch its data
    if (sessionId) {
      // This would fetch real session data from the API
      // For now, we'll simulate an active session
      setSessionStatus('active');
    }
    
    // Show a toast when entering an active session
    if (sessionStatus === 'active' && !toastShownRef.current) {
      toast({
        title: 'Session Active',
        description: `You're now connected with ${expertName}.`,
      });
      toastShownRef.current = true;
    }
  }, [sessionId, sessionStatus, expertName, toast]);

  const handleSendRequest = () => {
    // In a real implementation, this would send the session request to the backend
    setSessionStatus('requested');
    
    toast({
      title: 'Session Requested',
      description: `Your request has been sent to ${expertName}.`,
    });
    
    // Simulate expert accepting the request after a delay
    setTimeout(() => {
      setSessionStatus('active');
    }, 5000);
  };
  
  const handleScheduleSession = () => {
    // In a real implementation, this would open a scheduling dialog
    // For now, we'll set a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    futureDate.setHours(10, 0, 0, 0);
    
    setSessionDate(futureDate);
    setSessionStatus('scheduled');
    
    toast({
      title: 'Session Scheduled',
      description: `Your session with ${expertName} is scheduled for ${futureDate.toLocaleDateString()} at ${futureDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
    });
  };
  
  const handleStartCall = () => {
    setIsInCall(true);
  };
  
  const handleEndCall = () => {
    setIsInCall(false);
    setSessionStatus('completed');
    
    toast({
      title: 'Session Completed',
      description: 'Thank you for using Veilo. Your session has been completed.',
    });
  };

  if (isInCall) {
    return (
      <VideoCall 
        sessionId={sessionId || 'new-session'} 
        expertName={expertName}
        expertAvatar={expertAvatar}
        onEndCall={handleEndCall}
      />
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={expertAvatar} alt={expertName} />
              <AvatarFallback>{expertName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{expertName}</CardTitle>
              <p className="text-sm text-muted-foreground">{expertSpecialization}</p>
            </div>
          </div>
          
          <Badge 
            variant={
              sessionStatus === 'active' ? 'default' : 
              sessionStatus === 'scheduled' ? 'outline' :
              sessionStatus === 'requested' ? 'secondary' :
              sessionStatus === 'completed' ? 'destructive' :
              'outline'
            }
            className={
              sessionStatus === 'active' ? 'bg-green-500' :
              sessionStatus === 'requested' ? 'bg-amber-500' :
              ''
            }
          >
            {sessionStatus === 'active' && 'Active Session'}
            {sessionStatus === 'scheduled' && 'Scheduled'}
            {sessionStatus === 'requested' && 'Request Pending'}
            {sessionStatus === 'completed' && 'Completed'}
            {sessionStatus === 'initial' && 'New Session'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {sessionStatus === 'initial' && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
              <h3 className="font-medium mb-2">About this Expert</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {expertName} is a verified expert in {expertSpecialization}. 
                You can request a session or schedule one for later.
              </p>
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1">
                Initial message (optional)
              </label>
              <Textarea
                id="message"
                placeholder="Briefly describe what you'd like to discuss..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>
          </div>
        )}
        
        {sessionStatus === 'requested' && (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-medium mb-1">Waiting for Response</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {expertName} has been notified of your request and will respond shortly.
            </p>
            
            <div className="mt-6 flex justify-center">
              <div className="w-8 h-2 bg-gray-200 dark:bg-gray-700 rounded-full relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-amber-500 animate-pulse w-full"></div>
              </div>
            </div>
          </div>
        )}
        
        {sessionStatus === 'scheduled' && sessionDate && (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium mb-1">Session Scheduled</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Your session with {expertName} is scheduled for:
            </p>
            
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md inline-block">
              <p className="font-medium">{sessionDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <p>{sessionDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
            
            <p className="mt-4 text-sm">
              You'll receive a reminder 15 minutes before your session starts.
            </p>
          </div>
        )}
        
        {sessionStatus === 'active' && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md flex items-center">
              <div className="mr-4">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-medium">Session Active</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {expertName} is available to chat or start a video call.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4 overflow-x-auto py-2">
              <Button onClick={handleStartCall} className="flex-shrink-0 flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span>Start Video Session</span>
              </Button>
              <Button variant="outline" className="flex-shrink-0 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Continue in Chat</span>
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 p-2">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              <span>For your safety, all sessions are encrypted and anonymous by default.</span>
            </div>
          </div>
        )}
        
        {sessionStatus === 'completed' && (
          <div className="text-center py-6">
            <h3 className="text-lg font-medium mb-3">Session Completed</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Thank you for using Veilo. We hope your session was helpful.
            </p>
            
            <Button variant="outline" className="mr-2">
              View Session History
            </Button>
            <Button onClick={() => setSessionStatus('initial')}>
              Start New Session
            </Button>
          </div>
        )}
      </CardContent>
      
      {sessionStatus === 'initial' && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleScheduleSession}>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Session
          </Button>
          <Button onClick={handleSendRequest}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Request Session Now
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default SessionChat;
