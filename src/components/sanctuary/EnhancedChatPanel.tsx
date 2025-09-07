import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Smile, Send, Paperclip, X, Eye, Download, FileText, Reply } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { chatMessageCache, type CachedMessage } from './ChatMessageCache';

interface MediaPreview {
  url?: string;
  fileName: string;
  fileType: string;
  file?: File;
}

interface ChatMessage {
  id: string;
  senderAlias: string;
  senderAvatarIndex: number;
  content: string;
  timestamp: string;
  type: 'text' | 'system' | 'emoji-reaction' | 'media';
  attachment?: any;
  replyTo?: string;
}

interface EnhancedChatPanelProps {
  sessionId: string;
  participantAlias: string;
  onEvent?: (event: string, handler: Function) => Function;
  sendMessage?: (content: string, type?: string, attachment?: any) => void;
}

export const EnhancedChatPanel = ({ 
  sessionId, 
  participantAlias, 
  onEvent,
  sendMessage: socketSendMessage 
}: EnhancedChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isForceMuted, setIsForceMuted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load cached messages on mount
  useEffect(() => {
    const cachedMessages = chatMessageCache.loadMessages(sessionId);
    if (cachedMessages.length > 0) {
      console.log('💬 Loading cached messages:', cachedMessages.length);
      const formattedMessages: ChatMessage[] = cachedMessages.map(cached => ({
        id: cached.id,
        senderAlias: cached.senderAlias,
        senderAvatarIndex: cached.senderAvatarIndex,
        content: cached.content,
        timestamp: cached.timestamp,
        type: cached.type,
        attachment: cached.attachment,
        replyTo: cached.replyTo
      }));
      setMessages(formattedMessages);
    }
  }, [sessionId]);

  // Clean up URL object when component unmounts or media preview changes
  useEffect(() => {
    return () => {
      if (mediaPreview?.url) {
        URL.revokeObjectURL(mediaPreview.url);
      }
    };
  }, [mediaPreview]);

  // Socket event listeners
  useEffect(() => {
    if (!onEvent) return;

    const cleanupNewMessage = onEvent('new_message', (messageData) => {
      console.log('📨 New message received:', messageData);
      const newMsg: ChatMessage = {
        id: messageData.id,
        senderAlias: messageData.senderAlias,
        senderAvatarIndex: messageData.senderAvatarIndex || 1,
        content: messageData.content,
        timestamp: messageData.timestamp,
        type: messageData.type || 'text',
        attachment: messageData.attachment,
        replyTo: messageData.replyTo
      };
      
      setMessages(prev => {
        // Prevent duplicate messages
        if (prev.find(m => m.id === newMsg.id)) {
          return prev;
        }
        const updated = [...prev, newMsg];
        // Cache messages
        chatMessageCache.saveMessages(sessionId, updated);
        return updated;
      });
    });

    const cleanupForceMuted = onEvent('force_muted', () => {
      setIsForceMuted(true);
    });

    const cleanupForceUnmuted = onEvent('force_unmuted', () => {
      setIsForceMuted(false);
    });

    return () => {
      cleanupNewMessage?.();
      cleanupForceMuted?.();
      cleanupForceUnmuted?.();
    };
  }, [onEvent, sessionId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }
      
      const preview: MediaPreview = {
        fileName: file.name,
        fileType: file.type,
        file
      };
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        preview.url = URL.createObjectURL(file);
      }
      
      setMediaPreview(preview);
    }
    event.target.value = '';
  };

  const handleEmojiReaction = (emoji: string) => {
    if (socketSendMessage) {
      socketSendMessage(emoji, 'emoji-reaction');
    }
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !mediaPreview) return;

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      
      if (newMessage.trim()) {
        formData.append('content', newMessage.trim());
      }
      
      formData.append('type', mediaPreview ? 'media' : 'text');
      formData.append('participantAlias', participantAlias);
      
      if (replyingTo) {
        formData.append('replyTo', replyingTo.id);
      }
      
      if (mediaPreview?.file) {
        formData.append('attachment', mediaPreview.file);
      }

      const response = await fetch(`/api/flagship-chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setNewMessage('');
        setMediaPreview(null);
        setReplyingTo(null);
        console.log('✅ Message sent successfully');
      } else {
        console.error('❌ Failed to send message:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Send message error:', error);
    }
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Chat</span>
          <Badge variant="secondary" className="text-xs">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          <div className="space-y-3 flex-1 overflow-y-auto">
            {messages.map((message) => {
              const replyMessage = message.replyTo ? messages.find(m => m.id === message.replyTo) : null;
              
              return (
                <div
                  key={message.id}
                  className="flex gap-3 group hover:bg-background/5 p-2 rounded-lg transition-colors"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={`/avatars/avatar-${message.senderAvatarIndex}.svg`}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full border-2 border-primary/20"
                    />
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium text-foreground text-sm">
                        {message.senderAlias}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.timestamp), 'HH:mm')}
                      </span>
                      
                      {/* Reply Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                        onClick={() => setReplyingTo(message)}
                      >
                        <Reply className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Reply Context */}
                    {replyMessage && (
                      <div className="mb-2 p-2 bg-muted/30 rounded border-l-2 border-primary/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Reply className="w-3 h-3 text-primary" />
                          <span className="text-xs font-medium text-primary">
                            {replyMessage.senderAlias}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {replyMessage.content || (replyMessage.attachment ? 'Sent an attachment' : 'Message')}
                        </p>
                      </div>
                    )}

                    {/* Message Text */}
                    {message.content && (
                      <p className="text-sm text-foreground/90 break-words">
                        {message.content}
                      </p>
                    )}

                    {/* Media Attachment */}
                    {message.attachment && (
                      <div className="mt-2">
                        {message.attachment.fileType?.startsWith('image/') ? (
                          <div className="relative group/media">
                            <img
                              src={message.attachment.url}
                              alt={message.attachment.fileName}
                              className="max-w-xs max-h-48 rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setMediaPreview({
                                url: message.attachment.url,
                                fileName: message.attachment.fileName,
                                fileType: message.attachment.fileType
                              })}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                              <Eye className="w-6 h-6 text-white opacity-0 group-hover/media:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border border-border max-w-xs">
                            <FileText className="w-4 h-4 text-primary" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {message.attachment.fileName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(message.attachment.fileSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(message.attachment.url, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="border-t border-border p-4 space-y-3">
          {/* Reply Context */}
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-2 bg-muted/30 rounded border-l-2 border-primary/50"
            >
              <Reply className="w-4 h-4 text-primary" />
              <div className="flex-1">
                <span className="text-xs font-medium text-primary">
                  Replying to {replyingTo.senderAlias}
                </span>
                <p className="text-xs text-muted-foreground truncate">
                  {replyingTo.content || (replyingTo.attachment ? 'Sent an attachment' : 'Message')}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplyingTo(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </motion.div>
          )}

          {/* Emoji Picker */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-popover border border-border rounded-lg p-3 mb-3 shadow-lg"
              >
                <div className="grid grid-cols-8 gap-2">
                  {['😀', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💯', '🙏', '👏', '😭', '😍', '🤔', '😅', '🎵', '✅'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiReaction(emoji)}
                      className="text-2xl hover:bg-accent rounded p-2 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Media Preview */}
          {mediaPreview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-muted/50 rounded-lg border border-border"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Attachment Preview</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMediaPreview(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {mediaPreview.url ? (
                <img
                  src={mediaPreview.url}
                  alt={mediaPreview.fileName}
                  className="max-w-full max-h-32 rounded border border-border"
                />
              ) : (
                <div className="flex items-center gap-2 p-2 bg-background rounded">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{mediaPreview.fileName}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Message Input */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1"
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={handleSendMessage}
              size="sm"
              disabled={!newMessage.trim() && !mediaPreview}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};