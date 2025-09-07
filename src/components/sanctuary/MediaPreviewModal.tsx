import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Image, FileText, Film } from 'lucide-react';

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onSend: (file: File, caption?: string) => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  onSend
}) => {
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string>('');

  React.useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, [file]);

  const handleSend = () => {
    if (file) {
      onSend(file, caption.trim() || undefined);
      setCaption('');
      onClose();
    }
  };

  const getFileIcon = () => {
    if (!file) return <FileText className="h-16 w-16 text-muted-foreground" />;
    
    if (file.type.startsWith('image/')) {
      return <Image className="h-16 w-16 text-blue-500" />;
    } else if (file.type.startsWith('video/')) {
      return <Film className="h-16 w-16 text-purple-500" />;
    } else {
      return <FileText className="h-16 w-16 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Share Media</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Media Preview */}
          <div className="bg-muted rounded-lg p-4 flex flex-col items-center">
            {file.type.startsWith('image/') ? (
              <img 
                src={preview} 
                alt={file.name}
                className="max-w-full max-h-48 object-contain rounded"
              />
            ) : file.type.startsWith('video/') ? (
              <video 
                src={preview} 
                controls
                className="max-w-full max-h-48 rounded"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex flex-col items-center p-8">
                {getFileIcon()}
                <div className="mt-2 text-center">
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Caption Input */}
          <div>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="w-full"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {caption.length}/500
            </div>
          </div>

          {/* File Info */}
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>File type: {file.type || 'Unknown'}</span>
              <span>Size: {formatFileSize(file.size)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} className="ml-2">
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};