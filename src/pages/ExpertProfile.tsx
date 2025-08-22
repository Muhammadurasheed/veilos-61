
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import Layout from '@/components/layout/Layout';
import { useVeiloData } from '@/contexts/VeiloDataContext';
import { useExpertFollow } from '@/hooks/useExpertFollow';
import { apiRequest } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Expert } from '@/types';
import { 
  Heart, 
  Calendar, 
  MessageCircle, 
  Star, 
  MapPin, 
  Clock, 
  Award, 
  BookOpen, 
  Users, 
  ChevronLeft,
  Share2,
  Flag
} from 'lucide-react';

const ExpertProfile = () => {
  const { expertId } = useParams<{ expertId: string }>();
  const navigate = useNavigate();
  const { experts, refreshExperts } = useVeiloData();
  const { toast } = useToast();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [followState, setFollowState] = useState({ isFollowing: false, isLoading: false });
  const [activeTab, setActiveTab] = useState('about');

  // Load expert data and follow status
  useEffect(() => {
    const loadExpertData = async () => {
      console.log(`🚀 ExpertProfile component mounted`);
      console.log(`📍 Route params:`, { expertId });
      console.log(`🌍 Current location:`, window.location);
      
      if (!expertId) {
        console.error('❌ No expertId provided in route params');
        setIsLoading(false);
        return;
      }
      
      console.log(`🔍 Loading expert data for ID: ${expertId}`);
      console.log(`🌐 Current window location: ${window.location.href}`);
      setIsLoading(true);
      
      try {
        // Always fetch from API to get latest data
        console.log(`📡 Making API call to: /api/experts/${expertId}`);
        const response = await apiRequest('GET', `/api/experts/${expertId}`);
        console.log('📊 Expert API response:', response);
        
        if (response.success && response.data) {
          console.log('✅ Expert loaded successfully:', response.data);
          setExpert(response.data);
          
          // Load follow status
          try {
            const followResponse = await apiRequest('GET', `/api/experts/${expertId}/following-status`);
            if (followResponse.success && followResponse.data) {
              setFollowState(prev => ({
                ...prev,
                isFollowing: followResponse.data.isFollowing
              }));
            }
          } catch (followError) {
            console.error('Error loading follow status:', followError);
          }
        } else {
          console.error('❌ Expert not found in API response:', response);
          console.error('❌ Response error:', response?.error);
          setExpert(null);
        }
      } catch (error) {
        console.error('💥 Error loading expert:', error);
        console.error('💥 Error details:', error.response?.data || error.message);
        setExpert(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadExpertData();
  }, [expertId]);

  // Handle follow functionality
  const handleToggleFollow = async () => {
    if (!expert) return;
    
    setFollowState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const endpoint = followState.isFollowing 
        ? `/api/experts/${expert.id}/unfollow` 
        : `/api/experts/${expert.id}/follow`;
      
      const response = await apiRequest('POST', endpoint);
      
      if (response.success) {
        setFollowState(prev => ({
          isFollowing: !prev.isFollowing,
          isLoading: false,
        }));
        
        toast({
          title: followState.isFollowing ? 'Unfollowed Expert' : 'Following Expert',
          description: followState.isFollowing 
            ? 'You will no longer receive updates from this expert' 
            : 'You will now receive updates when this expert posts or schedules sessions',
        });
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      setFollowState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update follow status. Please try again.',
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading expert profile...</p>
        </div>
      </Layout>
    );
  }
  
  if (!expert) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Expert not found</h1>
          <p className="mb-8">The expert you're looking for doesn't exist or has been removed.</p>
          <Link to="/beacons">
            <Button>Back to Beacons</Button>
          </Link>
        </div>
      </Layout>
    );
  }
  
  const getVerificationBadge = () => {
    switch (expert.verificationLevel) {
      case 'platinum':
        return <Badge className="bg-gradient-to-r from-purple-600 to-purple-800 text-white border-none">🏆 Platinum Verified</Badge>;
      case 'gold':
        return <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-700 text-white border-none">🥇 Gold Verified</Badge>;
      case 'blue':
        return <Badge className="bg-gradient-to-r from-blue-500 to-blue-700 text-white border-none">🔵 Verified</Badge>;
      default:
        return null;
    }
  };

  const handleBookSession = () => {
    if (expert) {
      navigate(`/sessions/book/${expert.id}`);
    }
  };

  const handleSendMessage = () => {
    toast({
      title: "Messaging",
      description: "Direct messaging will be available soon!",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${expert.name} - Mental Health Expert`,
        text: `Check out ${expert.name}, a verified mental health expert specializing in ${expert.specialization}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Profile link has been copied to your clipboard.",
      });
    }
  };
  
  return (
    <>
      <Helmet>
        <title>{expert.name} - Mental Health Expert | Veilo</title>
        <meta name="description" content={`Connect with ${expert.name}, a verified mental health expert specializing in ${expert.specialization}. ${expert.bio.substring(0, 160)}...`} />
        <meta name="keywords" content={`${expert.name}, ${expert.specialization}, mental health expert, ${expert.topicsHelped.join(', ')}`} />
        <meta property="og:title" content={`${expert.name} - Mental Health Expert | Veilo`} />
        <meta property="og:description" content={expert.bio.substring(0, 200)} />
        <meta property="og:image" content={expert.avatarUrl} />
        <meta property="og:type" content="profile" />
        <link rel="canonical" href={`${window.location.origin}/beacons/${expert.id}`} />
      </Helmet>
      
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="container py-8 max-w-6xl mx-auto">
            {/* Header Navigation */}
            <div className="flex items-center justify-between mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate('/beacons')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Beacons
              </Button>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button variant="ghost" size="sm">
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Expert Profile Header */}
            <Card className="mb-8 overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-blue-500"></div>
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left Column - Expert Info */}
                  <div className="lg:w-1/3 flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <Avatar className="h-40 w-40 border-4 border-white shadow-xl ring-4 ring-primary/10">
                        <AvatarImage 
                          src={expert.avatarUrl?.startsWith('http') ? expert.avatarUrl : 
                                expert.avatarUrl?.startsWith('/uploads/') ? `http://localhost:3000${expert.avatarUrl}` : 
                                expert.avatarUrl || `/experts/default.jpg`} 
                          alt={expert.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-purple-600 text-white">{expert.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {expert.verificationLevel && (
                        <div className="absolute -bottom-2 -right-2">
                          <div className="bg-white rounded-full p-2 shadow-lg">
                            <Award className="h-6 w-6 text-yellow-500" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <h1 className="text-3xl font-bold mb-2 text-gray-900">{expert.name}</h1>
                    <p className="text-gray-600 text-lg mb-4">{expert.specialization}</p>
                    
                    <div className="mb-6">{getVerificationBadge()}</div>
                    
                    {/* Rating and Stats */}
                    <div className="flex items-center justify-center gap-6 mb-8 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-lg">{expert.rating.toFixed(1)}</span>
                        <span className="text-gray-500">({expert.testimonials.length} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>1.2k+ helped</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-3 w-full max-w-sm">
                      <Button 
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary-dark hover:to-purple-700 shadow-lg" 
                        onClick={handleBookSession}
                      >
                        <Calendar className="h-5 w-5 mr-2" />
                        Book Session
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          variant="outline" 
                          className="h-11"
                          onClick={handleToggleFollow}
                          disabled={followState.isLoading}
                        >
                          <Heart className={`h-4 w-4 mr-1 ${followState.isFollowing ? 'fill-red-500 text-red-500' : ''}`} />
                          {followState.isFollowing ? 'Following' : 'Follow'}
                        </Button>
                        <Button variant="outline" className="h-11" onClick={handleSendMessage}>
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </div>
                    
                    {/* Pricing */}
                    <div className="mt-6 p-4 bg-green-50 rounded-lg w-full max-w-sm">
                      <p className="text-sm text-gray-600 mb-1">Pricing</p>
                      <p className="font-semibold text-green-700">
                        {expert.pricingModel === 'free' ? 'Free Support' : 
                         expert.pricingModel === 'donation' ? 'Donation-based' : 
                         expert.pricingDetails || 'Contact for pricing'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right Column - Details */}
                  <div className="lg:w-2/3">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="about" className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          About
                        </TabsTrigger>
                        <TabsTrigger value="expertise" className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Expertise
                        </TabsTrigger>
                        <TabsTrigger value="reviews" className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Reviews
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="about" className="space-y-6">
                        <div>
                          <h3 className="text-xl font-semibold mb-4 text-gray-900">About {expert.name}</h3>
                          <div className="prose prose-gray max-w-none">
                            <p className="text-gray-700 leading-relaxed">{expert.bio}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-5 w-5 text-blue-600" />
                              <h4 className="font-semibold text-blue-900">Availability</h4>
                            </div>
                            <p className="text-blue-800">Available for sessions</p>
                            <p className="text-sm text-blue-600">Usually responds within 2 hours</p>
                          </div>
                          
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="h-5 w-5 text-purple-600" />
                              <h4 className="font-semibold text-purple-900">Languages</h4>
                            </div>
                            <p className="text-purple-800">English, Spanish</p>
                            <p className="text-sm text-purple-600">Fluent in multiple languages</p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="expertise" className="space-y-6">
                        <div>
                          <h3 className="text-xl font-semibold mb-4 text-gray-900">Areas of Expertise</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {expert.topicsHelped.map((topic, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="p-3 text-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 text-gray-700 border border-gray-200 hover:border-primary/50 transition-colors"
                              >
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="p-6 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold mb-3 text-gray-900">Specialization Focus</h4>
                          <p className="text-gray-700">{expert.specialization}</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="reviews" className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-semibold text-gray-900">Client Reviews</h3>
                          <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{expert.rating.toFixed(1)}</span>
                            <span className="text-gray-500">({expert.testimonials.length} reviews)</span>
                          </div>
                        </div>
                        
                        {expert.testimonials.length > 0 ? (
                          <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-4">
                              {expert.testimonials.map((testimonial) => (
                                <Card key={testimonial.id} className="p-6 bg-white border border-gray-100 shadow-sm">
                                  <div className="flex items-start gap-4">
                                    <Avatar className="h-12 w-12 ring-2 ring-gray-100">
                                      <AvatarImage 
                                        src={`/avatars/avatar-${testimonial.user.avatarIndex}.svg`} 
                                        alt={testimonial.user.alias} 
                                      />
                                      <AvatarFallback className="bg-primary/10 text-primary">
                                        {testimonial.user.alias.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <p className="font-semibold text-gray-900">{testimonial.user.alias}</p>
                                        <div className="flex items-center">
                                          {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                          ))}
                                        </div>
                                      </div>
                                      <p className="text-gray-700 leading-relaxed">{testimonial.text}</p>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-lg">No reviews yet</p>
                            <p className="text-gray-400">Be the first to leave a review after your session!</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default ExpertProfile;
