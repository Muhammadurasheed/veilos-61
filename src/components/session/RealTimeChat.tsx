import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import VideoCall from './VideoCall';
import { formatDate } from '@/lib/alias';
import { cn } from '@/lib/utils';
import { 
  Phone, Video, MoreVertical, Calendar, Loader, Users, 
  Shield, AlertCircle, ArrowLeft
} from 'lucide-react';
import { apiRequest } from '@/services/api';
import { MessageSquare } from 'lucide-react';

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

interface ExpertData {
  id: string;
  name: string;
  specialization: string;
  avatarUrl?: string;
  isOnline: boolean;
  verified: boolean;
}

interface RealTimeChatProps {
  expertId?: string;
  sessionId?: string;
  callType?: 'voice' | 'video';
}

const RealTimeChat = ({ expertId, sessionId, callType }: RealTimeChatProps) => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Real-time socket connection
  const { socket, isConnected } = useSocket({ autoConnect: true });
  const { sendMessage: sendSocketMessage, startTyping, stopTyping } = useChatSocket(
    sessionId || expertId || '', 
    user?.role === 'beacon' ? 'expert' : 'user'
  );

  // State
  const [expert, setExpert] = useState<ExpertData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [isInCall, setIsInCall] = useState(callType === 'voice' || callType === 'video');
  const [currentCallType, setCurrentCallType] = useState<'voice' | 'video'>(callType || 'video');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch expert data
  useEffect(() => {
    const fetchExpertData = async () => {
      if (!expertId) return;
      
      try {
        const response = await apiRequest('GET', `/experts/${expertId}`);
        if (response.success) {
          setExpert(response.data);
        }
      } catch (error) {
        console.error('Error fetching expert data:', error);
        toast({
          title: "Error",
          description: "Failed to load expert information.",
          variant: "destructive",
        });
      }
    };

    fetchExpertData();
  }, [expertId, toast]);

  // Fetch chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!sessionId && !expertId) return;
      
      try {
        const endpoint = sessionId ? `/chat/${sessionId}/messages` : `/chat/expert/${expertId}/messages`;
        const response = await apiRequest('GET', endpoint);
        
        if (response.success) {
          setMessages(response.data.messages || []);
        }
        setIsLoadingChat(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setIsLoadingChat(false);
        
        // Create initial welcome message if no session exists
        if (expert) {
          const welcomeMessage: Message = {
            id: `welcome-${Date.now()}`,
            sender: {
              id: expert.id,
              alias: expert.name,
              avatarUrl: expert.avatarUrl,
              isExpert: true
            },
            content: `Hello! I'm ${expert.name}, a ${expert.specialization} specialist. How can I help you today?`,
            timestamp: new Date().toISOString()
          };
          setMessages([welcomeMessage]);
        }
      }
    };

    fetchMessages();
  }, [sessionId, expertId, expert, toast]);

  // Set up socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new messages
    socket.onNewMessage((message: Message) => {
      setMessages(prev => [...prev, message]);
      
      // Mark as delivered if not from current user
      if (message.sender.id !== user?.id) {
        socket.markMessageDelivered(message.id, sessionId || expertId || '');
      }
    });

    // Listen for call invitations
    socket.on('call-invitation', (data: { callType: 'voice' | 'video'; from: any }) => {
      toast({
        title: `Incoming ${data.callType} call`,
        description: `${data.from.alias} is calling you`,
        action: (
          <Button onClick={() => handleAcceptCall(data.callType)}>
            Accept
          </Button>
        ),
      });
    });

    return () => {
      socket.removeAllListeners();
    };
  }, [socket, isConnected, user?.id, sessionId, expertId, toast]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start call if URL indicates call type
  useEffect(() => {
    if (callType && expert) {
      handleStartCall(callType);
    }
  }, [callType, expert]);

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
  };

  const handleStartCall = (type: 'voice' | 'video') => {
    if (!expert) {
      toast({
        title: "Expert not available",
        description: "Please wait for the expert information to load.",
        variant: "destructive",
      });
      return;
    }

    setCurrentCallType(type);
    setIsInCall(true);
    
    // Send call invitation via socket
    if (isConnected && socket) {
      socket.emit('call-invitation', {
        to: expert.id,
        callType: type,
        sessionId: sessionId || expertId
      });
    }
    
    toast({
      title: `Starting ${type} call`,
      description: `Connecting to ${expert.name}...`,
    });
  };

  const handleAcceptCall = (type: 'voice' | 'video') => {
    setCurrentCallType(type);
    setIsInCall(true);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    
    toast({
      title: "Call ended",
      description: "You can continue chatting or start a new call.",
    });
  };

  if (!expert && !isLoadingChat) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Expert not found</p>
      </div>
    );
  }

  if (isInCall && expert) {
    return (
      <VideoCall
        sessionId={sessionId || expertId || 'new-session'}
        expertName={expert.name}
        expertAvatar={expert.avatarUrl || ''}
        onEndCall={handleEndCall}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {expert && (
            <>
              <Avatar className="h-10 w-10">
                <AvatarImage src={expert.avatarUrl} alt={expert.name} />
                <AvatarFallback>{expert.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{expert.name}</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant={expert.isOnline ? "default" : "secondary"} className="text-xs">
                    {expert.isOnline ? "Online" : "Offline"}
                  </Badge>
                  {expert.verified && (
                    <Shield className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        {expert && expert.isOnline && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleStartCall('voice')}
              title="Start voice call"
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleStartCall('video')}
              title="Start video call"
            >
              <Video className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingChat ? (
          <div className="flex items-center justify-center h-32">
            <Loader className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading chat...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.sender.id === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t p-4">
        <ChatInput
          value=""
          onChange={() => {}}
          onSend={handleSendMessage}
          onImageUpload={() => {}} // TODO: Implement image upload
          onVoiceRecord={() => {}} // TODO: Implement voice recording
          onTypingStart={() => {}}
          onTypingStop={() => {}}
          disabled={!expert?.isOnline}
          placeholder={expert?.isOnline ? "Type your message..." : "Expert is offline"}
        />
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border-t border-yellow-200 p-2 text-center">
          <div className="flex items-center justify-center space-x-2 text-yellow-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Connecting to chat...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeChat;