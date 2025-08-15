import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useUserContext } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Heart, 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp, 
  Activity,
  MessageSquare,
  Shield,
  Target,
  Sparkles,
  Phone,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  aiEmotionalIntelligence, 
  EmotionalState, 
  CrisisDetectionResult,
  ConversationContext,
  SmartResponse
} from '@/services/aiEmotionalIntelligence';
import { logger } from '@/services/logger';

interface AIAssistantProps {
  conversationContext?: ConversationContext;
  onCrisisDetected?: (crisis: CrisisDetectionResult) => void;
  onResponseSuggested?: (response: SmartResponse) => void;
  className?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  conversationContext,
  onCrisisDetected,
  onResponseSuggested,
  className = ''
}) => {
  const { user } = useUserContext();
  const { toast } = useToast();
  
  const [emotionalState, setEmotionalState] = useState<EmotionalState | null>(null);
  const [analysisText, setAnalysisText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'suggestions' | 'wellness'>('analysis');
  const [suggestions, setSuggestions] = useState<SmartResponse | null>(null);
  const [wellnessData, setWellnessData] = useState<any>(null);
  const [conversationStarters, setConversationStarters] = useState<{
    iceBreakers: string[];
    deeperQuestions: string[];
    supportivePrompts: string[];
    followUpQuestions: string[];
  } | null>(null);

  const analysisTimeoutRef = useRef<NodeJS.Timeout>();

  // Real-time emotional analysis as user types
  useEffect(() => {
    if (analysisText.length > 10 && user?.id) {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      
      analysisTimeoutRef.current = setTimeout(async () => {
        await performEmotionalAnalysis(analysisText);
      }, 1500); // Debounce analysis
    }

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [analysisText, user?.id]);

  const performEmotionalAnalysis = async (content: string) => {
    if (!user?.id) return;
    
    try {
      setIsAnalyzing(true);
      
      // Analyze emotional state
      const emotional = await aiEmotionalIntelligence.analyzeEmotionalState(content, user.id);
      setEmotionalState(emotional);

      // Check for crisis signals if context is provided
      if (conversationContext) {
        const crisis = await aiEmotionalIntelligence.detectCrisisSignals(
          content, 
          user.id, 
          conversationContext
        );
        
        if (crisis.isCrisis && onCrisisDetected) {
          onCrisisDetected(crisis);
        }

        // Generate smart response suggestions
        const smartResponse = await aiEmotionalIntelligence.generateSmartResponse(
          content,
          conversationContext,
          'peer'
        );
        setSuggestions(smartResponse);

        // Generate conversation starters based on emotional state
        if (emotional.intensity > 30) {
          const starters = await aiEmotionalIntelligence.generateConversationStarters(
            emotional,
            conversationContext
          );
          setConversationStarters(starters);
        }
      }

      logger.info('AI analysis completed', {
        emotion: emotional.primary,
        intensity: emotional.intensity,
        confidence: emotional.confidence
      });

    } catch (error) {
      logger.error('AI analysis failed', { error });
      toast({
        title: "Analysis Error",
        description: "Unable to analyze emotional state right now.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadWellnessTrends = async () => {
    if (!user?.id) return;
    
    try {
      const trends = await aiEmotionalIntelligence.analyzeWellnessTrends(user.id, '7d');
      setWellnessData(trends);
    } catch (error) {
      logger.error('Failed to load wellness trends', { error });
      toast({
        title: "Wellness Data Unavailable",
        description: "Unable to load wellness trends right now.",
        variant: "destructive"
      });
    }
  };

  const getEmotionColor = (emotion: string, intensity: number) => {
    const colors = {
      joy: `text-yellow-600 bg-yellow-100`,
      sadness: `text-blue-600 bg-blue-100`,
      anger: `text-red-600 bg-red-100`,
      fear: `text-purple-600 bg-purple-100`,
      anxiety: `text-orange-600 bg-orange-100`,
      hope: `text-green-600 bg-green-100`,
      neutral: `text-gray-600 bg-gray-100`
    };
    return colors[emotion as keyof typeof colors] || colors.neutral;
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity >= 80) return 'Very Strong';
    if (intensity >= 60) return 'Strong';
    if (intensity >= 40) return 'Moderate';
    if (intensity >= 20) return 'Mild';
    return 'Subtle';
  };

  const tabs = [
    { id: 'analysis', label: 'Emotion Analysis', icon: Brain },
    { id: 'suggestions', label: 'AI Suggestions', icon: Lightbulb },
    { id: 'wellness', label: 'Wellness Trends', icon: TrendingUp }
  ];

  return (
    <Card className={`${className} border border-primary/20 shadow-lg`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Emotional Intelligence
        </CardTitle>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'wellness') loadWellnessTrends();
                }}
                className="flex-1 text-xs"
              >
                <Icon className="h-3 w-3 mr-1" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Analysis Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Analyze Text for Emotional Content</label>
                <Input
                  value={analysisText}
                  onChange={(e) => setAnalysisText(e.target.value)}
                  placeholder="Type or paste text to analyze emotional state..."
                  className="min-h-20 resize-none"
                />
              </div>

              {/* Real-time Analysis Results */}
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2 text-sm text-muted-foreground"
                >
                  <Brain className="h-4 w-4 animate-pulse" />
                  <span>Analyzing emotional patterns...</span>
                </motion.div>
              )}

              {emotionalState && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Primary Emotional State */}
                  <div className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center">
                        <Heart className="h-4 w-4 mr-2" />
                        Detected Emotion
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className={`${getEmotionColor(emotionalState.primary, emotionalState.intensity)} border-0`}
                      >
                        {emotionalState.primary.charAt(0).toUpperCase() + emotionalState.primary.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Intensity: {getIntensityLabel(emotionalState.intensity)}</span>
                          <span>{emotionalState.intensity}%</span>
                        </div>
                        <Progress value={emotionalState.intensity} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Confidence</span>
                          <span>{emotionalState.confidence}%</span>
                        </div>
                        <Progress value={emotionalState.confidence} className="h-2" />
                      </div>

                      {emotionalState.indicators.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Key Indicators:</p>
                          <div className="flex flex-wrap gap-1">
                            {emotionalState.indicators.map((indicator, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {indicator}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  {emotionalState.primary in ['sadness', 'fear', 'anxiety'] && emotionalState.intensity > 60 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-yellow-800">Enhanced Support Recommended</p>
                          <p className="text-yellow-700">High emotional intensity detected. Consider reaching out for support.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'suggestions' && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {suggestions ? (
                <div className="space-y-4">
                  {/* Smart Response Suggestion */}
                  <div className="p-4 rounded-lg border border-border">
                    <h4 className="font-medium mb-2 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      AI-Suggested Response ({suggestions.tone})
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">{suggestions.suggestedText}</p>
                    <p className="text-xs text-muted-foreground italic">"{suggestions.reasoning}"</p>
                    
                    {onResponseSuggested && (
                      <Button 
                        size="sm" 
                        className="mt-3"
                        onClick={() => onResponseSuggested(suggestions)}
                      >
                        Use This Response
                      </Button>
                    )}
                  </div>

                  {/* Alternative Responses */}
                  {suggestions.alternativeResponses.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Alternative Approaches:</h5>
                      {suggestions.alternativeResponses.map((alt, index) => (
                        <div key={index} className="p-2 bg-muted rounded text-xs">
                          {alt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">AI suggestions will appear here when analyzing conversations</p>
                </div>
              )}

              {/* Conversation Starters */}
              {conversationStarters && (
                <div className="space-y-4 mt-6">
                  <Separator />
                  <h4 className="font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Conversation Starters
                  </h4>
                  
                  <div className="grid gap-3">
                    {conversationStarters.iceBreakers.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Ice Breakers:</p>
                        {conversationStarters.iceBreakers.map((starter, index) => (
                          <div key={index} className="p-2 bg-blue-50 rounded text-xs mb-1">
                            {starter}
                          </div>
                        ))}
                      </div>
                    )}

                    {conversationStarters.supportivePrompts.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Supportive Prompts:</p>
                        {conversationStarters.supportivePrompts.map((prompt, index) => (
                          <div key={index} className="p-2 bg-green-50 rounded text-xs mb-1">
                            {prompt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'wellness' && (
            <motion.div
              key="wellness"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {wellnessData ? (
                <div className="space-y-4">
                  {/* Overall Trend */}
                  <div className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">7-Day Wellness Trend</h4>
                      <Badge 
                        variant={
                          wellnessData.overallTrend === 'improving' ? 'default' :
                          wellnessData.overallTrend === 'declining' ? 'destructive' : 'secondary'
                        }
                      >
                        {wellnessData.overallTrend}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Risk Score</span>
                          <span>{wellnessData.riskScore}%</span>
                        </div>
                        <Progress 
                          value={wellnessData.riskScore} 
                          className={`h-2 ${wellnessData.riskScore > 60 ? 'bg-red-200' : 'bg-green-200'}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Patterns Analysis */}
                  <div className="grid gap-3">
                    {Object.entries(wellnessData.patterns).map(([type, data]: [string, any]) => (
                      <div key={type} className="p-3 rounded-lg bg-muted">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium capitalize">{type} Pattern</span>
                          <Badge variant="outline" className="text-xs">
                            {data.trend}
                          </Badge>
                        </div>
                        {data.indicators.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {data.indicators.map((indicator: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {indicator}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  {wellnessData.recommendations.immediate.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        Immediate Recommendations
                      </h5>
                      {wellnessData.recommendations.immediate.map((rec: string, index: number) => (
                        <div key={index} className="p-2 bg-blue-50 rounded text-xs">
                          {rec}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Wellness trends will appear here</p>
                  <Button onClick={loadWellnessTrends} variant="outline" size="sm">
                    Load Wellness Analytics
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};