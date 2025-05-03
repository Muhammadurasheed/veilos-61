
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PostFormData } from '@/types';
import { useVeiloData } from '@/contexts/VeiloDataContext';
import { useUserContext } from '@/contexts/UserContext';
import { Paperclip, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const FEELING_OPTIONS = [
  { value: 'anxious', label: 'Anxious' },
  { value: 'ashamed', label: 'Ashamed' },
  { value: 'confused', label: 'Confused' },
  { value: 'hopeful', label: 'Hopeful' },
  { value: 'frustrated', label: 'Frustrated' },
  { value: 'overwhelmed', label: 'Overwhelmed' },
  { value: 'lonely', label: 'Lonely' },
  { value: 'grateful', label: 'Grateful' },
];

const SUGGESTED_TOPICS = [
  '#Relationships', 
  '#MentalHealth', 
  '#Family', 
  '#Career', 
  '#SelfCare',
  '#Faith', 
  '#Identity', 
  '#Trauma'
];

const CreatePostForm = () => {
  const { user } = useUserContext();
  const { addPost } = useVeiloData();
  const [formData, setFormData] = useState<PostFormData>({
    content: '',
    feeling: '',
    topic: '',
  });
  const [isPolishing, setIsPolishing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wantsExpertHelp, setWantsExpertHelp] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Simulate suggested tags based on content
    if (name === 'content' && value.length > 10) {
      const randomTags = SUGGESTED_TOPICS
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      setSuggestedTags(randomTags);
    }
  };
  
  const handleFeelingChange = (value: string) => {
    setFormData((prev) => ({ ...prev, feeling: value }));
  };

  const handleTagSelect = (tag: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      topic: prev.topic ? `${prev.topic}, ${tag.replace('#', '')}` : tag.replace('#', '') 
    }));
  };

  const handlePolishContent = () => {
    setIsPolishing(true);
    
    // Simulate AI polishing with a timeout
    setTimeout(() => {
      const polishedContent = formData.content
        .split('.')
        .map(sentence => {
          if (!sentence.trim()) return '';
          // Add more supportive, well-structured language
          return sentence.trim().charAt(0).toUpperCase() + sentence.trim().slice(1);
        })
        .join('. ');
        
      setFormData(prev => ({
        ...prev,
        content: polishedContent.trim() + '. I appreciate any insights or support you can offer.'
      }));
      
      setIsPolishing(false);
      
      toast({
        title: "Content polished",
        description: "Your message has been refined for clarity and empathy.",
      });
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.content.trim()) return;
    
    setIsSubmitting(true);
    
    addPost({
      userId: user.id,
      userAlias: user.alias,
      userAvatarIndex: user.avatarIndex,
      content: formData.content.trim(),
      feeling: formData.feeling?.trim() || undefined,
      topic: formData.topic?.trim() || undefined,
      wantsExpertHelp: wantsExpertHelp,
    });
    
    toast({
      title: "Post shared",
      description: "Your message has been shared anonymously with the community.",
    });
    
    setFormData({ content: '', feeling: '', topic: '' });
    setWantsExpertHelp(false);
    setSuggestedTags([]);
    setIsSubmitting(false);
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="mb-8 glass animate-fade-in">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="feeling" className="text-sm font-medium text-gray-600">
              How are you feeling today?
            </Label>
            <Select value={formData.feeling} onValueChange={handleFeelingChange}>
              <SelectTrigger className="focus-ring">
                <SelectValue placeholder="Select how you're feeling..." />
              </SelectTrigger>
              <SelectContent>
                {FEELING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium text-gray-600">
              What's weighing on you?
            </Label>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Share your thoughts in this safe space. Your identity is completely anonymous..."
              className="min-h-[120px] focus-ring bg-white bg-opacity-70"
              required
            />
          </div>
          
          {suggestedTags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">
                Suggested topics:
              </Label>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className="bg-veilo-blue-light text-veilo-blue-dark hover:bg-veilo-blue hover:text-white cursor-pointer"
                    onClick={() => handleTagSelect(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4">            
            <div className="flex-1">
              <Label htmlFor="topic" className="text-sm font-medium text-gray-600 mb-1 block">
                Topics (optional, comma separated)
              </Label>
              <Input
                id="topic"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="e.g., Relationships, Faith, Identity"
                className="focus-ring"
              />
            </div>
            
            <div className="flex-1">
              <Label htmlFor="expertHelp" className="text-sm font-medium text-gray-600 mb-1 block">
                Would you like expert help?
              </Label>
              <div className="flex items-center space-x-2 mt-2">
                <Switch 
                  id="expertHelp" 
                  checked={wantsExpertHelp} 
                  onCheckedChange={setWantsExpertHelp} 
                />
                <Label htmlFor="expertHelp" className="text-sm text-gray-700">
                  {wantsExpertHelp ? 'Yes, I would like expert guidance' : 'No expert help needed now'}
                </Label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="text-gray-500"
                disabled={isSubmitting}
              >
                <Paperclip className="h-4 w-4 mr-1" />
                Attach
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-veilo-blue-dark"
                onClick={handlePolishContent}
                disabled={isPolishing || !formData.content || isSubmitting}
              >
                <Wand2 className="h-4 w-4 mr-1" />
                {isPolishing ? 'Polishing...' : 'Polish content'}
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={!formData.content.trim() || isSubmitting}
              className="bg-veilo-blue hover:bg-veilo-blue-dark text-white transition-all duration-300"
            >
              Share Anonymously
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePostForm;
