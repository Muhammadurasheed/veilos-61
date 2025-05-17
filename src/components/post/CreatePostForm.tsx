
import { useState } from 'react';
import { useVeiloData } from '@/contexts/VeiloDataContext';
import { useUserContext } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, ImagePlus, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import GeminiRefinement from '@/components/post/GeminiRefinement';

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
  const { user } = useUserContext();
  const [content, setContent] = useState('');
  const [feeling, setFeeling] = useState<string | undefined>(undefined);
  const [topic, setTopic] = useState<string | undefined>(undefined);
  const [wantsExpertHelp, setWantsExpertHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRefinement, setShowRefinement] = useState(false);

  // Function to handle post creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    setLoading(true);
    await createPost(content, feeling, topic, wantsExpertHelp);
    
    // Reset form
    setContent('');
    setFeeling(undefined);
    setTopic(undefined);
    setWantsExpertHelp(false);
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

  if (!user) {
    return null;
  }

  return (
    <>
      <Card className="p-4 mb-6 bg-white/80 backdrop-blur-sm border-veilo-blue-light/20 shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start space-x-3 mb-4">
            <Avatar className="h-9 w-9">
              <AvatarImage src={`/avatars/avatar-${user.avatarIndex}.svg`} alt={user.alias} />
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
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    disabled={loading}
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
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
                  
                  <Button type="submit" disabled={!content.trim() || loading}>
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
