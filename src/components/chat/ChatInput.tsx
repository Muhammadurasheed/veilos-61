import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  Send, 
  Mic, 
  MicOff, 
  Image, 
  Paperclip, 
  Smile,
  X 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  onImageUpload: (file: File) => void;
  onVoiceRecord: () => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  isRecording?: boolean;
  isUploading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onImageUpload,
  onVoiceRecord,
  onTypingStart,
  onTypingStop,
  isRecording = false,
  isUploading = false,
  disabled = false,
  placeholder = "Type your message...",
  className
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [isTyping, setIsTyping] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  // Handle typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Start typing indicator
    if (!isTyping && newValue.trim()) {
      setIsTyping(true);
      onTypingStart();
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 2 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTypingStop();
      }
    }, 2000);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value.trim() || disabled) return;
    
    onSend(value.trim());
    onChange('');
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      onTypingStop();
    }
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle image upload
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (JPEG, PNG, etc.).",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image under 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      onImageUpload(file);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("border-t bg-background p-4", className)}>
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* File upload input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Image upload button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleImageClick}
          disabled={disabled || isUploading}
          className="flex-shrink-0"
        >
          <Image className="w-5 h-5" />
        </Button>

        {/* Voice record button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onVoiceRecord}
          disabled={disabled}
          className={cn(
            "flex-shrink-0",
            isRecording && "bg-red-500 text-white hover:bg-red-600"
          )}
        >
          {isRecording ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </Button>

        {/* Text input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? "Chat is disabled" : placeholder}
            disabled={disabled}
            rows={1}
            className="resize-none min-h-[40px] max-h-[120px] pr-12"
          />
          
          {/* Character count (optional) */}
          {value.length > 800 && (
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-1 rounded">
              {value.length}/1000
            </div>
          )}
        </div>

        {/* Send button */}
        <Button
          type="submit"
          size="icon"
          disabled={!value.trim() || disabled || value.length > 1000}
          className="flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center justify-center gap-2 mt-2 text-red-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Recording voice message...</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onVoiceRecord}
            className="text-red-500 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Upload indicator */}
      {isUploading && (
        <div className="flex items-center justify-center gap-2 mt-2 text-primary">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm font-medium">Uploading image...</span>
        </div>
      )}
    </div>
  );
};

export default ChatInput;