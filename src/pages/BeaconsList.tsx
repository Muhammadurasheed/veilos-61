
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ExpertCard from '@/components/expert/ExpertCard';
import Layout from '@/components/layout/Layout';
import { useVeiloData } from '@/contexts/VeiloDataContext';
import { Expert } from '@/types';

const BeaconsList = () => {
  const { experts } = useVeiloData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [filterBy, setFilterBy] = useState('all');
  
  // Filter experts based on search term and filter option
  const filteredExperts = experts.filter((expert) => {
    const matchesSearch = 
      expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expert.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expert.topicsHelped.some(topic => 
        topic.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    if (filterBy === 'all') return matchesSearch;
    if (filterBy === 'blue') return matchesSearch && expert.verificationLevel === 'blue';
    if (filterBy === 'gold') return matchesSearch && expert.verificationLevel === 'gold';
    if (filterBy === 'platinum') return matchesSearch && expert.verificationLevel === 'platinum';
    
    return matchesSearch;
  });
  
  // Sort experts based on sort option
  const sortedExperts = [...filteredExperts].sort((a, b) => {
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    if (sortBy === 'testimonials') {
      return b.testimonials.length - a.testimonials.length;
    }
    if (sortBy === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });
  
  return (
    <Layout>
      <div className="container py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3 text-veilo-blue-dark">Verified Beacons</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Connect with compassionate experts who can provide guidance and support on your healing journey. 
            All Beacons are verified professionals with proven expertise.
          </p>
        </div>
        
        <div className="mb-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, specialization, or topic..."
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
                <SelectItem value="all">All Verification</SelectItem>
                <SelectItem value="blue">Blue Verified</SelectItem>
                <SelectItem value="gold">Gold Verified</SelectItem>
                <SelectItem value="platinum">Platinum Verified</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rating</SelectItem>
                <SelectItem value="testimonials">Most Testimonials</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {sortedExperts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedExperts.map((expert: Expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-white bg-opacity-50 rounded-lg">
            <p className="text-gray-500">No experts found. Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BeaconsList;
