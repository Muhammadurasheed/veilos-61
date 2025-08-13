import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Star, 
  MessageCircle, 
  Video, 
  Clock,
  CheckCircle,
  Sparkles,
  Heart,
  Brain,
  Shield
} from 'lucide-react';

interface ExpertMatch {
  expertId: string;
  matchScore: number;
  reason: string;
  specialtyAlignment: string;
  expert: {
    id: string;
    alias: string;
    specialties: string[];
    bio: string;
    avatar?: string;
    rating?: number;
    sessionsCount?: number;
    availability?: 'available' | 'busy' | 'offline';
    languages?: string[];
  };
}

interface ExpertMatcherProps {
  feeling?: string;
  topic?: string;
  urgency?: 'low' | 'medium' | 'high' | 'urgent';
  onExpertSelect?: (expertId: string) => void;
  onScheduleSession?: (expertId: string) => void;
}

export const ExpertMatcher = ({
  feeling,
  topic,
  urgency = 'medium',
  onExpertSelect,
  onScheduleSession
}: ExpertMatcherProps) => {
  const { toast } = useToast();
  const [matches, setMatches] = useState<ExpertMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMatched, setHasMatched] = useState(false);

  const findMatches = async () => {
    setIsLoading(true);
    try {
      // Mock expert matches for demo
      const mockMatches: ExpertMatch[] = [
        {
          expertId: 'expert-1',
          matchScore: 0.95,
          reason: 'Perfect specialty match for anxiety and stress management',
          specialtyAlignment: 'Specializes in anxiety disorders, mindfulness, and cognitive behavioral therapy',
          expert: {
            id: 'expert-1',
            alias: 'Dr. Sarah Chen',
            specialties: ['Anxiety', 'Stress Management', 'Mindfulness', 'CBT'],
            bio: 'Licensed psychologist with 8+ years specializing in anxiety disorders and mindfulness-based interventions.',
            avatar: '/experts/expert-1.jpg',
            rating: 4.9,
            sessionsCount: 247,
            availability: 'available',
            languages: ['English', 'Mandarin']
          }
        },
        {
          expertId: 'expert-2',
          matchScore: 0.87,
          reason: 'Strong experience with emotional support and crisis intervention',
          specialtyAlignment: 'Expert in emotional regulation and crisis counseling',
          expert: {
            id: 'expert-2',
            alias: 'Marcus Thompson',
            specialties: ['Crisis Counseling', 'Emotional Support', 'Depression', 'Life Transitions'],
            bio: 'Certified counselor focused on emotional wellness and life transitions. Available for immediate support.',
            avatar: '/experts/expert-2.jpg',
            rating: 4.8,
            sessionsCount: 156,
            availability: 'available',
            languages: ['English', 'Spanish']
          }
        },
        {
          expertId: 'expert-3',
          matchScore: 0.82,
          reason: 'Excellent track record with similar cases and therapeutic approach',
          specialtyAlignment: 'Combines traditional therapy with holistic wellness approaches',
          expert: {
            id: 'expert-3',
            alias: 'Dr. Amara Okafor',
            specialties: ['Holistic Therapy', 'Trauma Recovery', 'Self-Care', 'Wellness'],
            bio: 'Integrative therapist combining evidence-based practices with holistic wellness for comprehensive care.',
            avatar: '/experts/expert-3.jpg',
            rating: 4.7,
            sessionsCount: 189,
            availability: 'busy',
            languages: ['English', 'French']
          }
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMatches(mockMatches);
      setHasMatched(true);
      
      toast({
        title: 'Expert matches found!',
        description: `Found ${mockMatches.length} highly compatible experts for your needs.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to find matches',
        description: 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'available':
        return <CheckCircle className="h-3 w-3" />;
      case 'busy':
        return <Clock className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getUrgencyIcon = () => {
    switch (urgency) {
      case 'urgent':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'high':
        return <Heart className="h-4 w-4 text-orange-500" />;
      default:
        return <Brain className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Expert Matcher
        </CardTitle>
        <CardDescription>
          AI-powered expert matching based on your needs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasMatched ? (
          <div className="text-center py-6">
            <div className="mb-4">
              {getUrgencyIcon()}
            </div>
            <h3 className="font-medium mb-2">Find Your Perfect Expert Match</h3>
            <p className="text-sm text-gray-600 mb-4">
              Our AI will analyze your needs and match you with the most suitable experts.
            </p>
            
            {(feeling || topic) && (
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {feeling && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    Feeling: {feeling}
                  </Badge>
                )}
                {topic && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Topic: {topic}
                  </Badge>
                )}
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  Priority: {urgency}
                </Badge>
              </div>
            )}
            
            <Button
              onClick={findMatches}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Finding Matches...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Find Expert Matches
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Top Matches Found</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHasMatched(false)}
              >
                New Search
              </Button>
            </div>
            
            {matches.map((match) => (
              <Card key={match.expertId} className="border-l-4 border-l-purple-400">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={match.expert.avatar} alt={match.expert.alias} />
                        <AvatarFallback>
                          {match.expert.alias.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{match.expert.alias}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{match.expert.rating}</span>
                          <span>•</span>
                          <span>{match.expert.sessionsCount} sessions</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="h-3 w-3 text-purple-500" />
                        <span className="text-sm font-medium text-purple-700">
                          {Math.round(match.matchScore * 100)}% match
                        </span>
                      </div>
                      <Badge className={getAvailabilityColor(match.expert.availability || 'offline')}>
                        {getAvailabilityIcon(match.expert.availability || 'offline')}
                        <span className="ml-1">{match.expert.availability}</span>
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">{match.expert.bio}</p>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium text-purple-700 mb-1">Why this expert:</p>
                    <p className="text-sm text-gray-600">{match.reason}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {match.expert.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                  
                  {match.expert.languages && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                      <span>Languages:</span>
                      {match.expert.languages.map((lang, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onExpertSelect?.(match.expertId)}
                      className="flex-1"
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Chat Now
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onScheduleSession?.(match.expertId)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      disabled={match.expert.availability === 'offline'}
                    >
                      <Video className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};