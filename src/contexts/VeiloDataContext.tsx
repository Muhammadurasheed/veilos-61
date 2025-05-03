
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Post, Expert, Comment } from '@/types';
import { samplePosts, sampleExperts } from '@/lib/sampleData';

interface VeiloDataContextType {
  posts: Post[];
  experts: Expert[];
  addPost: (post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments'>) => void;
  addComment: (postId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  likePost: (postId: string, userId: string) => void;
  unlikePost: (postId: string, userId: string) => void;
}

const VeiloDataContext = createContext<VeiloDataContextType>({
  posts: [],
  experts: [],
  addPost: () => {},
  addComment: () => {},
  likePost: () => {},
  unlikePost: () => {},
});

export const useVeiloData = () => useContext(VeiloDataContext);

export const VeiloDataProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<Post[]>(() => {
    const savedPosts = localStorage.getItem('veilo-posts');
    return savedPosts ? JSON.parse(savedPosts) : samplePosts;
  });
  
  const [experts] = useState<Expert[]>(sampleExperts);

  useEffect(() => {
    localStorage.setItem('veilo-posts', JSON.stringify(posts));
  }, [posts]);

  const addPost = (postData: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments'>) => {
    const newPost: Post = {
      id: crypto.randomUUID(),
      ...postData,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
    };
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const addComment = (postId: string, commentData: Omit<Comment, 'id' | 'timestamp'>) => {
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        const newComment = {
          id: crypto.randomUUID(),
          ...commentData,
          timestamp: new Date().toISOString(),
        };
        return {
          ...post,
          comments: [...post.comments, newComment],
        };
      }
      return post;
    }));
  };

  const likePost = (postId: string, userId: string) => {
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId && !post.likes.includes(userId)) {
        return {
          ...post,
          likes: [...post.likes, userId],
        };
      }
      return post;
    }));
  };

  const unlikePost = (postId: string, userId: string) => {
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.likes.filter(id => id !== userId),
        };
      }
      return post;
    }));
  };

  return (
    <VeiloDataContext.Provider value={{ 
      posts, 
      experts, 
      addPost, 
      addComment, 
      likePost, 
      unlikePost 
    }}>
      {children}
    </VeiloDataContext.Provider>
  );
};
