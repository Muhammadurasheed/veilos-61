
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreatePostForm from '@/components/post/CreatePostForm';
import PostCard from '@/components/post/PostCard';
import Layout from '@/components/layout/Layout';
import { SmartRecommendations } from '@/components/recommendations/SmartRecommendations';
import { useVeiloData } from '@/contexts/VeiloDataContext';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';
import { Post } from '@/types';
import { Button } from '@/components/ui/button';
import { Globe, Loader2 } from 'lucide-react';

const Feed = () => {
  const { posts, loading, refreshPosts } = useVeiloData();
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [filterBy, setFilterBy] = useState('all');
  const [language, setLanguage] = useState('en');
  
  // Filter posts based on search term and filter option
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = 
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.topic?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (post.feeling?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterBy === 'all') return matchesSearch;
    if (filterBy === 'withResponses') return matchesSearch && post.comments.length > 0;
    if (filterBy === 'noResponses') return matchesSearch && post.comments.length === 0;
    
    return matchesSearch;
  });
  
  // Sort posts based on sort option
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
    if (sortBy === 'mostLiked') {
      return b.likes.length - a.likes.length;
    }
    if (sortBy === 'mostComments') {
      return b.comments.length - a.comments.length;
    }
    return 0;
  });
  
  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-veilo-blue-dark">Community Sanctuary</h1>
        
        <div className="max-w-3xl mx-auto">
          <CreatePostForm />
          
          {/* Smart Recommendations Section */}
          {isAuthenticated && (
            <div className="mb-8">
              <SmartRecommendations userId={user?.id || ''} />
            </div>
          )}
          
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="focus-ring"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Posts</SelectItem>
                  <SelectItem value="withResponses">With Responses</SelectItem>
                  <SelectItem value="noResponses">No Responses</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="mostLiked">Most Liked</SelectItem>
                  <SelectItem value="mostComments">Most Comments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {loading.posts ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-veilo-blue" />
            </div>
          ) : sortedPosts.length > 0 ? (
            <div>
              {sortedPosts.map((post: Post) => (
                <PostCard key={post.id} post={post} />
              ))}
              
              {sortedPosts.length > 5 && (
                <div className="flex justify-center mt-6">
                  <Button variant="outline">
                    Load More
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-white bg-opacity-50">
              <Globe className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No posts found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search or filters' 
                  : 'Be the first to share something'}
              </p>
              {!isAuthenticated && (
                <Button 
                  className="mt-4"
                  onClick={() => window.location.href = '/auth'}
                >
                  Sign in to Post
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Feed;
