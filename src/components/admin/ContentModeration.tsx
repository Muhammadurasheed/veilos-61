import { useState } from 'react';
import { Post } from '@/types';
import { AdminApi, PostApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/alias';
import { Flag, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const ContentModeration = () => {
  const { toast } = useToast();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Sample flagged posts for demo
  const [flaggedPosts, setFlaggedPosts] = useState<Post[]>([
    {
      id: '1',
      userId: 'user1',
      userAlias: 'AnonymousShadow42',
      userAvatarIndex: 3,
      content: 'I\'ve been feeling really down lately. Sometimes I wonder if life is worth living anymore...',
      feeling: 'depressed',
      topic: 'MentalHealth',
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
      flagged: true,
      flagReason: 'potential_self_harm',
      wantsExpertHelp: true,
      languageCode: 'en'
    },
    {
      id: '2',
      userId: 'user2',
      userAlias: 'SilentWatcher87',
      userAvatarIndex: 2,
      content: 'My partner has been abusive lately and I don\'t know what to do. I\'m scared to leave but also scared to stay.',
      feeling: 'anxious',
      topic: 'Relationships,Abuse',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      likes: ['user3'],
      comments: [],
      flagged: true,
      flagReason: 'abuse_report',
      wantsExpertHelp: true,
      languageCode: 'en'
    },
    {
      id: '3',
      userId: 'user4',
      userAlias: 'LostSoul23',
      userAvatarIndex: 5,
      content: 'I hate everyone in my family. They\'ve all betrayed me and I\'m starting to think about getting revenge.',
      feeling: 'angry',
      topic: 'Family,Conflict',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      likes: [],
      comments: [],
      flagged: true,
      flagReason: 'harmful_content',
      wantsExpertHelp: false,
      languageCode: 'en'
    },
  ]);
  
  // In a real app, this would be a React Query hook
  /*
  const {
    data: flaggedPosts,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['flaggedContent'],
    queryFn: () => AdminApi.getFlaggedContent().then(res => res.data?.posts || []),
  });
  */
  
  const handleReviewPost = (post: Post) => {
    setSelectedPost(post);
    setIsDialogOpen(true);
  };

  const handleModerationAction = async (action: 'approve' | 'remove') => {
    if (!selectedPost) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, this would call the API
      /*
      const response = await AdminApi.resolveFlag(selectedPost.id, action);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to moderate content');
      }
      */
      
      // Update local state for demo
      setFlaggedPosts(prev => prev.filter(post => post.id !== selectedPost.id));
      
      toast({
        title: `Content ${action === 'approve' ? 'approved' : 'removed'}`,
        description: action === 'approve' 
          ? 'The content has been marked as safe.'
          : 'The content has been removed from the platform.',
        variant: action === 'approve' ? 'default' : 'destructive',
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Action failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
          <div>
            <h3 className="font-medium text-amber-800">Content Moderation Guidelines</h3>
            <p className="text-sm text-amber-700 mt-1">
              Review flagged content carefully and take appropriate action. Priority should be given to content that may indicate self-harm, abuse, or harmful intentions.
            </p>
          </div>
        </div>
      </div>
      
      {flaggedPosts?.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-gray-500">No flagged content to review</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {flaggedPosts?.map((post) => (
            <Card key={post.id} className="overflow-hidden border-l-4 border-l-red-400">
              <CardHeader className="pb-3">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-2">
                      <AvatarImage
                        src={`/avatars/avatar-${post.userAvatarIndex}.svg`}
                        alt={post.userAlias}
                      />
                      <AvatarFallback>
                        {post.userAlias.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{post.userAlias}</CardTitle>
                      <p className="text-sm text-gray-500">{formatDate(post.timestamp)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-red-100 text-red-800 flex items-center">
                    <Flag className="h-3 w-3 mr-1" />
                    {post.flagReason?.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-gray-700">{post.content}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.feeling && (
                    <Badge variant="secondary" className="bg-veilo-purple-light text-veilo-purple-dark">
                      {post.feeling}
                    </Badge>
                  )}
                  {post.topic && post.topic.split(',').map((topic, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-veilo-blue text-veilo-blue-dark"
                    >
                      #{topic.trim()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex w-full justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleReviewPost(post)}
                    className="border-veilo-blue text-veilo-blue hover:bg-veilo-blue-light"
                  >
                    Review Content
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Post Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Flagged Content</DialogTitle>
            <DialogDescription>
              This content was flagged for review. Please determine if it violates platform policies.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {selectedPost && (
              <>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center mb-3">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage
                        src={`/avatars/avatar-${selectedPost.userAvatarIndex}.svg`}
                        alt={selectedPost.userAlias}
                      />
                      <AvatarFallback>
                        {selectedPost.userAlias.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedPost.userAlias}</p>
                      <p className="text-xs text-gray-500">{formatDate(selectedPost.timestamp)}</p>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-gray-700">{selectedPost.content}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Flag Reason:</h4>
                  <p className="text-red-600 flex items-center">
                    <Flag className="h-4 w-4 mr-1" />
                    {selectedPost.flagReason?.replace('_', ' ')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Moderation Guidelines:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                    <li>Remove content that violates our community guidelines</li>
                    <li>Approve content that is within acceptable boundaries</li>
                    <li>Consider reaching out to users who may be in danger</li>
                  </ul>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => handleModerationAction('remove')}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
              Remove Content
            </Button>
            <Button
              className="bg-veilo-green hover:bg-veilo-green-dark"
              onClick={() => handleModerationAction('approve')}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Approve Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentModeration;
