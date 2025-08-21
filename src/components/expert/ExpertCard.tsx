
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Heart } from 'lucide-react';
import { Expert } from '@/types';
import { useExpertFollow } from '@/hooks/useExpertFollow';

interface ExpertCardProps {
  expert: Expert;
}

const ExpertCard = ({ expert }: ExpertCardProps) => {
  const navigate = useNavigate();
  const { isFollowing, isLoading, toggleFollow } = useExpertFollow(expert.id);
  
  // Truncate bio to a reasonable length
  const truncatedBio = expert.bio.length > 150 
    ? `${expert.bio.substring(0, 150)}...` 
    : expert.bio;
  
  // Determine verification badge style
  const getVerificationBadgeStyle = () => {
    switch (expert.verificationLevel) {
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
  
  const handleViewProfile = () => {
    navigate(`/beacons/${expert.id}`);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
      <div className="h-2 bg-gradient-to-r from-veilo-blue to-veilo-purple"></div>
      <CardContent className="pt-6">
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
          <div className="ml-3">
            <div className="flex items-center">
              <h3 className="font-semibold text-lg">{expert.name}</h3>
              {expert.verified && (
                <Badge variant="outline" className={`ml-2 ${getVerificationBadgeStyle()}`}>
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
              <span className="text-xs text-gray-500">{expert.testimonials.length} testimonials</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-600">{truncatedBio}</p>
          
          {expert.topicsHelped.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {expert.topicsHelped.slice(0, 3).map((topic, index) => (
                <Badge key={index} variant="secondary" className="bg-veilo-blue-light/20 text-veilo-blue-dark">
                  {topic}
                </Badge>
              ))}
              {expert.topicsHelped.length > 3 && (
                <Badge variant="secondary" className="bg-gray-100">
                  +{expert.topicsHelped.length - 3} more
                </Badge>
              )}
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            <span className="font-medium">Pricing:</span> {' '}
            {expert.pricingModel === 'free' ? (
              <span className="text-green-600">Free Support</span>
            ) : expert.pricingModel === 'donation' ? (
              <span>Donation-based</span>
            ) : (
              <span>{expert.pricingDetails}</span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50/70 border-t p-4">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={toggleFollow}
            disabled={isLoading}
          >
            <Heart className={`h-4 w-4 mr-1 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`} />
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
          <Button className="flex-1" onClick={handleViewProfile}>
            View Profile
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ExpertCard;
