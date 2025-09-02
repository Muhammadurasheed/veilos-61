import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle, Shield, Users } from 'lucide-react';
import type { SanctuaryMessage } from '@/types';

interface RealTimeChatProps {
  sessionId: string;
  participant: {
    id: string;
    alias: string;
  } | null;
  isHost?: boolean;
  className?: string;
}

// Create a mock function for generating a random avatar color
const getAvatarColor = (alias: string): string => {
  const colors = [
    'bg-red-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 
    'bg-purple-200', 'bg-pink-200', 'bg-indigo-200', 'bg-teal-200'
  ];
  
  const charSum = alias.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[charSum % colors.length];
};

const getInitials = (alias: string): string => {
  return alias
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const RealTimeChat: React.FC<RealTimeChatProps> = ({
  sessionId,
  participant,
  isHost = false,
  className = ""
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<SanctuaryMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket connection for real-time chat
  useEffect(() => {
    if (!sessionId || !participant) return;

    // Initialize WebSocket connection
    const wsUrl = `ws://localhost:3000/sanctuary/${sessionId}/chat`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Send join message
      ws.send(JSON.stringify({
        type: 'join',
        participantId: participant.id,
        alias: participant.alias,
        sessionId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'message':
            setMessages(prev => [...prev, data.message]);
            break;
          case 'participant_joined':
            setParticipantCount(data.count);
            addSystemMessage(`${data.alias} joined the sanctuary`);
            break;
          case 'participant_left':
            setParticipantCount(data.count);
            addSystemMessage(`${data.alias} left the sanctuary`);
            break;
          case 'participant_count':
            setParticipantCount(data.count);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    // Load initial messages (mock data for now)
    loadInitialMessages();

    return () => {
      ws.close();
    };
  }, [sessionId, participant]);

  const loadInitialMessages = () => {
    const initialMessages: SanctuaryMessage[] = [
      {
        id: "system-1",
        participantId: "system",
        participantAlias: "System",
        content: "Welcome to this sanctuary space. This is a safe place for support and connection.",
        timestamp: new Date(Date.now() - 600000).toISOString(),
        type: "system"
      },
      {
        id: "msg-1",
        participantId: "p-1",
        participantAlias: "Healing Journey",
        content: "Hello everyone. I've been feeling a bit overwhelmed lately with everything going on.",
        timestamp: new Date(Date.now() - 500000).toISOString(),
        type: "text"
      },
      {
        id: "msg-2",
        participantId: "p-2",
        participantAlias: "Inner Peace",
        content: "I understand that feeling. It can be really tough when everything piles up.",
        timestamp: new Date(Date.now() - 400000).toISOString(),
        type: "text"
      }
    ];
    setMessages(initialMessages);
    setParticipantCount(3);
  };

  const addSystemMessage = (content: string) => {
    const message: SanctuaryMessage = {
      id: `system-${Date.now()}`,
      participantId: "system",
      participantAlias: "System",
      content,
      timestamp: new Date().toISOString(),
      type: "system"
    };
    
    setMessages(prev => [...prev, message]);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !participant || !wsRef.current) return;

    const message: SanctuaryMessage = {
      id: `msg-${Date.now()}`,
      participantId: participant.id,
      participantAlias: participant.alias,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: "text"
    };

    // Send via WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'message',
      message,
      sessionId
    }));

    // Add to local state immediately for better UX
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!participant) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Join the sanctuary to start chatting</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
              {isConnected ? "Connected" : "Connecting..."}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {participantCount}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Messages Area */}
        <div className="h-96 overflow-y-auto space-y-3 pr-2">
          {messages.map((message) => (
            <div key={message.id} className="space-y-1">
              {message.type === 'system' ? (
                <div className="text-center">
                  <Badge variant="outline" className="text-xs bg-muted">
                    <Shield className="h-3 w-3 mr-1" />
                    {message.content}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={getAvatarColor(message.participantAlias)}>
                      {getInitials(message.participantAlias)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {message.participantAlias}
                      </p>
                      {message.participantId === participant.id && (
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex items-center space-x-2 pt-2 border-t">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
            disabled={!isConnected}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {!isConnected && (
          <div className="text-center text-xs text-muted-foreground">
            Connecting to chat server...
          </div>
        )}
      </CardContent>
    </Card>
  );
};