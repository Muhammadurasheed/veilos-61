
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreatePostForm from '@/components/post/CreatePostForm';
import PostCard from '@/components/post/PostCard';
import Layout from '@/components/layout/Layout';
import { useVeiloData } from '@/contexts/VeiloDataContext';
import { useUserContext } from '@/contexts/UserContext';
import { Post } from '@/types';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Feed = () => {
  const { posts } = useVeiloData();
  const { user } = useUserContext();
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

              <Button 
                variant="outline" 
                className="w-12 flex items-center justify-center"
                title="Change Language"
              >
                <Globe className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Featured topics */}
          <div className="mb-6 flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-veilo-blue-light text-veilo-blue-dark hover:bg-veilo-blue hover:text-white cursor-pointer">
              #MentalHealth
            </Badge>
            <Badge variant="outline" className="bg-veilo-green-light text-veilo-green-dark hover:bg-veilo-green hover:text-white cursor-pointer">
              #FamilyChallenges
            </Badge>
            <Badge variant="outline" className="bg-veilo-gold-light text-veilo-gold-dark hover:bg-veilo-gold hover:text-white cursor-pointer">
              #Relationships
            </Badge>
            <Badge variant="outline" className="bg-veilo-purple-light text-veilo-purple-dark hover:bg-veilo-purple hover:text-white cursor-pointer">
              #CareerAdvice
            </Badge>
            <Badge variant="outline" className="bg-veilo-peach-light text-veilo-peach-dark hover:bg-veilo-peach hover:text-white cursor-pointer">
              #SelfDiscovery
            </Badge>
          </div>
          
          {sortedPosts.length > 0 ? (
            <div className="space-y-6 animate-fade-in">
              {sortedPosts.map((post: Post) => (
                <PostCard key={post.id} post={post} currentUser={user} />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-white bg-opacity-50 rounded-2xl glass">
              <p className="text-gray-500">No posts found. Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Feed;
