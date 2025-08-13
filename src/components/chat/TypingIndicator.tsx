import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface TypingUser {
  userId: string;
  userAlias: string;
  avatarUrl?: string;
  avatarIndex?: number;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  typingUsers, 
  className 
}) => {
  if (typingUsers.length === 0) return null;

  const getAvatarSrc = (user: TypingUser) => {
    if (user.avatarUrl) return user.avatarUrl;
    if (user.avatarIndex) return `/avatars/avatar-${user.avatarIndex}.svg`;
    return undefined;
  };

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userAlias} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userAlias} and ${typingUsers[1].userAlias} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  };

  return (
    <div className={cn("flex items-center gap-3 mb-4", className)}>
      {/* Show avatar only for single user */}
      {typingUsers.length === 1 && (
        <Avatar className="w-8 h-8">
          <AvatarImage 
            src={getAvatarSrc(typingUsers[0])} 
            alt={typingUsers[0].userAlias} 
          />
          <AvatarFallback className="text-xs">
            {typingUsers[0].userAlias.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Typing indicator bubble */}
      <div className="bg-muted rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {getTypingText()}
          </span>
          
          {/* Animated dots */}
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" 
                 style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" 
                 style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" 
                 style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;