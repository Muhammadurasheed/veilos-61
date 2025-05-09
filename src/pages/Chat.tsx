import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useUserContext } from '@/contexts/UserContext';
import { formatDate } from '@/lib/alias';
import { Mic, Send, Image, Paperclip, Phone, Video, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const ChatPage = () => {
  const { sessionId } = useParams();
  const { user } = useUserContext();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: {
        id: 'expert-1',
        alias: 'Dr. Emma Wilson',
        avatarUrl: '/experts/expert-1.jpg',
        isExpert: true
      },
      content: 'Hello! How can I help you today?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
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
      timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString() // 28 minutes ago
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
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString() // 25 minutes ago
    },
  ]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // This would be a real API call to fetch messages for this session
    if (sessionId) {
      console.log(`Fetching messages for session ${sessionId}`);
      // Fetch real messages here
      
      // Simulate typing indicator
      const typingInterval = setInterval(() => {
        setIsTyping(prev => !prev);
      }, 5000);
      
      return () => clearInterval(typingInterval);
    }
  }, [sessionId]);

  const handleSendMessage = (e: React.FormEvent) => {
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
    
    // Simulate sending message to server
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
  };

  const handleVoiceNote = () => {
    setIsRecording(!isRecording);
    
    // In a real implementation, we would start/stop recording here
    if (isRecording) {
      // Simulate sending a voice note
      const voiceNote: Message = {
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
          url: '#',
          type: 'audio/webm'
        }
      };
      
      setMessages(prev => [...prev, voiceNote]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // In a real implementation, we would upload the file to a server
      // For now, let's simulate sending an image message
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
          url: URL.createObjectURL(file),
          type: file.type
        }
      };
      
      setMessages(prev => [...prev, imageMessage]);
    }
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
              <Button variant="outline" size="icon" className="rounded-full">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
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
                          <Button variant={msg.sender.isExpert ? "outline" : "secondary"} size="sm" className="h-8 w-8 rounded-full p-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                          </Button>
                          <div className="w-32 h-2 bg-gray-300 dark:bg-gray-600 rounded-full">
                            <div className="h-full w-0 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
                          </div>
                          <span className="text-xs">0:00</span>
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
            ))}
            
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
                  >
                    <Image className="h-5 w-5 text-gray-500" />
                  </Button>
                  <input 
                    id="image-upload" 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="rounded-full"
                >
                  <Paperclip className="h-5 w-5 text-gray-500" />
                </Button>
              </div>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full"
                disabled={isRecording}
              />
              <div className="flex-shrink-0">
                {message.trim() ? (
                  <Button 
                    type="submit" 
                    size="icon"
                    className="rounded-full bg-veilo-blue hover:bg-veilo-blue-dark text-white"
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
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </form>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ChatPage;
