
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { PostApi, ExpertApi } from '@/services/api';
import { useUserContext } from './UserContext';
import { Post, Expert } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface VeiloDataContextType {
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  experts: Expert[];
  setExperts: (experts: Expert[]) => void;
  loading: {
    posts: boolean;
    experts: boolean;
  };
  refreshPosts: () => Promise<void>;
  refreshExperts: () => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  createPost: (content: string, feeling?: string, topic?: string, wantsExpertHelp?: boolean) => Promise<Post | null>;
  addComment: (postId: string, content: string) => Promise<Post | null>;
  flagPost: (postId: string, reason: string) => Promise<boolean>;
}

const VeiloDataContext = createContext<VeiloDataContextType>({
  posts: [],
  setPosts: () => {},
  experts: [],
  setExperts: () => {},
  loading: {
    posts: false,
    experts: false,
  },
  refreshPosts: async () => {},
  refreshExperts: async () => {},
  likePost: async () => {},
  unlikePost: async () => {},
  createPost: async () => null,
  addComment: async () => null,
  flagPost: async () => false,
});

export const useVeiloData = () => useContext(VeiloDataContext);

export const VeiloDataProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState({
    posts: true,
    experts: true,
  });
  const { user } = useUserContext();
  const { toast } = useToast();

  // Fetch initial data
  useEffect(() => {
    if (user?.loggedIn) {
      refreshPosts();
      refreshExperts();
    }
  }, [user?.loggedIn]);

  const refreshPosts = async () => {
    setLoading(prev => ({ ...prev, posts: true }));
    try {
      const response = await PostApi.getPosts();
      if (response.success && response.data) {
        setPosts(response.data);
      } else {
        console.error('Failed to fetch posts:', response.error);
        toast({
          title: 'Error fetching posts',
          description: response.error || 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(prev => ({ ...prev, posts: false }));
    }
  };

  const refreshExperts = async () => {
    setLoading(prev => ({ ...prev, experts: true }));
    try {
      const response = await ExpertApi.getExperts();
      if (response.success && response.data) {
        setExperts(response.data);
      } else {
        console.error('Failed to fetch experts:', response.error);
      }
    } catch (error) {
      console.error('Error fetching experts:', error);
    } finally {
      setLoading(prev => ({ ...prev, experts: false }));
    }
  };

  const likePost = async (postId: string) => {
    if (!user) return;
    
    try {
      const response = await PostApi.likePost(postId);
      if (response.success && response.data) {
        // Update the post in the local state
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { ...post, likes: response.data.likes } 
              : post
          )
        );
      } else {
        toast({
          title: 'Failed to like post',
          description: response.error || 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const unlikePost = async (postId: string) => {
    if (!user) return;
    
    try {
      const response = await PostApi.unlikePost(postId);
      if (response.success && response.data) {
        // Update the post in the local state
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { ...post, likes: response.data.likes } 
              : post
          )
        );
      } else {
        toast({
          title: 'Failed to unlike post',
          description: response.error || 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error unliking post:', error);
    }
  };

  const createPost = async (
    content: string, 
    feeling?: string, 
    topic?: string,
    wantsExpertHelp: boolean = false
  ): Promise<Post | null> => {
    if (!user) return null;
    
    try {
      const response = await PostApi.createPost({
        content,
        feeling,
        topic,
        wantsExpertHelp,
      });
      
      if (response.success && response.data) {
        // Add the new post to the local state
        setPosts(prevPosts => [response.data, ...prevPosts]);
        toast({
          title: 'Post created',
          description: 'Your post has been published',
        });
        return response.data;
      } else {
        toast({
          title: 'Failed to create post',
          description: response.error || 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive',
      });
    }
    
    return null;
  };

  const addComment = async (postId: string, content: string): Promise<Post | null> => {
    if (!user) return null;
    
    try {
      const response = await PostApi.addComment(postId, content);
      if (response.success && response.data) {
        // Update the post in the local state with the new comment
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId ? response.data : post
          )
        );
        toast({
          title: 'Comment added',
          description: 'Your comment has been published',
        });
        return response.data;
      } else {
        toast({
          title: 'Failed to add comment',
          description: response.error || 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    }
    
    return null;
  };

  const flagPost = async (postId: string, reason: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await PostApi.flagPost(postId, reason);
      if (response.success) {
        // Mark post as flagged in local state but keep it visible if it's user's own post
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { ...post, flagged: true, flagReason: reason }
              : post
          )
        );
        toast({
          title: 'Post reported',
          description: 'Thank you for helping keep our community safe',
        });
        return true;
      } else {
        toast({
          title: 'Failed to report post',
          description: response.error || 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error flagging post:', error);
      toast({
        title: 'Error',
        description: 'Failed to report post',
        variant: 'destructive',
      });
    }
    
    return false;
  };

  return (
    <VeiloDataContext.Provider
      value={{
        posts,
        setPosts,
        experts,
        setExperts,
        loading,
        refreshPosts,
        refreshExperts,
        likePost,
        unlikePost,
        createPost,
        addComment,
        flagPost,
      }}
    >
      {children}
    </VeiloDataContext.Provider>
  );
};
