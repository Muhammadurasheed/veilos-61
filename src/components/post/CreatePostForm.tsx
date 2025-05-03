
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PostFormData } from '@/types';
import { useVeiloData } from '@/contexts/VeiloDataContext';
import { useUserContext } from '@/contexts/UserContext';

const CreatePostForm = () => {
  const { user } = useUserContext();
  const { addPost } = useVeiloData();
  const [formData, setFormData] = useState<PostFormData>({
    content: '',
    feeling: '',
    topic: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    });
    
    setFormData({ content: '', feeling: '', topic: '' });
    setIsSubmitting(false);
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="mb-8 glass">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="What's weighing on you today? Share your thoughts in this safe space..."
              className="min-h-[100px] focus-ring"
              required
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="feeling" className="text-sm text-gray-500 mb-1 block">
                How are you feeling?
              </Label>
              <Input
                id="feeling"
                name="feeling"
                value={formData.feeling}
                onChange={handleChange}
                placeholder="e.g., Anxious, Hopeful, Confused"
                className="focus-ring"
              />
            </div>
            
            <div className="flex-1">
              <Label htmlFor="topic" className="text-sm text-gray-500 mb-1 block">
                Topic (optional)
              </Label>
              <Input
                id="topic"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="e.g., Relationships, Work, Self-care"
                className="focus-ring"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!formData.content.trim() || isSubmitting}
              className="bg-veilo-blue hover:bg-veilo-blue-dark text-white"
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
