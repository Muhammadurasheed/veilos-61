
import { useState, useRef } from 'react';
import { useVeiloData } from '@/contexts/VeiloDataContext';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, ImagePlus, Sparkles, X, Video, FileImage } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import GeminiRefinement from '@/components/post/GeminiRefinement';
import { useToast } from '@/hooks/use-toast';

const topics = [
  'Mental Health',
  'Anxiety',
  'Depression',
  'Relationships',
  'Family',
  'Work',
  'Grief',
  'Trauma',
  'Addiction',
  'Identity',
  'Other'
];

const feelings = [
  'Happy',
  'Sad',
  'Anxious',
  'Angry',
  'Confused',
  'Hopeful',
  'Peaceful',
  'Overwhelmed',
  'Lonely',
  'Grateful'
];

const CreatePostForm = () => {
  const { createPost } = useVeiloData();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState('');
  const [feeling, setFeeling] = useState<string | undefined>(undefined);
  const [topic, setTopic] = useState<string | undefined>(undefined);
  const [wantsExpertHelp, setWantsExpertHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRefinement, setShowRefinement] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Function to handle file selection
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isUnder10MB = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isImage && !isVideo) {
        toast({ title: 'Invalid file type', description: 'Only images and videos are allowed', variant: 'destructive' });
        return false;
      }
      if (!isUnder10MB) {
        toast({ title: 'File too large', description: 'Files must be under 10MB', variant: 'destructive' });
        return false;
      }
      return true;
    });
    
    setAttachments(prev => [...prev, ...validFiles].slice(0, 4)); // Max 4 files
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Function to handle post creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && attachments.length === 0) {
      toast({ title: 'Content required', description: 'Please add some text or media to your post', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    await createPost(content, feeling, topic, wantsExpertHelp, attachments);
    
    // Reset form
    setContent('');
    setFeeling(undefined);
    setTopic(undefined);
    setWantsExpertHelp(false);
    setAttachments([]);
    setLoading(false);
  };

  // Function to handle opening Gemini refinement
  const handleOpenRefinement = () => {
    if (content.trim().length > 0) {
      setShowRefinement(true);
    }
  };

  // Function to handle accepting refined content
  const handleAcceptRefinement = (refinedContent: string) => {
    setContent(refinedContent);
    setShowRefinement(false);
  };

  // Function to handle canceling refinement
  const handleCancelRefinement = () => {
    setShowRefinement(false);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Card className="p-4 mb-6 bg-white/80 backdrop-blur-sm border-veilo-blue-light/20 shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start space-x-3 mb-4">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatarUrl || `/avatars/avatar-${user.avatarIndex}.svg`} alt={user.alias} />
              <AvatarFallback>
                {user.alias.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? Share anonymously..."
                className="mb-3 min-h-[100px]"
              />
              
              <div className="flex flex-wrap gap-2 justify-between">
                <div className="flex flex-wrap gap-2">
                  <Select value={feeling} onValueChange={setFeeling}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue placeholder="Feeling" />
                    </SelectTrigger>
                    <SelectContent>
                      {feelings.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={topic} onValueChange={setTopic}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue placeholder="Topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                   {/* Gemini Refinement Button */}
                   <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     className="h-9 flex gap-1 items-center"
                     onClick={handleOpenRefinement}
                     disabled={!content.trim() || loading}
                   >
                     <Sparkles className="h-4 w-4" />
                     <span className="hidden sm:inline">Refine with Gemini</span>
                     <span className="sm:hidden">Refine</span>
                   </Button>
                   
                   {/* File Upload Button */}
                   <Button
                     type="button"
                     variant="ghost"
                     size="icon"
                     className="h-9 w-9"
                     onClick={handleFileUpload}
                     disabled={loading}
                     title="Add image or video"
                   >
                     <ImagePlus className="h-4 w-4" />
                   </Button>
                   
                   {/* Hidden file input */}
                   <input
                     ref={fileInputRef}
                     type="file"
                     multiple
                     accept="image/*,video/*"
                     onChange={handleFileSelect}
                     className="hidden"
                   />
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 mr-2">
                    <Switch
                      id="expert-help"
                      checked={wantsExpertHelp}
                      onCheckedChange={setWantsExpertHelp}
                    />
                    <Label htmlFor="expert-help" className="text-xs">
                      Ask for Expert Help
                    </Label>
                  </div>
                  
                  <Button type="submit" disabled={(!content.trim() && attachments.length === 0) || loading}>
                     {loading ? (
                       <Loader2 className="h-4 w-4 animate-spin" />
                     ) : (
                       <>
                         <Send className="h-4 w-4 mr-2" />
                         Share
                       </>
                     )}
                   </Button>
                 </div>
               </div>
               
               {/* Attachment Preview */}
               {attachments.length > 0 && (
                 <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                   <div className="flex flex-wrap gap-2">
                     {attachments.map((file, index) => (
                       <div key={index} className="relative group">
                         <div className="flex items-center gap-2 p-2 bg-white rounded border">
                           {file.type.startsWith('image/') ? (
                             <FileImage className="h-4 w-4 text-blue-600" />
                           ) : (
                             <Video className="h-4 w-4 text-purple-600" />
                           )}
                           <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                           <Button
                             type="button"
                             variant="ghost"
                             size="icon"
                             className="h-5 w-5 opacity-70 group-hover:opacity-100"
                             onClick={() => removeAttachment(index)}
                           >
                             <X className="h-3 w-3" />
                           </Button>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </div>
        </form>
      </Card>
      
      {/* Gemini Refinement Modal */}
      {showRefinement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <GeminiRefinement
            originalContent={content}
            onAcceptRefinement={handleAcceptRefinement}
            onCancel={handleCancelRefinement}
          />
        </div>
      )}
    </>
  );
};

export default CreatePostForm;
