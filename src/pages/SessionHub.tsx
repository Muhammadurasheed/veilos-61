import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useUserContext } from '@/contexts/UserContext';
import { Session } from '@/types';
import { SessionApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/alias';
import { CalendarDays, Video, MessageSquare, Clock, Calendar } from 'lucide-react';

const SessionHub = () => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Sample sessions for demo
  const sampleSessions: Session[] = [
    {
      id: '1',
      expertId: 'expert1',
      userId: user?.id || '',
      userAlias: user?.alias || 'Anonymous',
      scheduledTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      status: 'scheduled',
      sessionType: 'video',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      expertId: 'expert2',
      userId: user?.id || '',
      userAlias: user?.alias || 'Anonymous',
      scheduledTime: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
      status: 'scheduled',
      sessionType: 'chat',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '3',
      expertId: 'expert3',
      userId: user?.id || '',
      userAlias: user?.alias || 'Anonymous',
      scheduledTime: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
      status: 'completed',
      sessionType: 'video',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  const handleJoinSession = async (session: Session) => {
    setActiveSession(session);

    if (session.sessionType === 'video') {
      setIsDialogOpen(true);
    } else {
      // For chat sessions, navigate directly
      navigate(`/chat/${session.id}`);
    }
  };

  const startVideoSession = async () => {
    if (!activeSession) return;
    
    setIsJoining(true);
    
    try {
      // In a real app, this would call the API to create a video room
      /*
      const response = await SessionApi.createVideoRoom(activeSession.id);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create video session');
      }
      
      // Open the video session in a new tab
      window.open(response.data.meetingUrl, '_blank');
      */
      
      // For demo purposes, simulate successful creation
      setTimeout(() => {
        toast({
          title: 'Video session ready',
          description: 'Your video session has been created successfully.',
        });
        
        // In a real app, this would navigate to the video session or open it in a new tab
        setIsJoining(false);
        setIsDialogOpen(false);
      }, 1500);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to join session',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
      setIsJoining(false);
    }
  };

  const getSessionStatusBadge = (status: Session['status']) => {
    switch (status) {
      case 'requested':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Requested</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-veilo-blue-light text-veilo-blue-dark">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-veilo-green-light text-veilo-green-dark">Completed</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Canceled</Badge>;
      default:
        return null;
    }
  };

  const getSessionTypeIcon = (type: Session['sessionType']) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4 mr-1" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4 mr-1" />;
      case 'voice':
        return <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 mr-1"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-2 text-veilo-blue-dark">Session Hub</h1>
        <p className="text-gray-600 mb-8">
          Manage your anonymous sessions with experts. All sessions are completely private and encrypted.
        </p>

        <Tabs defaultValue="upcoming">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
            <TabsTrigger value="requested">Requested</TabsTrigger>
            <TabsTrigger value="past">Past Sessions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {sampleSessions
                .filter(session => 
                  session.status === 'scheduled' && 
                  new Date(session.scheduledTime) > new Date()
                )
                .map(session => (
                  <Card key={session.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Session with Expert</CardTitle>
                          <CardDescription>
                            Scheduled for {new Date(session.scheduledTime).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center">
                          {getSessionTypeIcon(session.sessionType)}
                          {getSessionStatusBadge(session.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span>
                            {new Date(session.scheduledTime).toLocaleDateString(undefined, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          <span>
                            {new Date(session.scheduledTime).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="flex items-center mr-2 text-gray-500">
                            {session.sessionType === 'video' ? (
                              <Video className="h-4 w-4 mr-1" />
                            ) : (
                              <MessageSquare className="h-4 w-4 mr-1" />
                            )}
                          </div>
                          <span className="capitalize">
                            {session.sessionType} Session
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-3 flex justify-end">
                      <Button
                        onClick={() => handleJoinSession(session)}
                        className="bg-veilo-blue hover:bg-veilo-blue-dark"
                      >
                        {session.sessionType === 'video' ? (
                          <>
                            <Video className="h-4 w-4 mr-1" />
                            Join Video
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Open Chat
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              
              {sampleSessions.filter(s => 
                s.status === 'scheduled' && 
                new Date(s.scheduledTime) > new Date()
              ).length === 0 && (
                <Card className="col-span-2 bg-gray-50">
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <CalendarDays className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500">No upcoming sessions</p>
                    <Button 
                      className="mt-4 bg-veilo-blue hover:bg-veilo-blue-dark"
                      onClick={() => navigate('/beacons')}
                    >
                      Find an Expert
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="requested" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {sampleSessions
                .filter(session => session.status === 'requested')
                .map(session => (
                  <Card key={session.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Pending Request</CardTitle>
                          <CardDescription>
                            Requested on {formatDate(session.createdAt)}
                          </CardDescription>
                        </div>
                        {getSessionStatusBadge(session.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <div className="flex items-center mr-2 text-gray-500">
                          {getSessionTypeIcon(session.sessionType)}
                        </div>
                        <span className="capitalize">
                          {session.sessionType} Session
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="outline">
                        Cancel Request
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                
              {sampleSessions.filter(s => s.status === 'requested').length === 0 && (
                <Card className="col-span-2 bg-gray-50">
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <p className="text-gray-500">No pending requests</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="past" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {sampleSessions
                .filter(session => 
                  session.status === 'completed' || 
                  (session.status === 'scheduled' && new Date(session.scheduledTime) < new Date())
                )
                .map(session => (
                  <Card key={session.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Past Session</CardTitle>
                          <CardDescription>
                            {new Date(session.scheduledTime).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {getSessionStatusBadge(session.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center mb-3">
                        <div className="flex items-center mr-2 text-gray-500">
                          {getSessionTypeIcon(session.sessionType)}
                        </div>
                        <span className="capitalize">
                          {session.sessionType} Session
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button variant="outline">
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                
              {sampleSessions.filter(s => 
                s.status === 'completed' || 
                (s.status === 'scheduled' && new Date(s.scheduledTime) < new Date())
              ).length === 0 && (
                <Card className="col-span-2 bg-gray-50">
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <p className="text-gray-500">No past sessions</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Video Session Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Join Video Session</DialogTitle>
              <DialogDescription>
                You're about to join a secure, anonymous video session. This session is fully encrypted and will not be recorded.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-2 space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                <h4 className="text-sm font-medium text-amber-800 mb-1">Before you join:</h4>
                <ul className="list-disc list-inside text-xs text-amber-700 space-y-1">
                  <li>Ensure your camera and microphone are working</li>
                  <li>Find a quiet, private space for your session</li>
                  <li>Your identity remains protected during the call</li>
                </ul>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-veilo-blue hover:bg-veilo-blue-dark"
                onClick={startVideoSession}
                disabled={isJoining}
              >
                {isJoining ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Preparing Room...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-1" />
                    Join Video Session
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SessionHub;
