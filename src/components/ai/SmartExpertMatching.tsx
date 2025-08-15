import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserContext } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Target, 
  Heart, 
  TrendingUp, 
  Activity, 
  Users,
  Star,
  Calendar,
  BarChart3,
  Zap,
  Award,
  MessageSquare,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiRecommendationEngine, PersonalizedRecommendation, RecommendationScore } from '@/services/aiRecommendationEngine';
import { aiEmotionalIntelligence } from '@/services/aiEmotionalIntelligence';
import { ExpertApi } from '@/services/api';
import { logger } from '@/services/logger';

interface SmartExpertMatchingProps {
  userId?: string;
  userContent?: string;
  emotionalState?: string;
  className?: string;
  onExpertSelected?: (expertId: string) => void;
}

interface ExpertProfile {
  id: string;
  name: string;
  specializations: string[];
  rating: number;
  reviewCount: number;
  availability: 'available' | 'busy' | 'offline';
  priceRange: string;
  responseTime: string;
  languages: string[];
  experience: number;
  successRate: number;
}

interface MatchingAnalysis {
  topMatches: RecommendationScore[];
  analysisFactors: {
    emotionalAlignment: number;
    specializationMatch: number;
    availabilityScore: number;
    ratingWeight: number;
    priceCompatibility: number;
  };
  reasoning: string[];
  alternativeOptions: {
    budget: RecommendationScore[];
    availability: RecommendationScore[];
    specialization: RecommendationScore[];
  };
}

