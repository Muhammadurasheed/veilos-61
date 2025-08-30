
import React, { useState, useEffect, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ExpertCard from '@/components/expert/ExpertCard';
import { ExpertMatcher } from '@/components/recommendations/ExpertMatcher';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';
import { aiRecommendationEngine } from '@/services/aiRecommendationEngine';
import { useToast } from '@/hooks/use-toast';
import { Expert, User } from '@/types';
import { ExpertApi } from '@/services/api';
import { 
  Users, 
  Search, 
  Filter, 
  Sparkles, 
  Star, 
  MapPin, 
  Clock,
  Zap,
  Brain,
  Award
} from 'lucide-react';

const EnhancedBeaconsList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [expertsLoading, setExpertsLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('ai_recommended');
  const [filterBy, setFilterBy] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [userMood, setUserMood] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [userProfile, setUserProfile] = useState<Partial<User> | null>(null);

  // Load experts from backend (approved beacons)
  const loadExperts = async () => {
    setExpertsLoading(true);
    try {
      const res = await ExpertApi.getExperts();
      if (res.success && res.data) {
        setExperts(res.data as Expert[]);
      } else {
        toast({ title: 'Failed to load experts', description: res.error || 'Unexpected error', variant: 'destructive' });
      }
    } catch (e: any) {
      console.error('Failed to load experts:', e);
      toast({ title: 'Failed to load experts', description: e.message || 'Unexpected error', variant: 'destructive' });
    } finally {
      setExpertsLoading(false);
    }
  };

// Load user profile and AI recommendations on mount
useEffect(() => {
  loadExperts();
  loadAIRecommendations();
  loadUserProfile();
}, []);

  const loadUserProfile = async () => {
    try {
      // In production, this would fetch from user context
      const mockUser = {
        id: 'user-123',
        interests: ['anxiety', 'stress management', 'mindfulness'],
        recentSessions: ['therapy', 'meditation'],
        preferredLanguages: ['English']
      };
      setUserProfile(mockUser);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadAIRecommendations = async () => {
    setIsLoadingRecommendations(true);
    try {
      const recommendations = await aiRecommendationEngine.getPersonalizedRecommendations('user-123');
      setAiRecommendations(recommendations.experts || []);
    } catch (error) {
      console.error('Failed to load AI recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Enhanced filtering logic with AI recommendations
  const getFilteredAndSortedExperts = () => {
    let filtered = experts.filter((expert) => {
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
      if (filterBy === 'available') return matchesSearch; // Mock availability check
      if (filterBy === 'new') {
        // Mock "new" experts logic
        return matchesSearch && expert.testimonials.length < 10;
      }
      
      return matchesSearch;
    });

    // Enhanced sorting with AI recommendations
    return [...filtered].sort((a, b) => {
      if (sortBy === 'ai_recommended') {
        const aScore = aiRecommendations.find(r => r.expertId === a.id)?.score || 0;
        const bScore = aiRecommendations.find(r => r.expertId === b.id)?.score || 0;
        return bScore - aScore;
      }
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'testimonials') return b.testimonials.length - a.testimonials.length;
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      if (sortBy === 'recent') {
        // Mock recent activity sorting
        return Math.random() - 0.5;
      }
      return 0;
    });
  };

  const sortedExperts = getFilteredAndSortedExperts();

  const handleExpertSelect = (expertId: string) => {
    // Track interaction for AI learning
    aiRecommendationEngine.trackUserInteraction('user-123', {
      type: 'expert_view',
      targetId: expertId,
      timestamp: new Date()
    });
    
    toast({
      title: "Starting conversation",
      description: "Connecting you with the expert...",
    });
  };

  const handleScheduleSession = (expertId: string) => {
    aiRecommendationEngine.trackUserInteraction('user-123', {
      type: 'session_book',
      targetId: expertId,
      timestamp: new Date()
    });
    
    toast({
      title: "Scheduling session",
      description: "Opening booking calendar...",
    });
  };
  return (
    <>
      <Helmet>
        <title>Find Verified Mental Health Experts | Veilo Beacons</title>
        <meta name="description" content="Connect with compassionate, verified mental health professionals. AI-powered matching helps you find the perfect expert for anxiety, depression, stress management, and more." />
        <meta name="keywords" content="mental health experts, verified therapists, anxiety support, depression help, stress management, online therapy, AI matching" />
        <meta property="og:title" content="Find Your Perfect Mental Health Expert | Veilo" />
        <meta property="og:description" content="Connect with verified mental health professionals through AI-powered matching." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${window.location.origin}/beacons`} />
      </Helmet>
      
      <Layout>
        <ErrorBoundary>
          <div className="container py-8 max-w-7xl mx-auto">
            {/* Enhanced Header Section */}
            <div className="text-center mb-10">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Verified Beacons
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Connect with compassionate experts who can provide guidance and support on your healing journey. 
                AI-powered matching ensures you find the perfect expert for your needs.
              </p>
              
              {/* Quick Stats */}
              <div className="flex justify-center gap-8 mt-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4 text-purple-600" />
                  <span>{experts.length} Verified Experts</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>4.8+ Avg Rating</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>Available 24/7</span>
                </div>
              </div>
            </div>

            {/* Smart Discovery Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
                <TabsTrigger value="browse" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Browse All
                </TabsTrigger>
                <TabsTrigger value="discover" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Match
                </TabsTrigger>
                <TabsTrigger value="featured" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Featured
                </TabsTrigger>
              </TabsList>

              {/* AI-Powered Expert Matching Tab */}
              <TabsContent value="discover" className="space-y-6">
                <div className="max-w-4xl mx-auto">
                  <Suspense fallback={<div className="text-center py-8">Loading AI recommendations...</div>}>
                    <ExpertMatcher
                      feeling={userMood}
                      urgency={urgencyLevel}
                      onExpertSelect={handleExpertSelect}
                      onScheduleSession={handleScheduleSession}
                    />
                  </Suspense>
                </div>

                {/* Personalized Recommendations */}
                {aiRecommendations.length > 0 && (
                  <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-2 mb-6">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <h2 className="text-xl font-semibold">Recommended For You</h2>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        AI Powered
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sortedExperts.slice(0, 6).map((expert: Expert) => {
                        const recommendation = aiRecommendations.find(r => r.expertId === expert.id);
                        return (
                          <div key={expert.id} className="relative">
                            {recommendation && (
                              <div className="absolute -top-2 -right-2 z-10">
                                <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                                  {Math.round(recommendation.score * 100)}% match
                                </Badge>
                              </div>
                            )}
                            <ExpertCard expert={expert} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Browse All Experts Tab */}
              <TabsContent value="browse" className="space-y-6">
                {/* Enhanced Search and Filters */}
                <div className="max-w-4xl mx-auto">
                  <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by name, specialization, or topic..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 focus-ring"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Select value={filterBy} onValueChange={setFilterBy}>
                        <SelectTrigger className="w-[200px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filter by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Verification</SelectItem>
                          <SelectItem value="platinum">🏆 Platinum</SelectItem>
                          <SelectItem value="gold">🥇 Gold</SelectItem>
                          <SelectItem value="blue">🔵 Blue</SelectItem>
                          <SelectItem value="available">✅ Available Now</SelectItem>
                          <SelectItem value="new">🆕 New Experts</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ai_recommended">🧠 AI Recommended</SelectItem>
                          <SelectItem value="rating">⭐ Highest Rating</SelectItem>
                          <SelectItem value="testimonials">💬 Most Reviews</SelectItem>
                          <SelectItem value="alphabetical">🔤 Alphabetical</SelectItem>
                          <SelectItem value="recent">🕒 Recently Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Results Summary */}
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-600">
                      Showing {sortedExperts.length} of {experts.length} experts
                      {searchTerm && <span className="text-purple-600 font-medium"> for "{searchTerm}"</span>}
                    </p>
                    
                    {sortBy === 'ai_recommended' && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Sorted
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Expert Grid */}
                {sortedExperts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {sortedExperts.map((expert: Expert) => (
                      <ExpertCard key={expert.id} expert={expert} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl max-w-2xl mx-auto">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No experts found</h3>
                    <p className="text-gray-500 mb-4">
                      Try adjusting your search terms or filters to find the perfect expert for you.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('');
                        setFilterBy('all');
                        setSortBy('ai_recommended');
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Featured Experts Tab */}
              <TabsContent value="featured" className="space-y-6">
                <div className="max-w-6xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2">Featured Experts</h2>
                    <p className="text-gray-600">
                      Top-rated professionals with exceptional expertise and user satisfaction
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {experts
                      .filter(expert => expert.rating >= 4.7 && expert.testimonials.length >= 15)
                      .slice(0, 9)
                      .map((expert: Expert) => (
                        <div key={expert.id} className="relative">
                          <div className="absolute -top-2 -left-2 z-10">
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                              ⭐ Featured
                            </Badge>
                          </div>
                          <ExpertCard expert={expert} />
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Quick Actions Footer */}
            <div className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 text-center max-w-4xl mx-auto">
              <h3 className="text-xl font-semibold mb-2">Need Immediate Support?</h3>
              <p className="text-gray-600 mb-4">
                Our crisis support team is available 24/7 for urgent mental health needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                  🚨 Crisis Support
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  📞 Schedule Emergency Call
                </Button>
              </div>
            </div>
          </div>
        </ErrorBoundary>
      </Layout>
    </>
  );
};

export default EnhancedBeaconsList;
