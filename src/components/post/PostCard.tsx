
import { useState } from 'react';
import { useVeiloData } from '@/contexts/VeiloDataContext';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Flag, Send } from 'lucide-react';
import { Post, Comment } from '@/types';
import { ContentAppeal } from '@/components/post/ContentAppeal';

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const { user, isAuthenticated } = useAuth();
  const { likePost, unlikePost, addComment, flagPost } = useVeiloData();
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [showAppeal, setShowAppeal] = useState(false);

  const isLiked = post.likes.includes(user?.id || '');
  const canInteract = isAuthenticated && user;

  const handleLikeToggle = async () => {
    if (!canInteract) return;
    
    if (isLiked) {
      await unlikePost(post.id);
    } else {
      await likePost(post.id);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !canInteract) return;
    
    setLoading(true);
    await addComment(post.id, comment);
    setComment('');
    setShowCommentInput(false);
    setLoading(false);
  };

  const handleFlagPost = async () => {
    if (!flagReason.trim() || !canInteract) return;
    
    const success = await flagPost(post.id, flagReason);
    if (success) {
      setFlagDialogOpen(false);
      setFlagReason('');
    }
  };

  return (
    <Card className="mb-4 overflow-hidden bg-white/80 backdrop-blur-sm border-veilo-blue-light/20 shadow-sm">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage 
                src={`/avatars/avatar-${post.userAvatarIndex}.svg`} 
                alt={post.userAlias} 
              />
              <AvatarFallback>
                {post.userAlias.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{post.userAlias}</p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-1">
            {post.feeling && (
              <Badge variant="outline" className="bg-veilo-blue-light/10">
                {post.feeling}
              </Badge>
            )}
            {post.topic && (
              <Badge variant="outline" className="bg-veilo-purple-light/10">
                {post.topic}
              </Badge>
            )}
            {post.wantsExpertHelp && (
              <Badge variant="outline" className="bg-veilo-purple/10 text-veilo-purple-dark">
                Seeking Help
              </Badge>
            )}
            {post.status === 'flagged' && (
              <Badge variant="destructive" className="text-xs">
                Content Under Review
              </Badge>
            )}
          </div>
        </div>
        
        {/* Show flagged post message and appeal option */}
        {post.status === 'flagged' && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 mb-2">
              This post has been flagged for review and is currently hidden from other users.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAppeal(true)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Appeal This Decision
            </Button>
          </div>
        )}
        
        <p className="my-2 whitespace-pre-wrap">{post.content}</p>
        
        <div className="flex items-center justify-between mt-4 border-t pt-3 text-sm text-gray-600">
          <div className="flex items-center">
            <button 
              onClick={handleLikeToggle}
              disabled={!canInteract}
              className={`flex items-center mr-4 ${isLiked ? 'text-red-500' : 'text-gray-500'} ${!canInteract ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-red-500' : ''}`} />
              {post.likes.length > 0 && <span>{post.likes.length}</span>}
            </button>
            
            <button 
              onClick={() => canInteract && setShowCommentInput(!showCommentInput)}
              disabled={!canInteract}
              className={`flex items-center text-gray-500 ${!canInteract ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              {post.comments.length > 0 && <span>{post.comments.length}</span>}
            </button>
          </div>
          
          <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
            <DialogTrigger asChild>
              <button className="text-gray-500">
                <Flag className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Post</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-500 mb-4">
                  Please tell us why you're reporting this post.
                  This will help our moderators review it.
                </p>
                <Textarea
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="Why are you reporting this post?"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleFlagPost}>
                  Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
      
      {showCommentInput && (
        <CardFooter className="border-t pt-3 pb-3">
          <form onSubmit={handleSubmitComment} className="w-full">
            <div className="flex items-start space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={`/avatars/avatar-${user?.avatarIndex || 1}.svg`} 
                  alt={user?.alias || 'User'} 
                />
                <AvatarFallback>
                  {user?.alias?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a response..."
                  className="mb-2 min-h-[60px]"
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!comment.trim() || loading}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardFooter>
      )}
      
      {post.comments.length > 0 && (
        <div className="border-t bg-gray-50/50">
          {post.comments.map((comment: Comment) => (
            <div key={comment.id} className="p-3 border-b last:border-0">
              <div className="flex items-start space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage 
                    src={`/avatars/avatar-${comment.userAvatarIndex}.svg`} 
                    alt={comment.userAlias} 
                  />
                  <AvatarFallback>
                    {comment.userAlias.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center">
                    <p className="text-xs font-medium">{comment.userAlias}</p>
                    {comment.isExpert && (
                      <Badge variant="outline" className="ml-1 h-4 text-[10px] bg-blue-500/10 text-blue-700">
                        Expert
                      </Badge>
                    )}
                    <p className="text-[10px] text-gray-500 ml-1">
                      {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Content Appeal Dialog */}
      {showAppeal && (
        <ContentAppeal 
          postId={post.id}
          postContent={post.content}
          flagReason={post.flagReason || 'Content flagged for review'}
          onSubmit={() => {
            setShowAppeal(false);
            // Optionally refresh post data
          }}
        />
      )}
    </Card>
  );
};

export default PostCard;