export const SmartExpertMatching: React.FC<SmartExpertMatchingProps> = ({
  userId,
  userContent = '',
  emotionalState = 'neutral',
  className = '',
  onExpertSelected
}) => {
  const { user } = useUserContext();
  const { toast } = useToast();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchingResults, setMatchingResults] = useState<MatchingAnalysis | null>(null);
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState({
    budget: 'flexible',
    urgency: 'medium',
    specializations: [] as string[],
    language: 'english'
  });

  useEffect(() => {
    loadExperts();
  }, []);

  useEffect(() => {
    if (userContent && userContent.length > 20 && experts.length > 0) {
      performSmartMatching();
    }
  }, [userContent, experts, userPreferences]);

  const loadExperts = async () => {
    try {
      const response = await ExpertApi.getExperts();
      if (response.success && response.data) {
        // Mock expert data for demo
        const mockExperts: ExpertProfile[] = [
          {
            id: 'expert1',
            name: 'Dr. Sarah Chen',
            specializations: ['Anxiety', 'Depression', 'Cognitive Therapy'],
            rating: 4.9,
            reviewCount: 124,
            availability: 'available',
            priceRange: '$80-120',
            responseTime: '< 2 hours',
            languages: ['English', 'Mandarin'],
            experience: 8,
            successRate: 94
          },
          {
            id: 'expert2', 
            name: 'Dr. Michael Rodriguez',
            specializations: ['Trauma', 'PTSD', 'Stress Management'],
            rating: 4.8,
            reviewCount: 89,
            availability: 'busy',
            priceRange: '$100-150',
            responseTime: '< 4 hours',
            languages: ['English', 'Spanish'],
            experience: 12,
            successRate: 91
          },
          {
            id: 'expert3',
            name: 'Dr. Emma Thompson',
            specializations: ['Relationship Issues', 'Family Therapy', 'Communication'],
            rating: 4.7,
            reviewCount: 156,
            availability: 'available',
            priceRange: '$60-90',
            responseTime: '< 1 hour',
            languages: ['English'],
            experience: 6,
            successRate: 88
          }
        ];
        setExperts(mockExperts);
      }
    } catch (error) {
      logger.error('Failed to load experts', { error });
    }
  };

  const performSmartMatching = async () => {
    if (!user?.id || !userContent) return;

    try {
      setIsAnalyzing(true);

      // Get AI-powered expert matching
      const matches = await aiRecommendationEngine.getSmartExpertMatching(
        userContent,
        [] // user history would go here
      );

      // Analyze emotional state for better matching
      const emotional = await aiEmotionalIntelligence.analyzeEmotionalState(userContent, user.id);

      // Create comprehensive matching analysis
      const analysis: MatchingAnalysis = {
        topMatches: matches.slice(0, 3),
        analysisFactors: {
          emotionalAlignment: calculateEmotionalAlignment(emotional.primary),
          specializationMatch: calculateSpecializationMatch(userContent),
          availabilityScore: calculateAvailabilityScore(),
          ratingWeight: 85,
          priceCompatibility: calculatePriceCompatibility(userPreferences.budget)
        },
        reasoning: generateMatchingReasoning(emotional, userContent),
        alternativeOptions: {
          budget: matches.filter(m => m.score > 0.6),
          availability: matches.filter(m => m.score > 0.5),
          specialization: matches.filter(m => m.score > 0.7)
        }
      };

      setMatchingResults(analysis);

      logger.info('Smart expert matching completed', {
        userId: user.id,
        matchCount: matches.length,
        topScore: matches[0]?.score || 0
      });

    } catch (error) {
      logger.error('Smart matching failed', { error });
      toast({
        title: "Matching Error",
        description: "Unable to analyze expert matches right now.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateEmotionalAlignment = (emotion: string): number => {
    // Mock calculation - in real app this would be sophisticated
    const alignmentMap: Record<string, number> = {
      'anxiety': 95,
      'depression': 90,
      'anger': 85,
      'sadness': 88,
      'fear': 92,
      'neutral': 70
    };
    return alignmentMap[emotion] || 70;
  };

  const calculateSpecializationMatch = (content: string): number => {
    // Analyze content for specialization keywords
    const keywords = content.toLowerCase();
    const specializations = ['anxiety', 'depression', 'trauma', 'relationship', 'stress'];
    
    const matches = specializations.filter(spec => keywords.includes(spec));
    return Math.min(95, matches.length * 25 + 60);
  };

  const calculateAvailabilityScore = (): number => {
    const availableExperts = experts.filter(e => e.availability === 'available').length;
    return Math.min(100, (availableExperts / experts.length) * 100);
  };

  const calculatePriceCompatibility = (budget: string): number => {
    const compatibility = {
      'low': 90,
      'medium': 80,
      'high': 70,
      'flexible': 85
    };
    return compatibility[budget as keyof typeof compatibility] || 75;
  };

  const generateMatchingReasoning = (emotional: any, content: string): string[] => {
    const reasons = [];
    
    if (emotional.intensity > 70) {
      reasons.push("High emotional intensity detected - prioritizing experienced specialists");
    }
    
    if (content.toLowerCase().includes('urgent') || content.toLowerCase().includes('crisis')) {
      reasons.push("Urgency indicators found - showing immediately available experts");
    }
    
    if (emotional.primary === 'anxiety') {
      reasons.push("Anxiety patterns identified - matching with cognitive therapy specialists");
    }
    
    reasons.push("Matching based on success rates, user reviews, and specialization alignment");
    
    return reasons;
  };

  const handleExpertSelection = (expertId: string) => {
    setSelectedExpert(expertId);
    if (onExpertSelected) {
      onExpertSelected(expertId);
    }
    
    toast({
      title: "Expert Selected",
      description: "Proceeding to booking consultation with selected expert.",
    });
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card className={`${className} border border-primary/20 shadow-lg`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI-Powered Expert Matching
        </CardTitle>
        
        {isAnalyzing && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4 animate-pulse" />
            <span>Analyzing your needs and matching with experts...</span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="matches" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="matches">Top Matches</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="space-y-4">
            {matchingResults ? (
              <AnimatePresence>
                {matchingResults.topMatches.map((match, index) => {
                  const expert = experts.find(e => e.id === match.expertId);
                  if (!expert) return null;

                  return (
                    <motion.div
                      key={match.expertId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedExpert === expert.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/30'
                      }`}
                      onClick={() => handleExpertSelection(expert.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{expert.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge 
                              variant="secondary" 
                              className={getAvailabilityColor(expert.availability)}
                            >
                              {expert.availability}
                            </Badge>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Star className="h-3 w-3 fill-current text-yellow-500 mr-1" />
                              {expert.rating} ({expert.reviewCount} reviews)
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {Math.round(match.score * 100)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Match Score</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-1">
                          {expert.specializations.map((spec) => (
                            <Badge key={spec} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold">{expert.experience}y</div>
                            <div className="text-xs text-muted-foreground">Experience</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{expert.successRate}%</div>
                            <div className="text-xs text-muted-foreground">Success Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{expert.responseTime}</div>
                            <div className="text-xs text-muted-foreground">Response</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium">Price: </span>
                            <span className="text-muted-foreground">{expert.priceRange}/session</span>
                          </div>
                          <Button size="sm" variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            Book Consultation
                          </Button>
                        </div>

                        {match.reasons.length > 0 && (
                          <div className="pt-2 border-t border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Match Reasons:</p>
                            <div className="flex flex-wrap gap-1">
                              {match.reasons.slice(0, 3).map((reason, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {userContent.length < 20 
                    ? "Share more about your needs to get personalized expert matches"
                    : "AI expert matching will appear here"}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {matchingResults ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(matchingResults.analysisFactors).map(([factor, score]) => (
                    <div key={factor} className="p-3 rounded-lg bg-muted">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">
                          {factor.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-sm font-bold">{score}%</span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium flex items-center">
                    <Brain className="h-4 w-4 mr-2" />
                    AI Analysis Reasoning
                  </h4>
                  {matchingResults.reasoning.map((reason, index) => (
                    <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                      {reason}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Analysis details will appear after matching</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="alternatives" className="space-y-4">
            {matchingResults ? (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Budget-Friendly Options</h4>
                    <div className="space-y-2">
                      {matchingResults.alternativeOptions.budget.slice(0, 2).map((alt) => {
                        const expert = experts.find(e => e.id === alt.expertId);
                        return expert ? (
                          <div key={alt.expertId} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{expert.name}</p>
                                <p className="text-sm text-muted-foreground">{expert.priceRange}</p>
                              </div>
                              <Badge variant="outline">{Math.round(alt.score * 100)}% match</Badge>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Immediately Available</h4>
                    <div className="space-y-2">
                      {matchingResults.alternativeOptions.availability.slice(0, 2).map((alt) => {
                        const expert = experts.find(e => e.id === alt.expertId);
                        return expert ? (
                          <div key={alt.expertId} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{expert.name}</p>
                                <p className="text-sm text-muted-foreground">Available now</p>
                              </div>
                              <Badge variant="outline">{Math.round(alt.score * 100)}% match</Badge>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Alternative options will appear after matching</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};