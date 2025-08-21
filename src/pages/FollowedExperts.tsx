import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Layout from '@/components/layout/Layout';
import { apiRequest } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Expert } from '@/types';
import { Heart, Star, Users, ChevronLeft } from 'lucide-react';

const FollowedExperts = () => {
  const [followedExperts, setFollowedExperts] = useState<Expert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadFollowedExperts = async () => {
      setIsLoading(true);
      try {
        const response = await apiRequest('GET', '/api/experts/following');
        if (response.success && response.data) {
          setFollowedExperts(response.data);
        } else {
          console.error('Failed to fetch followed experts:', response.error);
        }
      } catch (error) {
        console.error('Error fetching followed experts:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load followed experts. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFollowedExperts();
  }, [toast]);

  const handleUnfollow = async (expertId: string) => {
    try {
      const response = await apiRequest('POST', `/api/experts/${expertId}/unfollow`);
      if (response.success) {
        setFollowedExperts(prev => prev.filter(expert => expert.id !== expertId));
        toast({
          title: 'Unfollowed Expert',
          description: 'You will no longer receive updates from this expert.',
        });
      }
    } catch (error) {
      console.error('Unfollow error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to unfollow expert. Please try again.',
      });
    }
  };

  const getVerificationBadgeStyle = (level: string) => {
    switch (level) {
      case 'blue':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'gold':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'platinum':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Followed Experts | Veilo</title>
        <meta name="description" content="Manage your followed mental health experts on Veilo. Stay updated on their posts and session availability." />
        <meta name="keywords" content="followed experts, mental health professionals, expert updates, Veilo" />
      </Helmet>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="container py-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Link to="/beacons">
                  <Button variant="ghost" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Beacons
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">My Followed Experts</h1>
                  <p className="text-gray-600 mt-2">
                    Experts you're following for updates and session notifications
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{followedExperts.length}</div>
                <div className="text-sm text-gray-600">Experts Following</div>
              </div>
            </div>

            {followedExperts.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Followed Experts</h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start following mental health experts to stay updated on their posts and session availability.
                </p>
                <Link to="/beacons">
                  <Button>
                    Discover Experts
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {followedExperts.map((expert) => (
                  <Card key={expert.id} className="overflow-hidden hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
                    <div className="h-2 bg-gradient-to-r from-veilo-blue to-veilo-purple"></div>
                    <CardContent className="p-6">
                      {/* Expert Info */}
                      <div className="flex items-center mb-4">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                          <AvatarImage 
                            src={expert.avatarUrl?.startsWith('http') ? expert.avatarUrl : 
                                  expert.avatarUrl?.startsWith('/uploads/') ? `http://localhost:3001${expert.avatarUrl}` : 
                                  expert.avatarUrl || `/experts/default.jpg`} 
                            alt={expert.name} 
                          />
                          <AvatarFallback>{expert.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">{expert.name}</h3>
                            {expert.verified && (
                              <Badge variant="outline" className={`text-xs ${getVerificationBadgeStyle(expert.verificationLevel)}`}>
                                {expert.verificationLevel.charAt(0).toUpperCase() + expert.verificationLevel.slice(1)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{expert.specialization}</p>
                          <div className="flex items-center mt-1">
                            <div className="flex items-center text-yellow-500">
                              <Star className="h-4 w-4 fill-yellow-500" />
                              <span className="ml-1 text-sm font-medium">{expert.rating.toFixed(1)}</span>
                            </div>
                            <span className="mx-2 text-gray-300">•</span>
                            <div className="flex items-center text-gray-500">
                              <Users className="h-3 w-3 mr-1" />
                              <span className="text-xs">{expert.followersCount || 0} followers</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {expert.bio.length > 120 ? `${expert.bio.substring(0, 120)}...` : expert.bio}
                      </p>

                      {/* Topics */}
                      {expert.topicsHelped && expert.topicsHelped.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {expert.topicsHelped.slice(0, 2).map((topic, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-veilo-blue-light/20 text-veilo-blue-dark">
                              {topic}
                            </Badge>
                          ))}
                          {expert.topicsHelped.length > 2 && (
                            <Badge variant="secondary" className="text-xs bg-gray-100">
                              +{expert.topicsHelped.length - 2} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link to={`/beacons/${expert.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View Profile
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUnfollow(expert.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Heart className="h-4 w-4 fill-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default FollowedExperts;