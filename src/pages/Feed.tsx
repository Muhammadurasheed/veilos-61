
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreatePostForm from '@/components/post/CreatePostForm';
import PostCard from '@/components/post/PostCard';
import Layout from '@/components/layout/Layout';
import { useVeiloData } from '@/contexts/VeiloDataContext';
import { useUserContext } from '@/contexts/UserContext';
import { Post } from '@/types';

const Feed = () => {
  const { posts } = useVeiloData();
  const { user } = useUserContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [filterBy, setFilterBy] = useState('all');
  
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
        <h1 className="text-3xl font-bold mb-8 text-center text-veilo-blue-dark">Community Feed</h1>
        
        <div className="max-w-3xl mx-auto">
          <CreatePostForm />
          
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
                  <SelectItem value="latest">Latest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="mostLiked">Most Felt</SelectItem>
                  <SelectItem value="mostComments">Most Responses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {sortedPosts.length > 0 ? (
            <div>
              {sortedPosts.map((post: Post) => (
                <PostCard key={post.id} post={post} currentUser={user} />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-white bg-opacity-50 rounded-lg">
              <p className="text-gray-500">No posts found. Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Feed;
