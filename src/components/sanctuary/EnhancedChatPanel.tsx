import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ChevronUp, Shield, AtSign } from 'lucide-react';
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
}

interface EnhancedChatPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  messages: ChatMessage[];
  participants: LiveParticipant[];
  currentUserAlias: string;
  onSendMessage: (content: string, type?: 'text' | 'emoji-reaction' | 'media', attachment?: any) => void;
}

export const EnhancedChatPanel = ({
  isVisible,
  onToggle,
  messages,
  participants,
  currentUserAlias,
  onSendMessage
}: EnhancedChatPanelProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Handle @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;
    
    setNewMessage(value);
    setCursorPosition(position);

    // Check for @ mentions
    const textBeforeCursor = value.substring(0, position);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setMentionQuery('');
    }
  };

  // Filter participants for mention suggestions
  const mentionSuggestions = participants.filter(p => 
    p.alias.toLowerCase().includes(mentionQuery.toLowerCase()) &&
    p.alias !== currentUserAlias
  ).slice(0, 5);

  // Insert mention
  const insertMention = (participantAlias: string) => {
    const textBeforeCursor = newMessage.substring(0, cursorPosition);
    const textAfterCursor = newMessage.substring(cursorPosition);
    const beforeMention = textBeforeCursor.replace(/@\w*$/, `@${participantAlias} `);
    
    setNewMessage(beforeMention + textAfterCursor);
    setShowSuggestions(false);
    setMentionQuery('');
    
    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
      const newPosition = beforeMention.length;
      inputRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() && !selectedFile) return;
    
    if (selectedFile) {
      // Handle file upload
      const reader = new FileReader();
      reader.onload = () => {
        onSendMessage(newMessage.trim() || `Shared ${selectedFile.type.startsWith('image/') ? 'image' : 'file'}: ${selectedFile.name}`, 'media', {
          file: reader.result,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size
        });
        setSelectedFile(null);
        setNewMessage('');
        setShowSuggestions(false);
        setMentionQuery('');
      };
      reader.readAsDataURL(selectedFile);
    } else {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      setShowSuggestions(false);
      setMentionQuery('');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showSuggestions && mentionSuggestions.length > 0) {
        insertMention(mentionSuggestions[0].alias);
      } else {
        handleSendMessage();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
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
      return (
        <div className="flex items-start space-x-2">
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
            </div>
            <div className="bg-muted rounded p-2 mt-1">
              {message.attachment.fileType?.startsWith('image/') ? (
                <img 
                  src={message.attachment.file} 
                  alt={message.attachment.fileName}
                  className="max-w-xs rounded"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📎</span>
                  <span className="text-sm">{message.attachment.fileName}</span>
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

    // Highlight mentions in text messages
    const highlightMentions = (text: string) => {
      return text.replace(/@(\w+)/g, (match, username) => {
        const isCurrentUser = username === currentUserAlias;
        return `<span class="bg-primary/20 text-primary font-medium px-1 rounded ${
          isCurrentUser ? 'bg-accent/30 text-accent-foreground' : ''
        }">${match}</span>`;
      });
    };

    return (
      <div className="flex items-start space-x-2">
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
          </div>
          <div 
            className="text-sm break-words"
            dangerouslySetInnerHTML={{ __html: highlightMentions(message.content) }}
          />
        </div>
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Chat</span>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <ChevronUp className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages Container with Fixed Height */}
        <div className="h-64 overflow-y-auto space-y-3 px-4 pb-3">
          {messages.map((message) => (
            <div key={message.id} className="space-y-1">
              {renderMessage(message)}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Mention Suggestions */}
        {showSuggestions && mentionSuggestions.length > 0 && (
          <div className="border-t border-b bg-muted/50 p-2">
            <div className="text-xs text-muted-foreground mb-2 flex items-center">
              <AtSign className="h-3 w-3 mr-1" />
              Participants
            </div>
            <div className="space-y-1">
              {mentionSuggestions.map((participant) => (
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

        {/* File Preview */}
        {selectedFile && (
          <div className="border-t p-3 bg-muted/50">
            <div className="flex items-center justify-between p-2 bg-background rounded border">
              <span className="text-sm text-muted-foreground">
                📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        {/* Message Input with Enhanced Features */}
        <div className="border-t p-3">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-muted-foreground hover:text-primary"
            >
              📎
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Type a message... (@username to tag)"
                className="text-sm pr-8"
              />
              {newMessage.includes('@') && (
                <AtSign className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() && !selectedFile}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};