import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import RealTimeChat from '@/components/session/RealTimeChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUserContext } from '@/contexts/UserContext';
import { useChatSocket, useSocket } from '@/hooks/useSocket';
import MessageBubble from '@/components/chat/MessageBubble';
import TypingIndicator from '@/components/chat/TypingIndicator';
import ChatInput from '@/components/chat/ChatInput';
import { formatDate } from '@/lib/alias';
import { cn } from '@/lib/utils';
import { 
  Phone, Video, MoreVertical, Calendar, Loader, Users, 
  Shield, AlertCircle
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';

// Message type
interface Message {
  id: string;
  sender: {
    id: string;
    alias: string;
    avatarUrl?: string;
    avatarIndex?: number;
    isExpert: boolean;
  };
  content: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'voice';
  attachment?: {
    url: string;
    type: string;
  };
}

// Typing user type
interface TypingUser {
  userId: string;
  userAlias: string;
  avatarUrl?: string;
  avatarIndex?: number;
}

// Meeting type
interface MeetingRequest {
  date: Date;
  agenda: string;
  expertId: string;
  userId: string;
}

const ChatPage = () => {
  const { sessionId, expertId, type } = useParams<{ sessionId?: string; expertId?: string; type?: string }>();
  const { user } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  // If this is an expert call route, use RealTimeChat component
  if (expertId) {
    return (
      <Layout>
        <RealTimeChat 
          expertId={expertId} 
          callType={type as 'voice' | 'video'} 
        />
      </Layout>
    );
  }
  
  // Real-time socket connection
  const { socket, isConnected } = useSocket({ autoConnect: true });
  const { sendMessage: sendSocketMessage, startTyping, stopTyping } = useChatSocket(
    sessionId || '', 
    user?.role === 'beacon' ? 'expert' : 'user'
  );

  // UI state
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [meetingAgenda, setMeetingAgenda] = useState('');
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  // Set up socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new messages
    socket.onNewMessage((message: Message) => {
      setMessages(prev => [...prev, message]);
      
      // Mark message as delivered
      if (message.sender.id !== user?.id) {
        socket.markMessageDelivered(message.id, sessionId || '');
      }
    });

    // Listen for typing indicators
    socket.onUserTyping((data: { userId: string; userAlias: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        if (data.isTyping) {
          // Add user to typing list if not already there
          if (!prev.find(u => u.userId === data.userId)) {
            return [...prev, { 
              userId: data.userId, 
              userAlias: data.userAlias 
            }];
          }
          return prev;
        } else {
          // Remove user from typing list
          return prev.filter(u => u.userId !== data.userId);
        }
      });
    });

    // Listen for user join/leave events
    socket.onUserJoined((user: any) => {
      setOnlineUsers(prev => [...new Set([...prev, user.userId])]);
      
      toast({
        title: "User Joined",
        description: `${user.userAlias} joined the chat`,
      });
    });

    socket.onUserLeft((user: any) => {
      setOnlineUsers(prev => prev.filter(id => id !== user.userId));
      
      toast({
        title: "User Left",
        description: `${user.userAlias} left the chat`,
      });
    });

    // Listen for message status updates
    socket.onMessageStatusUpdate((data: { messageId: string; status: string }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, status: data.status as any }
            : msg
        )
      );
    });

    return () => {
      socket.removeAllListeners();
    };
  }, [socket, isConnected, user?.id, sessionId, toast]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!sessionId) return;
      
      try {
        // Simulate fetching messages - in real app, this would be an API call
        setTimeout(() => {
          const sampleMessages: Message[] = [
            {
              id: '1',
              sender: {
                id: 'expert-1',
                alias: 'Dr. Emma Wilson',
                avatarUrl: '/experts/expert-1.jpg',
                isExpert: true
              },
              content: 'Hello! How can I help you today?',
              timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
            },
            {
              id: '2',
              sender: {
                id: user?.id || 'user-1',
                alias: user?.alias || 'Anonymous',
                avatarIndex: user?.avatarIndex || 1,
                isExpert: false
              },
              content: "I've been feeling really anxious lately and having trouble sleeping.",
              timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString()
            }
          ];
          
          setMessages(sampleMessages);
          setIsLoadingMessages(false);
        }, 1500);
        
      } catch (error) {
        console.error('Error fetching messages:', error);
        setIsLoadingMessages(false);
        toast({
          title: "Error",
          description: "Failed to load chat messages. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    fetchMessages();
  }, [sessionId, user, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize media recorder for voice messages
  useEffect(() => {
    const initializeMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        
        recorder.ondataavailable = (e) => {
          setAudioChunks((chunks) => [...chunks, e.data]);
        };
        
        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Send the voice message
          handleSendVoiceMessage(audioBlob, audioUrl);
          
          // Reset audio chunks
          setAudioChunks([]);
        };
        
        setMediaRecorder(recorder);
      } catch (err) {
        console.error('Error accessing microphone:', err);
        toast({
          title: "Microphone Error",
          description: "Unable to access your microphone. Please check your permissions.",
          variant: "destructive",
        });
      }
    };
    
    if (navigator.mediaDevices && !mediaRecorder) {
      initializeMediaRecorder();
    }
    
    return () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder, audioChunks, toast]);

  // Handle sending text messages
  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    
    const newMessage: Message = {
      id: `local-${Date.now()}`,
      sender: {
        id: user?.id || 'user-1',
        alias: user?.alias || 'Anonymous',
        avatarIndex: user?.avatarIndex || 1,
        isExpert: user?.role === 'beacon'
      },
      content: content.trim(),
      timestamp: new Date().toISOString(),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Send via socket
    if (isConnected) {
      sendSocketMessage(content.trim());
    }
    
    // Update status to sent
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'sent' }
            : msg
        )
      );
    }, 500);
  };

  // Handle image uploads
  const handleImageUpload = (file: File) => {
    setIsUploading(true);
    
    try {
      const imageUrl = URL.createObjectURL(file);
      
      const imageMessage: Message = {
        id: `image-${Date.now()}`,
        sender: {
          id: user?.id || 'user-1',
          alias: user?.alias || 'Anonymous',
          avatarIndex: user?.avatarIndex || 1,
          isExpert: user?.role === 'beacon'
        },
        content: "Image attachment",
        timestamp: new Date().toISOString(),
        type: 'image',
        attachment: {
          url: imageUrl,
          type: file.type
        },
        status: 'sending'
      };
      
      setMessages(prev => [...prev, imageMessage]);
      
      // Simulate upload - in real app, upload to server first
      setTimeout(() => {
        setIsUploading(false);
        
        // Send via socket with attachment data
        if (isConnected) {
          sendSocketMessage('Image attachment', 'image', { url: imageUrl, type: file.type });
        }
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === imageMessage.id 
              ? { ...msg, status: 'delivered' }
              : msg
          )
        );
      }, 2000);
      
    } catch (error) {
      setIsUploading(false);
      console.error('Failed to upload image:', error);
      toast({
        title: "Failed to upload image",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  // Handle voice recording
  const handleVoiceRecord = () => {
    if (!mediaRecorder) {
      toast({
        title: "Microphone Not Available",
        description: "Unable to record voice message. Please check your microphone permissions.",
        variant: "destructive",
      });
      return;
    }
    
    if (isRecording) {
      // Stop recording
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      setAudioChunks([]);
      mediaRecorder.start();
      setIsRecording(true);
      
      // Set a maximum recording time (30 seconds)
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
          toast({
            title: "Recording Limit Reached",
            description: "Voice message has reached the maximum length of 30 seconds.",
          });
        }
      }, 30000);
    }
  };

  const handleSendVoiceMessage = async (audioBlob: Blob, audioUrl: string) => {
    const voiceMessage: Message = {
      id: `voice-${Date.now()}`,
      sender: {
        id: user?.id || 'user-1',
        alias: user?.alias || 'Anonymous',
        avatarIndex: user?.avatarIndex || 1,
        isExpert: user?.role === 'beacon'
      },
      content: "Voice message",
      timestamp: new Date().toISOString(),
      type: 'voice',
      attachment: {
        url: audioUrl,
        type: 'audio/mpeg'
      },
      status: 'sending'
    };
    
    setMessages(prev => [...prev, voiceMessage]);
    
    // Send via socket
    if (isConnected) {
      sendSocketMessage('Voice message', 'voice', { url: audioUrl, type: 'audio/mpeg' });
    }
    
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === voiceMessage.id 
            ? { ...msg, status: 'delivered' }
            : msg
        )
      );
    }, 1000);
  };

  // Handle scheduling meetings
  const handleScheduleMeeting = async () => {
    if (!selectedDate) {
      toast({
        title: "Date Required",
        description: "Please select a date for your meeting.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const meetingRequest: MeetingRequest = {
        date: selectedDate,
        agenda: meetingAgenda || "General consultation",
        expertId: 'expert-1',
        userId: user?.id || 'anonymous'
      };
      
      toast({
        title: "Scheduling Meeting...",
        description: "Please wait while we process your request.",
      });
      
      setTimeout(() => {
        setShowCalendar(false);
        setSelectedDate(undefined);
        setMeetingAgenda("");
        
        toast({
          title: "Meeting Scheduled",
          description: `Your meeting has been scheduled for ${format(selectedDate, 'PPP')} at ${format(selectedDate, 'p')}.`,
        });
        
        const systemMessage: Message = {
          id: `system-${Date.now()}`,
          sender: {
            id: 'system',
            alias: 'System',
            isExpert: true
          },
          content: `Meeting scheduled for ${format(selectedDate, 'PPP')} at ${format(selectedDate, 'p')}. You'll receive a notification before the meeting.`,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, systemMessage]);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      toast({
        title: "Scheduling Failed",
        description: "Unable to schedule the meeting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartVoiceCall = () => {
    toast({
      title: "Starting Voice Call",
      description: "Preparing to connect to your expert...",
    });
    
    setTimeout(() => {
      navigate(`/call/${sessionId}/voice`);
    }, 1500);
  };

  const handleStartVideoCall = () => {
    toast({
      title: "Starting Video Call",
      description: "Preparing to connect to your expert...",
    });
    
    setTimeout(() => {
      navigate(`/call/${sessionId}/video`);
    }, 1500);
  };

  const handleImageClick = (imageUrl: string) => {
    // Open image in modal or new tab
    window.open(imageUrl, '_blank');
  };

  return (
    <Layout>
      <div className="container h-[calc(100vh-8rem)]">
        <Card className="h-full flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Chat header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src="/experts/expert-1.jpg" alt="Dr. Emma Wilson" />
                <AvatarFallback>EW</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">Dr. Emma Wilson</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-sm text-green-600">
                    <span className="w-2 h-2 rounded-full bg-green-600 mr-1"></span>
                    Online
                  </div>
                  {!isConnected && (
                    <Badge variant="destructive" className="text-xs">
                      Connecting...
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full"
                onClick={handleStartVoiceCall}
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full"
                onClick={handleStartVideoCall}
              >
                <Video className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => setShowCalendar(true)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Meeting
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      View Participants
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      End Session
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingMessages ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center space-y-4">
                  <Loader className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading conversation...</p>
                </div>
              </div>
            ) : (
              <>
                {messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-center">
                      <div className="bg-muted p-6 rounded-full inline-flex mb-4">
                        <Shield className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Start a secure conversation</h3>
                      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        Chat with your expert to get personalized guidance and support.
                      </p>
                      <p className="text-sm text-primary">
                        All conversations are private and encrypted
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwnMessage={msg.sender.id === user?.id}
                        onImageClick={handleImageClick}
                      />
                    ))}
                    
                    {typingUsers.length > 0 && (
                      <TypingIndicator typingUsers={typingUsers} />
                    )}
                    
                    <div ref={messagesEndRef} />
                  </>
                )}
              </>
            )}
          </div>
          
          {/* Chat input */}
          <ChatInput
            value={message}
            onChange={setMessage}
            onSend={handleSendMessage}
            onImageUpload={handleImageUpload}
            onVoiceRecord={handleVoiceRecord}
            onTypingStart={startTyping}
            onTypingStop={stopTyping}
            isRecording={isRecording}
            isUploading={isUploading}
            disabled={!isConnected}
            placeholder={isConnected ? "Type your message..." : "Connecting..."}
          />
        </Card>
      </div>

      {/* Schedule meeting dialog */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Schedule a Meeting</DialogTitle>
            <DialogDescription>
              Select a date and time to schedule a call with Dr. Emma Wilson.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="meeting-date">Date & Time</Label>
              <div className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date > new Date(new Date().setDate(new Date().getDate() + 30))}
                  className="rounded-md border"
                />
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'].map((time) => (
                  <Button
                    key={time}
                    variant="outline"
                    size="sm"
                    className={cn(
                      selectedDate && 
                      format(selectedDate, 'h:mm a') === time ? 
                      'bg-primary text-primary-foreground' : ''
                    )}
                    onClick={() => {
                      if (selectedDate) {
                        const [hour, minute] = time.split(':');
                        const isPM = time.includes('PM');
                        
                        const newDate = new Date(selectedDate);
                        newDate.setHours(
                          isPM && parseInt(hour) !== 12 ? parseInt(hour) + 12 : parseInt(hour),
                          parseInt(minute.split(' ')[0]),
                          0
                        );
                        
                        setSelectedDate(newDate);
                      }
                    }}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agenda">Meeting Agenda</Label>
              <Textarea
                id="agenda"
                placeholder="Brief description of what you'd like to discuss"
                value={meetingAgenda}
                onChange={(e) => setMeetingAgenda(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalendar(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleMeeting}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ChatPage;