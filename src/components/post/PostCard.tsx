
import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Post as PostType, User } from '@/types';
import { formatDate } from '@/lib/alias';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import { useVeiloData } from '@/contexts/VeiloDataContext';

interface PostCardProps {
  post: PostType;
  currentUser: User | null;
}

const PostCard = ({ post, currentUser }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const { likePost, unlikePost } = useVeiloData();
  
  const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;
  
  const handleLikeToggle = () => {
    if (!currentUser) return;
    
    if (isLiked) {
      unlikePost(post.id, currentUser.id);
    } else {
      likePost(post.id, currentUser.id);
    }
  };
  
  return (
    <Card className="mb-6 overflow-hidden animate-scale-in card-hover glass">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-veilo-blue-light">
              <AvatarImage src={`/avatars/avatar-${post.userAvatarIndex}.svg`} alt={post.userAlias} />
              <AvatarFallback className="bg-veilo-blue-light text-veilo-blue-dark">
                {post.userAlias.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-veilo-blue-dark">{post.userAlias}</p>
              <p className="text-sm text-gray-500">{formatDate(post.timestamp)}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {post.feeling && (
              <Badge variant="secondary" className="bg-veilo-purple-light text-veilo-purple-dark">
                {post.feeling}
              </Badge>
            )}
            {post.topic && (
              <Badge variant="outline" className="border-veilo-blue text-veilo-blue-dark">
                {post.topic}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
      </CardContent>
      
      <CardFooter className="border-t pt-3 flex flex-col items-stretch">
        <div className="flex justify-between items-center mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`group ${isLiked ? 'text-veilo-blue' : 'text-gray-500'}`}
            onClick={handleLikeToggle}
            disabled={!currentUser}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill={isLiked ? "currentColor" : "none"}
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-1"
            >
              <path d="M7 10v12" />
              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
            </svg>
            <span className="group-hover:text-veilo-blue transition-colors">
              {post.likes.length > 0 ? `${post.likes.length} ${post.likes.length === 1 ? 'person' : 'people'} felt this` : 'I feel this'}
            </span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500 hover:text-veilo-blue-dark"
            onClick={() => setShowComments(!showComments)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-1"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {post.comments.length > 0 ? `${post.comments.length} ${post.comments.length === 1 ? 'response' : 'responses'}` : 'Respond'}
          </Button>
        </div>
        
        {showComments && (
          <div className="mt-3 w-full">
            <CommentList comments={post.comments} />
            
            {currentUser && (
              <div className="mt-4">
                <CommentForm 
                  postId={post.id}
                  userId={currentUser.id}
                  userAlias={currentUser.alias}
                  userAvatarIndex={currentUser.avatarIndex}
                />
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default PostCard;
