import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ChevronUp, Shield, AtSign, Paperclip, Reply, X, Maximize2, Minimize2, GripVertical } from 'lucide-react';
import { MediaPreviewModal } from './MediaPreviewModal';
import { chatMessageCache, type CachedMessage } from './ChatMessageCache';
import type { LiveParticipant } from '@/types/sanctuary';

interface ChatMessage {
  id: string;
  senderAlias: string;
  senderAvatarIndex: number;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'emoji-reaction' | 'media';
  mentions?: string[];
  attachment?: any;
  replyTo?: string;
  replyToMessage?: {
    id: string;
    content: string;
    senderAlias: string;
    timestamp: string;
  };
}

interface ResizableChatPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  messages: ChatMessage[];
  participants: LiveParticipant[];
  currentUserAlias: string;
  sessionId: string;
  onSendMessage: (content: string, type?: 'text' | 'emoji-reaction' | 'media', attachment?: any, replyTo?: string) => void;
}

export const ResizableChatPanel = ({
  isVisible,
  onToggle,
  messages,
  participants,
  currentUserAlias,
  sessionId,
  onSendMessage
}: ResizableChatPanelProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatWidth, setChatWidth] = useState(384); // Default w-96
  const [isResizing, setIsResizing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Cache messages for persistence
  useEffect(() => {
    if (messages.length > 0) {
      const cachedMessages: CachedMessage[] = messages.map(msg => ({
        id: msg.id,
        senderAlias: msg.senderAlias,
        senderAvatarIndex: msg.senderAvatarIndex,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        type: msg.type,
        attachment: msg.attachment,
        replyTo: msg.replyTo,
        replyToMessage: msg.replyToMessage
      }));
      chatMessageCache.saveMessages(sessionId, cachedMessages);
    }
  }, [messages, sessionId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Resize handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      setChatWidth(Math.max(300, Math.min(800, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Handle mentions
  const filteredParticipants = participants.filter(p => 
    p.alias.toLowerCase().includes(mentionQuery.toLowerCase()) && p.alias !== currentUserAlias
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    const position = e.target.selectionStart || 0;
    setCursorPosition(position);
    
    // Check for @ mentions
    const beforeCursor = value.substring(0, position);
    const atMatch = beforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = (alias: string) => {
    const beforeCursor = newMessage.substring(0, cursorPosition);
    const afterCursor = newMessage.substring(cursorPosition);
    const beforeAt = beforeCursor.replace(/@\w*$/, '');
    const newValue = `${beforeAt}@${alias} ${afterCursor}`;
    
    setNewMessage(newValue);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Find mentioned users
    const mentions = newMessage.match(/@(\w+)/g)?.map(m => m.substring(1)) || [];
    
    onSendMessage(newMessage, 'text', undefined, replyingTo?.id);
    setNewMessage('');
    setReplyingTo(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowMediaPreview(true);
    }
  };

  const handleMediaSend = async (file: File, caption?: string) => {
    try {
      // Try backend upload first
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);
      formData.append('senderAlias', currentUserAlias);
      if (caption) formData.append('caption', caption);
      if (replyingTo?.id) formData.append('replyTo', replyingTo.id);

      const response = await fetch('/api/flagship-chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('veilo-auth-token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Media uploaded successfully:', result);
      } else {
        // Fallback to base64 method
        const reader = new FileReader();
        reader.onload = () => {
          onSendMessage(caption || `Shared ${file.type.startsWith('image/') ? 'image' : 'file'}: ${file.name}`, 'media', {
            file: reader.result,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
          }, replyingTo?.id);
        };
        reader.readAsDataURL(file);
      }
      
      setSelectedFile(null);
      setShowMediaPreview(false);
      setReplyingTo(null);
    } catch (error) {
      console.error('❌ Media upload error:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showSuggestions && filteredParticipants.length > 0) {
        insertMention(filteredParticipants[0].alias);
      } else {
        handleSendMessage();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setReplyingTo(null);
    }
  };

  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  const findReplyToMessage = (replyToId: string): ChatMessage | undefined => {
    return messages.find(m => m.id === replyToId);
  };

  const renderMessage = (message: ChatMessage) => {
    if (message.type === 'system') {
      return (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            {message.content}
          </Badge>
        </div>
      );
    }

    if (message.type === 'emoji-reaction') {
      return (
        <div className="text-center">
          <span className="text-2xl">{message.content}</span>
          <div className="text-xs text-muted-foreground">
            {message.senderAlias} • {formatTime(message.timestamp)}
          </div>
        </div>
      );
    }

    if (message.type === 'media' && message.attachment) {
      const replyToMsg = message.replyTo ? (message.replyToMessage || findReplyToMessage(message.replyTo)) : null;
      
      return (
        <div className="flex items-start space-x-2 hover:bg-muted/30 p-1 rounded cursor-pointer group">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`/avatars/avatar-${message.senderAvatarIndex}.svg`} />
            <AvatarFallback className="text-xs">
              {message.senderAlias.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <span className="text-xs font-medium truncate">
                {message.senderAlias}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTime(message.timestamp)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                onClick={() => handleReplyToMessage(message)}
              >
                <Reply className="h-3 w-3" />
              </Button>
            </div>
            
            {replyToMsg && (
              <div className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-2 mb-1 bg-muted/20 rounded-r p-1">
                ↳ <strong>{replyToMsg.senderAlias}</strong>: {replyToMsg.content.substring(0, 50)}
                {replyToMsg.content.length > 50 && '...'}
              </div>
            )}
            
            <div className="mt-1">
              {message.attachment.fileType?.startsWith('image/') ? (
                <img 
                  src={message.attachment.file || message.attachment.url} 
                  alt={message.attachment.fileName}
                  className="max-w-48 max-h-32 object-contain rounded border"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2 border rounded bg-muted/50 max-w-64">
                  <span className="text-lg">📎</span>
                  <div>
                    <span className="text-sm font-medium">{message.attachment.fileName}</span>
                    <div className="text-xs text-muted-foreground">
                      {message.attachment.fileSize ? `${(message.attachment.fileSize / 1024).toFixed(1)} KB` : 'File'}
                    </div>
                  </div>
                </div>
              )}
              {message.content && (
                <div className="text-sm mt-1">{message.content}</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Regular text messages with enhanced reply chain
    const replyToMsg = message.replyTo ? (message.replyToMessage || findReplyToMessage(message.replyTo)) : null;
    
    const highlightMentions = (text: string) => {
      return text.replace(/@(\w+)/g, (match, username) => {
        const isCurrentUser = username === currentUserAlias;
        return `<span class="bg-primary/20 text-primary font-medium px-1 rounded ${
          isCurrentUser ? 'bg-accent/30 text-accent-foreground' : ''
        }">${match}</span>`;
      });
    };

    return (
      <div 
        className="flex items-start space-x-2 hover:bg-muted/30 p-1 rounded cursor-pointer group"
        onDoubleClick={() => handleReplyToMessage(message)}
      >
        <Avatar className="h-6 w-6">
          <AvatarImage src={`/avatars/avatar-${message.senderAvatarIndex}.svg`} />
          <AvatarFallback className="text-xs">
            {message.senderAlias.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium truncate">
              {message.senderAlias}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
              onClick={() => handleReplyToMessage(message)}
            >
              <Reply className="h-3 w-3" />
            </Button>
          </div>
          
          {replyToMsg && (
            <div className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-2 mb-1 bg-muted/20 rounded-r p-1">
              ↳ <strong>{replyToMsg.senderAlias}</strong>: {replyToMsg.content.substring(0, 50)}
              {replyToMsg.content.length > 50 && '...'}
            </div>
          )}
          
          <div 
            className="text-sm break-words"
            dangerouslySetInnerHTML={{ __html: highlightMentions(message.content) }}
          />
        </div>
      </div>
    );
  };

  if (!isVisible) return null;

  const chatStyle = isFullscreen ? 
    { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 } :
    { width: chatWidth };

  return (
    <>
      {/* Resize Handle */}
      {isVisible && !isFullscreen && (
        <div 
          ref={resizeRef}
          className="fixed right-0 top-0 bottom-0 w-1 bg-border hover:bg-primary/50 cursor-col-resize z-40"
          style={{ right: chatWidth }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
      
      <Card 
        ref={chatPanelRef}
        className={`${isFullscreen ? 'h-full' : 'mb-4 h-[500px]'} flex flex-col`}
        style={chatStyle}
      >
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Chat</span>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                title="Expand chat height"
              >
                <ChevronUp className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title="Toggle fullscreen"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
          {/* Messages Container */}
          <div className={`overflow-y-auto space-y-3 px-4 pb-3 flex-1 ${isExpanded ? 'min-h-[400px]' : ''}`}>
            {messages.map((message) => (
              <div key={message.id} className="space-y-1">
                {renderMessage(message)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Mention Suggestions */}
          {showSuggestions && filteredParticipants.length > 0 && (
            <div className="border-t border-b bg-muted/50 p-2 flex-shrink-0">
              <div className="text-xs text-muted-foreground mb-2 flex items-center">
                <AtSign className="h-3 w-3 mr-1" />
                Participants
              </div>
              <div className="space-y-1">
                {filteredParticipants.map((participant) => (
                  <button
                    key={participant.id}
                    onClick={() => insertMention(participant.alias)}
                    className="w-full text-left p-2 rounded hover:bg-muted/80 transition-colors flex items-center space-x-2"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={`/avatars/avatar-${participant.avatarIndex || 1}.svg`} />
                      <AvatarFallback className="text-xs">
                        {participant.alias.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{participant.alias}</span>
                    {participant.isHost && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">Host</Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="border-t p-3 flex-shrink-0">
            {replyingTo && (
              <div className="bg-muted/50 p-2 text-xs border-l-2 border-primary/30 mb-2">
                <div className="flex items-center justify-between">
                  <span>
                    ↳ Replying to <strong>{replyingTo.senderAlias}</strong>: 
                    {replyingTo.content.length > 50 
                      ? `${replyingTo.content.substring(0, 50)}...` 
                      : replyingTo.content
                    }
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => setReplyingTo(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-muted-foreground hover:text-primary"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt,video/*"
                className="hidden"
              />
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder={replyingTo ? "Reply to message..." : "Type @ to mention someone..."}
                  className="pr-20"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Preview Modal */}
      <MediaPreviewModal
        isOpen={showMediaPreview}
        onClose={() => {
          setShowMediaPreview(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
        onSend={handleMediaSend}
      />
    </>
  );
};