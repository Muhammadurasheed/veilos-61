
import { useState } from 'react';
import { useVeiloData } from '@/contexts/VeiloDataContext';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CommentFormProps {
  postId: string;
  userId: string;
  userAlias: string;
  userAvatarIndex: number;
}

const CommentForm = ({ postId, userId, userAlias, userAvatarIndex }: CommentFormProps) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addComment } = useVeiloData();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    
    // Pass the content as a string directly
    addComment(postId, content.trim());
    
    setContent('');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-3">
      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
        <AvatarImage src={`/avatars/avatar-${userAvatarIndex}.svg`} alt={userAlias} />
        <AvatarFallback className="bg-veilo-blue-light text-veilo-blue-dark">
          {userAlias.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts or support..."
          className="min-h-[80px] focus-ring"
        />
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!content.trim() || isSubmitting}
            className="bg-veilo-blue hover:bg-veilo-blue-dark text-white"
          >
            Respond
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
