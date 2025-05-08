
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useUserContext } from '@/contexts/UserContext';
import { formatDate } from '@/lib/alias';

// This is a placeholder component for now - we'll connect it to real data later
const ChatPage = () => {
  const { sessionId } = useParams();
  const { user } = useUserContext();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([
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
      content: 'I've been feeling really anxious lately and having trouble sleeping.',
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
      content: 'I'm sorry to hear you're going through that. Anxiety and sleep issues often go hand in hand. Can you tell me when this started and if there's anything specific that might have triggered these feelings?',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString() // 25 minutes ago
    },
  ]);

  useEffect(() => {
    // This would be a real API call to fetch messages for this session
    if (sessionId) {
      console.log(`Fetching messages for session ${sessionId}`);
      // Fetch real messages here
    }
  }, [sessionId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const newMessage = {
      id: `local-${Date.now()}`,
      sender: {
        id: user?.id || 'user-1',
        alias: user?.alias || 'Anonymous',
        avatarIndex: user?.avatarIndex || 1,
        isExpert: false
      },
      content: message.trim(),
      timestamp: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setMessage('');
    
    // This would make a real API call to send the message
    console.log('Sending message:', message);
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
              <Button variant="outline" size="sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>
                Schedule Session
              </Button>
              <Button variant="default" size="sm" className="bg-veilo-blue hover:bg-veilo-blue-dark">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m2 8 4 4"></path><path d="m6 12 4-4"></path><path d="M22 12v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4"></path><path d="M18 12a2 2 0 0 0 0-4 2 2 0 0 0-4 0"></path><path d="M14 8a2 2 0 0 0 0 4 2 2 0 0 0 4 0"></path><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="18" r="3"></circle></svg>
                Start Video Call
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
                      <p>{msg.content}</p>
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${
                      msg.sender.isExpert ? 'text-left' : 'text-right'
                    }`}>
                      {formatDate(msg.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Message input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
              </Button>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button 
                type="submit" 
                className="flex-shrink-0 bg-veilo-blue hover:bg-veilo-blue-dark text-white"
                disabled={!message.trim()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ChatPage;
