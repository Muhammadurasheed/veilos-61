
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUserContext } from '@/contexts/UserContext';
import { formatDate } from '@/lib/alias';
import { cn } from '@/lib/utils';
import { 
  Mic, MicOff, Send, Image, Paperclip, Phone, Video, 
  MoreVertical, Calendar, Loader
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

// Meeting type
interface MeetingRequest {
  date: Date;
  agenda: string;
  expertId: string;
  userId: string;
}

const ChatPage = () => {
  const { sessionId } = useParams();
  const { user } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Set a timeout for loading messages
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoadingMessages) {
        setIsLoadingMessages(false);
        toast({
          title: "Connection Timeout",
          description: "Unable to load messages. Please refresh and try again.",
          variant: "destructive",
        });
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [isLoadingMessages, toast]);

  // Fetch messages for the session
  useEffect(() => {
    const fetchMessages = async () => {
      if (!sessionId) return;
      
      try {
        // This would be a real API call
        console.log(`Fetching messages for session ${sessionId}`);
        
        // Simulated API response
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
            },
            {
              id: '3',
              sender: {
                id: 'expert-1',
                alias: 'Dr. Emma Wilson',
                avatarUrl: '/experts/expert-1.jpg',
                isExpert: true
              },
              content: "I'm sorry to hear you're going through that. Anxiety and sleep issues often go hand in hand. Can you tell me when this started and if there's anything specific that might have triggered these feelings?",
              timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString()
            }
          ];
          
          setMessages(sampleMessages);
          setIsLoadingMessages(false);
          
          // Simulate typing indicator for expert
          setTimeout(() => {
            setIsTyping(true);
            
            setTimeout(() => {
              setIsTyping(false);
            }, 3000);
          }, 2000);
          
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
    
    // Cleanup: abort any pending requests when unmounting
    return () => {};
  }, [sessionId, user, toast]);

  useEffect(() => {
    // Scroll to bottom on new messages
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
    
    // Cleanup media recorder on unmount
    return () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder, audioChunks, toast]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const newMessage: Message = {
      id: `local-${Date.now()}`,
      sender: {
        id: user?.id || 'user-1',
        alias: user?.alias || 'Anonymous',
        avatarIndex: user?.avatarIndex || 1,
        isExpert: false
      },
      content: message.trim(),
      timestamp: new Date().toISOString(),
      status: 'sending'
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setMessage('');
    
    try {
      // Simulating API request to send message
      // In a real implementation, you would send the message to the backend
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id 
              ? {...msg, status: 'delivered'} 
              : msg
          )
        );
        
        // Simulate expert typing
        setIsTyping(true);
        
        // Simulate expert response
        setTimeout(() => {
          setIsTyping(false);
          
          const expertResponse: Message = {
            id: `expert-${Date.now()}`,
            sender: {
              id: 'expert-1',
              alias: 'Dr. Emma Wilson',
              avatarUrl: '/experts/expert-1.jpg',
              isExpert: true
            },
            content: "Thank you for sharing that. Let's explore some relaxation techniques that might help with both anxiety and sleep issues. Have you tried any breathing exercises or meditation before?",
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, expertResponse]);
        }, 3000);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Failed to send message",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
      
      // Update message status to show it failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? {...msg, status: 'sent'} 
            : msg
        )
      );
    }
  };

  const handleVoiceNote = () => {
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
    // Add voice message to chat
    const voiceMessage: Message = {
      id: `voice-${Date.now()}`,
      sender: {
        id: user?.id || 'user-1',
        alias: user?.alias || 'Anonymous',
        avatarIndex: user?.avatarIndex || 1,
        isExpert: false
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
    
    try {
      // Simulate sending the voice message to the backend
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === voiceMessage.id 
              ? {...msg, status: 'delivered'} 
              : msg
          )
        );
        
        // Simulate expert typing response
        setIsTyping(true);
        
        setTimeout(() => {
          setIsTyping(false);
          
          const expertResponse: Message = {
            id: `expert-${Date.now()}`,
            sender: {
              id: 'expert-1',
              alias: 'Dr. Emma Wilson',
              avatarUrl: '/experts/expert-1.jpg',
              isExpert: true
            },
            content: "I've listened to your message. Voice notes are a great way to express yourself. Would you like to continue discussing this topic through text or voice?",
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, expertResponse]);
        }, 4000);
      }, 1500);
      
    } catch (error) {
      console.error('Failed to send voice message:', error);
      toast({
        title: "Failed to send voice message",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
      
      // Update message status to show it failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === voiceMessage.id 
            ? {...msg, status: 'sent'} 
            : msg
        )
      );
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (JPEG, PNG, etc.).",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setIsUploading(true);
      
      try {
        // Create a preview URL for the image
        const imageUrl = URL.createObjectURL(file);
        
        // Create the message with the image
        const imageMessage: Message = {
          id: `image-${Date.now()}`,
          sender: {
            id: user?.id || 'user-1',
            alias: user?.alias || 'Anonymous',
            avatarIndex: user?.avatarIndex || 1,
            isExpert: false
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
        
        // Simulate uploading to the backend
        setTimeout(() => {
          setIsUploading(false);
          
          // Update message status to delivered
          setMessages(prev => 
            prev.map(msg => 
              msg.id === imageMessage.id 
                ? {...msg, status: 'delivered'} 
                : msg
            )
          );
          
          // Simulate expert typing
          setIsTyping(true);
          
          // Simulate expert response
          setTimeout(() => {
            setIsTyping(false);
            
            const expertResponse: Message = {
              id: `expert-${Date.now()}`,
              sender: {
                id: 'expert-1',
                alias: 'Dr. Emma Wilson',
                avatarUrl: '/experts/expert-1.jpg',
                isExpert: true
              },
              content: "Thank you for sharing this image. Visual elements can help me better understand your situation. Is there anything specific about this image you'd like to discuss?",
              timestamp: new Date().toISOString()
            };
            
            setMessages(prev => [...prev, expertResponse]);
          }, 3000);
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
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      // Create meeting request
      const meetingRequest: MeetingRequest = {
        date: selectedDate,
        agenda: meetingAgenda || "General consultation",
        expertId: 'expert-1', // This would come from the session data in a real app
        userId: user?.id || 'anonymous'
      };
      
      // Simulate API request to schedule meeting
      toast({
        title: "Scheduling Meeting...",
        description: "Please wait while we process your request.",
      });
      
      // Simulate API delay
      setTimeout(() => {
        // Close the calendar dialog
        setShowCalendar(false);
        setSelectedDate(undefined);
        setMeetingAgenda("");
        
        // Show success message
        toast({
          title: "Meeting Scheduled",
          description: `Your meeting has been scheduled for ${format(selectedDate, 'PPP')} at ${format(selectedDate, 'p')}.`,
        });
        
        // Add system message to chat about the scheduled meeting
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
        
        // Simulate expert confirmation
        setTimeout(() => {
          const expertResponse: Message = {
            id: `expert-${Date.now()}`,
            sender: {
              id: 'expert-1',
              alias: 'Dr. Emma Wilson',
              avatarUrl: '/experts/expert-1.jpg',
              isExpert: true
            },
            content: `I've confirmed our meeting for ${format(selectedDate, 'PPP')} at ${format(selectedDate, 'p')}. I look forward to our conversation. In the meantime, is there anything else you'd like to discuss here?`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, expertResponse]);
        }, 1500);
        
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
    
    // Simulate call preparation
    setTimeout(() => {
      navigate(`/call/${sessionId}/voice`);
    }, 1500);
  };

  const handleStartVideoCall = () => {
    toast({
      title: "Starting Video Call",
      description: "Preparing to connect to your expert...",
    });
    
    // Simulate call preparation
    setTimeout(() => {
      navigate(`/call/${sessionId}/video`);
    }, 1500);
  };

  return (
    <Layout>
      <div className="container h-[calc(100vh-8rem)]">
        <Card className="h-full flex flex-col bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm">
          {/* Chat header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src="/experts/expert-1.jpg" alt="Dr. Emma Wilson" />
                <AvatarFallback>EW</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">Dr. Emma Wilson</h2>
                <p className="text-sm text-green-600 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-600 mr-1"></span>
                  Online
                </p>
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
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 mr-2" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      New Session
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 mr-2" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      End Session
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoadingMessages ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center space-y-4">
                  <Loader className="h-8 w-8 text-veilo-blue animate-spin" />
                  <p className="text-sm text-gray-500">Loading conversation...</p>
                </div>
              </div>
            ) : (
              <>
                {messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-center">
                      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full inline-flex mb-4">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-10 w-10 text-veilo-blue" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium mb-2">Start a new conversation</h3>
                      <p className="text-gray-500 mb-4 max-w-md mx-auto">
                        Chat with your expert to get personalized guidance and support.
                      </p>
                      <p className="text-sm text-veilo-blue">
                        All conversations are private and secure
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.sender.isExpert ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`flex max-w-[80%] ${msg.sender.isExpert ? 'flex-row' : 'flex-row-reverse'}`}>
                        <div className={`flex-shrink-0 ${msg.sender.isExpert ? 'mr-3' : 'ml-3'}`}>
                          {msg.sender.isExpert ? (
                            <Avatar>
                              <AvatarImage src={msg.sender.avatarUrl} alt={msg.sender.alias} />
                              <AvatarFallback>{msg.sender.alias.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <Avatar>
                              <AvatarImage 
                                src={`/avatars/avatar-${msg.sender.avatarIndex}.svg`} 
                                alt={msg.sender.alias} 
                              />
                              <AvatarFallback>
                                {msg.sender.alias.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        <div>
                          <div 
                            className={`py-2 px-4 rounded-lg ${
                              msg.sender.isExpert 
                                ? 'bg-gray-100 dark:bg-gray-700 rounded-tl-none' 
                                : 'bg-veilo-blue text-white rounded-tr-none'
                            }`}
                          >
                            {msg.type === 'image' && msg.attachment && (
                              <div className="mb-2">
                                <img 
                                  src={msg.attachment.url} 
                                  alt="Attachment" 
                                  className="rounded-md max-h-48 w-auto"
                                />
                              </div>
                            )}
                            {msg.type === 'voice' && (
                              <div className="flex items-center space-x-2 my-1">
                                <audio src={msg.attachment?.url} controls className="max-w-full" />
                              </div>
                            )}
                            <p>{msg.content}</p>
                          </div>
                          <div className={`text-xs text-gray-500 mt-1 flex items-center ${
                            msg.sender.isExpert ? 'justify-start' : 'justify-end'
                          }`}>
                            {formatDate(msg.timestamp)}
                            {!msg.sender.isExpert && msg.status && (
                              <span className="ml-1">
                                {msg.status === 'sending' && '•'}
                                {msg.status === 'sent' && '✓'}
                                {msg.status === 'delivered' && '✓✓'}
                                {msg.status === 'read' && (
                                  <span className="text-blue-500">✓✓</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex max-w-[80%] flex-row">
                      <div className="flex-shrink-0 mr-3">
                        <Avatar>
                          <AvatarImage src="/experts/expert-1.jpg" alt="Dr. Emma Wilson" />
                          <AvatarFallback>EW</AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <div className="py-3 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 rounded-tl-none">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{animationDelay: '0.4s'}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          {/* Message input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex space-x-2 items-center">
              <div className="flex-shrink-0 flex items-center space-x-1">
                <label htmlFor="image-upload">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full"
                    disabled={isUploading || isRecording}
                  >
                    <Image className="h-5 w-5 text-gray-500" />
                  </Button>
                  <input 
                    id="image-upload" 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading || isRecording}
                  />
                </label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="rounded-full"
                  disabled={isUploading || isRecording}
                >
                  <Paperclip className="h-5 w-5 text-gray-500" />
                </Button>
              </div>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full"
                disabled={isRecording || isUploading}
              />
              <div className="flex-shrink-0">
                {message.trim() ? (
                  <Button 
                    type="submit" 
                    size="icon"
                    className="rounded-full bg-veilo-blue hover:bg-veilo-blue-dark text-white"
                    disabled={isUploading || isRecording}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    size="icon"
                    className={cn(
                      "rounded-full",
                      isRecording 
                        ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                        : "bg-veilo-blue hover:bg-veilo-blue-dark text-white"
                    )}
                    onClick={handleVoiceNote}
                    disabled={isUploading}
                  >
                    {isRecording ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
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
                      'bg-veilo-blue text-white' : ''
                    )}
                    onClick={() => {
                      if (selectedDate) {
                        const [hour, minute] = time.split(':');
                        const isPM = time.includes('PM');
                        
                        const newDate = new Date(selectedDate);
                        newDate.setHours(
                          isPM ? parseInt(hour) + 12 : parseInt(hour),
                          parseInt(minute),
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
