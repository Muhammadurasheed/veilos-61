import React, { useState, useEffect } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { aiRecommendationEngine, PersonalizedRecommendation } from '@/services/aiRecommendationEngine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Heart, Users, TrendingUp, Star, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface SmartRecommendationsProps {
  className?: string;
  showTitle?: boolean;
  maxItems?: number;
}

const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  className = '',
  showTitle = true,
  maxItems = 3
}) => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'experts' | 'spaces' | 'content'>('experts');

  useEffect(() => {
    if (user?.id) {
      loadRecommendations();
    }
  }, [user?.id]);

  const loadRecommendations = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await aiRecommendationEngine.getPersonalizedRecommendations(user.id);
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      toast({
        title: "Recommendations unavailable",
        description: "Unable to load personalized recommendations right now.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExpertClick = (expertId: string) => {
    navigate(`/expert/${expertId}`);
    if (user?.id) {
      aiRecommendationEngine.trackUserInteraction(user.id, {
        type: 'expert_view',
        targetId: expertId,
        timestamp: new Date()
      });
    }
  };

  const handleSanctuaryClick = (spaceId: string) => {
    navigate(`/sanctuary/${spaceId}`);
    if (user?.id) {
      aiRecommendationEngine.trackUserInteraction(user.id, {
        type: 'sanctuary_join',
        targetId: spaceId,
        timestamp: new Date()
      });
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-veilo-purple" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) return null;

  const tabs = [
    { id: 'experts', label: 'Experts', icon: Heart, count: recommendations.experts.length },
    { id: 'spaces', label: 'Spaces', icon: Users, count: recommendations.sanctuarySpaces.length },
    { id: 'content', label: 'Content', icon: TrendingUp, count: recommendations.content.length }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        {showTitle && (
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-veilo-purple" />
            AI Recommendations
          </CardTitle>
        )}
        
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id as any)}
                className="flex-1 text-xs"
              >
                <Icon className="h-3 w-3 mr-1" />
                {tab.label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tab.count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          {activeTab === 'experts' && (
            <motion.div
              key="experts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {recommendations.experts.slice(0, maxItems).map((expert) => (
                <motion.div
                  key={expert.expertId}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center p-3 rounded-lg border border-border hover:border-veilo-purple/30 cursor-pointer transition-all"
                  onClick={() => handleExpertClick(expert.expertId)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">Expert Match</h4>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(expert.score * 100)}% match
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {expert.reasons.slice(0, 2).join(', ')}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {expert.specializations.slice(0, 3).map((spec) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                    <span>{expert.score.toFixed(1)}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'spaces' && (
            <motion.div
              key="spaces"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {recommendations.sanctuarySpaces.slice(0, maxItems).map((space) => (
                <motion.div
                  key={space.id}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center p-3 rounded-lg border border-border hover:border-veilo-blue/30 cursor-pointer transition-all"
                  onClick={() => handleSanctuaryClick(space.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{space.topic}</h4>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(space.relevanceScore * 100)}% relevant
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {space.reasons.join(' • ')}
                    </p>
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {recommendations.content.slice(0, maxItems).map((content) => (
                <motion.div
                  key={content.postId}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center p-3 rounded-lg border border-border hover:border-veilo-green/30 cursor-pointer transition-all"
                  onClick={() => navigate(`/feed?highlight=${content.postId}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">Recommended Post</h4>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(content.relevanceScore * 100)}% match
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {content.categories.map((category) => (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-4"
          onClick={loadRecommendations}
        >
          <Brain className="h-3 w-3 mr-1" />
          Refresh Recommendations
        </Button>
      </CardContent>
    </Card>
  );
};

export default SmartRecommendations;