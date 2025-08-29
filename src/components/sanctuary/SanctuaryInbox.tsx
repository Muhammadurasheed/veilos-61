import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Inbox, 
  MessageCircle, 
  Clock, 
  Search, 
  Filter, 
  Download,
  RefreshCw,
  Users,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSanctuaryRealtime } from '@/hooks/useSanctuaryRealtime';
import { SanctuaryApi } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SanctuaryMessage {
  id: string;
  alias: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

const SanctuaryInbox = () => {
  // Handle both parameter formats: /sanctuary-inbox/:id and /sanctuary/inbox/:sessionId
  const params = useParams<{ id?: string; sessionId?: string }>();
  const sanctuaryId = params.id || params.sessionId;
  const [searchParams] = useSearchParams();
  const urlHostToken = searchParams.get('hostToken');
  const { toast } = useToast();
  
  // Get host token from URL params or localStorage
  const getHostToken = () => {
    if (urlHostToken) return urlHostToken;
    if (sanctuaryId) {
      const storedToken = localStorage.getItem(`sanctuary-host-${sanctuaryId}`);
      const expiryTime = localStorage.getItem(`sanctuary-host-${sanctuaryId}-expires`);
      
      if (storedToken && expiryTime) {
        const expiryDate = new Date(expiryTime);
        const now = new Date();
        
        if (now > expiryDate) {
          localStorage.removeItem(`sanctuary-host-${sanctuaryId}`);
          localStorage.removeItem(`sanctuary-host-${sanctuaryId}-expires`);
          return null;
        }
        return storedToken;
      }
    }
    return null;
  };

  const hostToken = getHostToken();
  
  const [messages, setMessages] = useState<SanctuaryMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [sanctuary, setSanctuary] = useState<any>(null);

  // Store host token if from URL
  useEffect(() => {
    if (urlHostToken && sanctuaryId) {
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 48);
      
      localStorage.setItem(`sanctuary-host-${sanctuaryId}`, urlHostToken);
      localStorage.setItem(`sanctuary-host-${sanctuaryId}-expires`, expiryDate.toISOString());
      
      // Clean URL
      window.history.replaceState({}, '', `/sanctuary/inbox/${sanctuaryId}`);
    }
  }, [sanctuaryId, urlHostToken]);

  function handleNewMessage(submission: any) {
    const newMessage: SanctuaryMessage = {
      id: submission.id,
      alias: submission.alias,
      message: submission.message,
      timestamp: submission.timestamp,
      isRead: false
    };
    
    setMessages(prev => [newMessage, ...prev]);
    
    toast({
      title: '📮 New Anonymous Message',
      description: `From ${submission.alias}`,
      duration: 5000,
    });
  }

  // Real-time connection
  const { 
    isConnected, 
    connectionQuality, 
    totalSubmissions,
    markMessageAsRead,
    requestNotificationPermission 
  } = useSanctuaryRealtime({
    sanctuaryId: sanctuaryId || '',
    hostToken: hostToken || undefined,
    onNewSubmission: handleNewMessage,
    enableNotifications: true
  });

  // Load sanctuary details and messages
  useEffect(() => {
    loadSanctuaryData();
    requestNotificationPermission();
  }, [sanctuaryId, hostToken]);

  const loadSanctuaryData = async () => {
    if (!sanctuaryId || !hostToken) return;
    
    try {
      setIsLoading(true);
      
      // Load sanctuary details
      const sanctuaryResponse = await SanctuaryApi.getSession(sanctuaryId);
      if (sanctuaryResponse.success) {
        setSanctuary(sanctuaryResponse.data);
      }
      
      // Load messages/submissions
      const messagesResponse = await SanctuaryApi.getSubmissions(sanctuaryId, hostToken);
      if (messagesResponse.success) {
        const formattedMessages = messagesResponse.data.map((submission: any) => ({
          id: submission.id,
          alias: submission.alias,
          message: submission.message,
          timestamp: submission.timestamp,
          isRead: submission.isRead || false
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to load sanctuary data:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Load Messages',
        description: 'Could not load your sanctuary inbox. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = useCallback((messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
    markMessageAsRead(messageId);
  }, [markMessageAsRead]);

  const handleMarkAllAsRead = () => {
    const unreadMessages = messages.filter(msg => !msg.isRead);
    unreadMessages.forEach(msg => {
      handleMarkAsRead(msg.id);
    });
  };

  const handleExportMessages = () => {
    const exportData = messages.map(msg => ({
      timestamp: new Date(msg.timestamp).toLocaleString(),
      alias: msg.alias,
      message: msg.message,
      read: msg.isRead ? 'Yes' : 'No'
    }));
    
    const csvContent = [
      'Timestamp,Alias,Message,Read',
      ...exportData.map(row => 
        `"${row.timestamp}","${row.alias}","${row.message.replace(/"/g, '""')}","${row.read}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sanctuary-${sanctuaryId}-messages.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    const matchesSearch = searchTerm === '' || 
      msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.alias.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !showUnreadOnly || !msg.isRead;
    
    return matchesSearch && matchesFilter;
  });

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  if (!sanctuaryId || !hostToken) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Sanctuary Access</h1>
        <p className="text-muted-foreground">
          This link appears to be invalid or expired.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Inbox className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="flex items-center gap-2">
                  Sanctuary Inbox
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {unreadCount} new
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {sanctuary?.topic || 'Anonymous Message Collection'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "flex items-center gap-1",
                  isConnected 
                    ? "border-green-200 text-green-800 bg-green-50" 
                    : "border-red-200 text-red-800 bg-red-50"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                )} />
                {isConnected ? 'Live' : 'Disconnected'}
              </Badge>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadSanctuaryData}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Messages</p>
                <p className="text-2xl font-bold">{messages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Contributors</p>
                <p className="text-2xl font-bold">
                  {new Set(messages.map(m => m.alias)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Connection</p>
                <p className="text-sm font-bold">
                  {connectionQuality.latency}ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              <Button
                variant={showUnreadOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showUnreadOnly ? "Show All" : "Unread Only"}
              </Button>
            </div>
            
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Mark All Read
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportMessages}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle>
            Messages ({filteredMessages.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredMessages.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <div className="space-y-1 p-4">
                {filteredMessages.map((message, index) => (
                  <div key={message.id}>
                    <div 
                      className={cn(
                        "p-4 rounded-lg transition-colors cursor-pointer hover:bg-muted/50",
                        !message.isRead && "bg-blue-50 border-l-4 border-l-blue-500"
                      )}
                      onClick={() => !message.isRead && handleMarkAsRead(message.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">
                              {message.alias}
                            </span>
                            {!message.isRead && (
                              <Badge variant="secondary" className="text-xs">
                                New
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground break-words">
                            {message.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {message.isRead ? (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </div>
                    {index < filteredMessages.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-10">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">
                {searchTerm || showUnreadOnly ? 'No messages found' : 'No messages yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || showUnreadOnly 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Anonymous messages will appear here when people use your sanctuary link.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SanctuaryInbox;