import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Lightbulb, 
  UserCheck, 
  BookOpen, 
  Target, 
  Star, 
  X, 
  Eye,
  ArrowRight,
  Sparkles,
  Heart,
  MessageCircle
} from 'lucide-react';
import { RecommendationApi } from '@/services/recommendationApi';

interface Recommendation {
  id: string;
  type: 'expert' | 'post' | 'resource' | 'topic';
  title: string;
  description: string;
  relevanceScore: number;
  basedOn: string;
  category: 'mood' | 'topic' | 'behavior' | 'emergency' | 'wellness';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expertId?: string;
  resourceTitle?: string;
  resourceUrl?: string;
  topicName?: string;
  postId?: string;
}

interface SmartRecommendationsProps {
  userId: string;
  currentPost?: {
    content: string;
    feeling?: string;
    topic?: string;
  };
  recentActivity?: string;
  onExpertConnect?: (expertId: string) => void;
  onTopicExplore?: (topic: string) => void;
  onResourceOpen?: (url: string) => void;
  limit?: number;
}

export const SmartRecommendations = ({
  userId,
  currentPost,
  recentActivity,
  onExpertConnect,
  onTopicExplore,
  onResourceOpen,
  limit = 5
}: SmartRecommendationsProps) => {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      // Mock recommendations for demo
      const mockRecommendations: Recommendation[] = [
        {
          id: 'rec-1',
          type: 'expert',
          title: 'Connect with Dr. Sarah Chen',
          description: 'Specializes in anxiety and mindfulness techniques. Perfect match for your current emotional state.',
          relevanceScore: 0.9,
          basedOn: 'Your recent posts about anxiety',
          category: 'mood',
          priority: 'high',
          expertId: 'expert-1'
        },
        {
          id: 'rec-2',
          type: 'resource',
          title: 'Breathing Techniques for Anxiety',
          description: 'Learn 5-minute breathing exercises that can help calm your mind during stressful moments.',
          relevanceScore: 0.85,
          basedOn: 'Your feeling: anxious',
          category: 'wellness',
          priority: 'medium',
          resourceTitle: 'Breathing Techniques Guide',
          resourceUrl: '/resources/breathing-techniques'
        },
        {
          id: 'rec-3',
          type: 'topic',
          title: 'Explore: Sleep and Mental Health',
          description: 'Many community members find discussing sleep patterns helpful for managing anxiety.',
          relevanceScore: 0.75,
          basedOn: 'Similar users\' interests',
          category: 'topic',
          priority: 'medium',
          topicName: 'Sleep'
        }
      ];
      
      setRecommendations(mockRecommendations.slice(0, limit));
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewRecommendations = async () => {
    if (!currentPost) return;
    
    setIsGenerating(true);
    try {
      // Mock API call for generating recommendations
      toast({
        title: 'Generating recommendations',
        description: 'AI is analyzing your content to provide personalized suggestions...',
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await fetchRecommendations();
      
      toast({
        title: 'New recommendations ready',
        description: 'Fresh AI-powered recommendations based on your latest activity.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to generate recommendations',
        description: 'Please try again later.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const markAsShown = async (recommendationId: string) => {
    try {
      // Mock API call
      console.log('Marking recommendation as shown:', recommendationId);
    } catch (error) {
      console.error('Failed to mark recommendation as shown:', error);
    }
  };

  const handleRecommendationClick = async (recommendation: Recommendation) => {
    try {
      // Mock API call to mark as clicked
      console.log('Recommendation clicked:', recommendation.id);
      
      switch (recommendation.type) {
        case 'expert':
          if (recommendation.expertId && onExpertConnect) {
            onExpertConnect(recommendation.expertId);
          }
          break;
        case 'resource':
          if (recommendation.resourceUrl && onResourceOpen) {
            onResourceOpen(recommendation.resourceUrl);
          }
          break;
        case 'topic':
          if (recommendation.topicName && onTopicExplore) {
            onTopicExplore(recommendation.topicName);
          }
          break;
      }
    } catch (error) {
      console.error('Failed to handle recommendation click:', error);
    }
  };

  const dismissRecommendation = async (recommendationId: string) => {
    try {
      // Mock API call
      setRecommendations(prev => prev.filter(rec => rec.id !== recommendationId));
      
      toast({
        title: 'Recommendation dismissed',
        description: 'We\'ll show you more relevant suggestions.',
      });
    } catch (error) {
      console.error('Failed to dismiss recommendation:', error);
    }
  };

  const getTypeIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'expert':
        return <UserCheck className="h-4 w-4" />;
      case 'resource':
        return <BookOpen className="h-4 w-4" />;
      case 'topic':
        return <Target className="h-4 w-4" />;
      case 'post':
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: Recommendation['category']) => {
    switch (category) {
      case 'mood':
        return <Heart className="h-3 w-3" />;
      case 'emergency':
        return <Target className="h-3 w-3" />;
      default:
        return <Sparkles className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Lightbulb className="h-5 w-5 mr-2" />
              Smart Recommendations
            </CardTitle>
            <CardDescription>
              AI-powered suggestions based on your activity
            </CardDescription>
          </div>
          {currentPost && (
            <Button
              variant="outline"
              size="sm"
              onClick={generateNewRecommendations}
              disabled={isGenerating}
              className="flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              {isGenerating ? 'Generating...' : 'Refresh'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recommendations available right now.</p>
            <p className="text-sm">Share a post to get personalized suggestions!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="p-3 border rounded-lg hover:shadow-sm transition-shadow"
                onMouseEnter={() => markAsShown(recommendation.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(recommendation.type)}
                    <span className="font-medium text-sm">{recommendation.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className={getPriorityColor(recommendation.priority)}>
                      {recommendation.priority}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissRecommendation(recommendation.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {recommendation.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {getCategoryIcon(recommendation.category)}
                    <span>{recommendation.basedOn}</span>
                    <Star className="h-3 w-3" />
                    <span>{Math.round(recommendation.relevanceScore * 100)}% match</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRecommendationClick(recommendation)}
                    className="h-7 px-2 text-xs"
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    {recommendation.type === 'expert' ? 'Connect' : 
                     recommendation.type === 'resource' ? 'View' :
                     recommendation.type === 'topic' ? 'Explore' : 'View'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};