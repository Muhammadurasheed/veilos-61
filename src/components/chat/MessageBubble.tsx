import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/alias';
import { Play, Pause, Download, CheckCheck, Check } from 'lucide-react';

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

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  onImageClick?: (imageUrl: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showAvatar = true,
  onImageClick
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const handleVoicePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const getStatusIcon = () => {
    if (!isOwnMessage) return null;

    switch (message.status) {
      case 'sending':
        return <div className="w-3 h-3 rounded-full bg-gray-400 animate-pulse" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-primary" />;
      default:
        return null;
    }
  };

  const getAvatarSrc = () => {
    if (message.sender.avatarUrl) {
      return message.sender.avatarUrl;
    }
    if (message.sender.avatarIndex) {
      return `/avatars/avatar-${message.sender.avatarIndex}.svg`;
    }
    return undefined;
  };

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isOwnMessage ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0">
          <Avatar className="w-8 h-8">
            <AvatarImage src={getAvatarSrc()} alt={message.sender.alias} />
            <AvatarFallback className="text-xs">
              {message.sender.alias.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[70%]",
        isOwnMessage ? "items-end" : "items-start"
      )}>
        {/* Sender name and expert badge */}
        {!isOwnMessage && showAvatar && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-muted-foreground">
              {message.sender.alias}
            </span>
            {message.sender.isExpert && (
              <Badge variant="secondary" className="text-xs">
                Expert
              </Badge>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-2 shadow-sm",
          isOwnMessage 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted",
          message.type === 'image' && "p-1"
        )}>
          {/* Text message */}
          {message.type === 'text' && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}

          {/* Image message */}
          {message.type === 'image' && message.attachment && (
            <div className="relative group">
              <img
                src={message.attachment.url}
                alt="Shared image"
                className="max-w-[300px] max-h-[400px] rounded-xl cursor-pointer"
                onClick={() => onImageClick?.(message.attachment!.url)}
              />
              {message.content !== 'Image attachment' && (
                <div className="mt-2 px-3 py-1">
                  <p className="text-sm leading-relaxed">
                    {message.content}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Voice message */}
          {message.type === 'voice' && message.attachment && (
            <div className="flex items-center gap-3 min-w-[200px]">
              <Button
                size="sm"
                variant={isOwnMessage ? "secondary" : "outline"}
                className="rounded-full w-8 h-8 p-0"
                onClick={handleVoicePlay}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-300 rounded-full">
                    <div className="h-full w-1/3 bg-current rounded-full"></div>
                  </div>
                  <span className="text-xs opacity-70">0:15</span>
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="w-6 h-6 p-0 opacity-70 hover:opacity-100"
              >
                <Download className="w-3 h-3" />
              </Button>

              <audio
                ref={audioRef}
                src={message.attachment.url}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
          )}
        </div>

        {/* Timestamp and status */}
        <div className={cn(
          "flex items-center gap-1 mt-1",
          isOwnMessage ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-xs text-muted-foreground">
            {formatDate(message.timestamp)}
          </span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;