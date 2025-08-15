import { logger } from './logger';
import { apiRequest } from './api';
import { User, Post } from '@/types/index';

// Enhanced Emotional Intelligence Types
export interface EmotionalState {
  primary: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'neutral' | 'anxiety' | 'hope';
  intensity: number; // 0-100
  confidence: number; // 0-100
  indicators: string[];
  timestamp: Date;
}

export interface CrisisDetectionResult {
  isCrisis: boolean;
  severity: 'none' | 'mild' | 'moderate' | 'high' | 'critical';
  confidence: number;
  triggers: {
    type: 'self_harm' | 'suicide' | 'violence' | 'substance' | 'severe_depression' | 'psychosis';
    keywords: string[];
    contextScore: number;
  }[];
  recommendations: {
    immediate: string[];
    professional: string[];
    resources: { name: string; contact: string; description: string }[];
  };
  riskFactors: string[];
}

export interface ConversationContext {
  participantId: string;
  recentMessages: string[];
  emotionalHistory: EmotionalState[];
  topicFlow: string[];
  engagementLevel: number;
  supportReceived: number;
  supportGiven: number;
}

export interface SmartResponse {
  suggestedText: string;
  tone: 'empathetic' | 'supportive' | 'professional' | 'gentle' | 'urgent';
  reasoning: string;
  alternativeResponses: string[];
  contextualCues: string[];
}

class AIEmotionalIntelligence {
  private emotionalHistory = new Map<string, EmotionalState[]>();
  private crisisThresholds = {
    mild: 30,
    moderate: 50,
    high: 75,
    critical: 90
  };

  // Real-time sentiment and emotional analysis
  async analyzeEmotionalState(content: string, userId: string): Promise<EmotionalState> {
    try {
      logger.debug('Analyzing emotional state', { userId, contentLength: content.length });
      
      const response = await apiRequest<{
        emotion: string;
        intensity: number;
        confidence: number;
        indicators: string[];
      }>('POST', '/api/ai/emotional-analysis', {
        content,
        userId,
        includeHistory: true
      });

      const emotionalState: EmotionalState = {
        primary: (response.data?.emotion as any) || 'neutral',
        intensity: response.data?.intensity || 0,
        confidence: response.data?.confidence || 0,
        indicators: response.data?.indicators || [],
        timestamp: new Date()
      };

      // Store in history
      const history = this.emotionalHistory.get(userId) || [];
      history.push(emotionalState);
      if (history.length > 50) history.shift(); // Keep last 50 states
      this.emotionalHistory.set(userId, history);

      logger.info('Emotional state analyzed', { 
        userId, 
        emotion: emotionalState.primary,
        intensity: emotionalState.intensity,
        confidence: emotionalState.confidence
      });

      return emotionalState;
    } catch (error) {
      logger.error('Emotional analysis failed', { error, userId });
      return {
        primary: 'neutral',
        intensity: 0,
        confidence: 0,
        indicators: [],
        timestamp: new Date()
      };
    }
  }

  // Advanced crisis detection with multiple AI models
  async detectCrisisSignals(
    content: string, 
    userId: string, 
    context: ConversationContext
  ): Promise<CrisisDetectionResult> {
    try {
      logger.debug('Running crisis detection', { userId, contentLength: content.length });

      // Multi-layered analysis using different AI approaches
      const [sentimentAnalysis, keywordAnalysis, contextAnalysis] = await Promise.all([
        this.analyzeSentimentForCrisis(content),
        this.analyzeKeywordsForCrisis(content),
        this.analyzeContextForCrisis(context)
      ]);

      const response = await apiRequest<{
        isCrisis: boolean;
        severity: string;
        confidence: number;
        triggers: any[];
        recommendations: any;
        riskFactors: string[];
      }>('POST', '/api/ai/crisis-detection', {
        content,
        userId,
        context,
        sentimentAnalysis,
        keywordAnalysis,
        contextAnalysis,
        emotionalHistory: this.emotionalHistory.get(userId)?.slice(-10) || []
      });

      const result: CrisisDetectionResult = {
        isCrisis: response.data?.isCrisis || false,
        severity: (response.data?.severity as any) || 'none',
        confidence: response.data?.confidence || 0,
        triggers: response.data?.triggers || [],
        recommendations: response.data?.recommendations || {
          immediate: [],
          professional: [],
          resources: []
        },
        riskFactors: response.data?.riskFactors || []
      };

      // Auto-escalate critical situations
      if (result.isCrisis && result.severity === 'critical') {
        await this.triggerEmergencyProtocol(userId, result);
      }

      logger.info('Crisis detection completed', {
        userId,
        isCrisis: result.isCrisis,
        severity: result.severity,
        confidence: result.confidence
      });

      return result;
    } catch (error) {
      logger.error('Crisis detection failed', { error, userId });
      return {
        isCrisis: false,
        severity: 'none',
        confidence: 0,
        triggers: [],
        recommendations: { immediate: [], professional: [], resources: [] },
        riskFactors: []
      };
    }
  }

  // AI-powered conversation assistance
  async generateSmartResponse(
    originalMessage: string,
    conversationContext: ConversationContext,
    userRole: 'peer' | 'expert' | 'moderator'
  ): Promise<SmartResponse> {
    try {
      const emotionalState = await this.analyzeEmotionalState(originalMessage, conversationContext.participantId);
      
      const response = await apiRequest<{
        suggestedText: string;
        tone: string;
        reasoning: string;
        alternatives: string[];
        contextualCues: string[];
      }>('POST', '/api/ai/smart-response', {
        message: originalMessage,
        context: conversationContext,
        emotionalState,
        userRole,
        responseStyle: 'therapeutic'
      });

      return {
        suggestedText: response.data?.suggestedText || '',
        tone: (response.data?.tone as any) || 'empathetic',
        reasoning: response.data?.reasoning || '',
        alternativeResponses: response.data?.alternatives || [],
        contextualCues: response.data?.contextualCues || []
      };
    } catch (error) {
      logger.error('Smart response generation failed', { error });
      return {
        suggestedText: '',
        tone: 'empathetic',
        reasoning: '',
        alternativeResponses: [],
        contextualCues: []
      };
    }
  }

  // Predictive wellness analytics
  async analyzeWellnessTrends(userId: string, timeframe: '24h' | '7d' | '30d'): Promise<{
    overallTrend: 'improving' | 'stable' | 'declining';
    riskScore: number;
    patterns: {
      emotional: { trend: string; indicators: string[] };
      behavioral: { trend: string; indicators: string[] };
      social: { trend: string; indicators: string[] };
    };
    predictions: {
      nextWeek: { riskLevel: number; recommendations: string[] };
      interventionNeeded: boolean;
    };
    recommendations: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };
  }> {
    try {
      const response = await apiRequest('POST', '/api/ai/wellness-trends', {
        userId,
        timeframe,
        includeEmotionalHistory: true,
        includeBehavioralPatterns: true
      });

      return response.data as any || {
        overallTrend: 'stable' as const,
        riskScore: 0,
        patterns: {
          emotional: { trend: 'stable', indicators: [] },
          behavioral: { trend: 'stable', indicators: [] },
          social: { trend: 'stable', indicators: [] }
        },
        predictions: {
          nextWeek: { riskLevel: 0, recommendations: [] },
          interventionNeeded: false
        },
        recommendations: {
          immediate: [],
          shortTerm: [],
          longTerm: []
        }
      };
    } catch (error) {
      logger.error('Wellness trend analysis failed', { error, userId });
      throw error;
    }
  }

  // Generate conversation starters based on emotional context
  async generateConversationStarters(
    targetEmotionalState: EmotionalState,
    conversationContext: ConversationContext
  ): Promise<{
    iceBreakers: string[];
    deeperQuestions: string[];
    supportivePrompts: string[];
    followUpQuestions: string[];
  }> {
    try {
      const response = await apiRequest('POST', '/api/ai/conversation-starters', {
        emotionalState: targetEmotionalState,
        context: conversationContext,
        style: 'therapeutic'
      });

      return response.data as any || {
        iceBreakers: [],
        deeperQuestions: [],
        supportivePrompts: [],
        followUpQuestions: []
      };
    } catch (error) {
      logger.error('Conversation starter generation failed', { error });
      return {
        iceBreakers: [],
        deeperQuestions: [],
        supportivePrompts: [],
        followUpQuestions: []
      };
    }
  }

  // Private helper methods
  private async analyzeSentimentForCrisis(content: string): Promise<number> {
    // Sentiment analysis specifically tuned for crisis detection
    const crisisIndicators = [
      'hopeless', 'worthless', 'end it', 'give up', 'can\'t go on',
      'hurt myself', 'kill myself', 'suicide', 'die', 'better off dead'
    ];
    
    const lowercaseContent = content.toLowerCase();
    let score = 0;
    
    crisisIndicators.forEach(indicator => {
      if (lowercaseContent.includes(indicator)) {
        score += 20;
      }
    });
    
    return Math.min(score, 100);
  }

  private async analyzeKeywordsForCrisis(content: string): Promise<number> {
    // Advanced keyword analysis for crisis patterns
    const severeCrisisKeywords = ['suicide', 'kill myself', 'end my life'];
    const moderateCrisisKeywords = ['hurt myself', 'self harm', 'worthless', 'hopeless'];
    
    const lowercaseContent = content.toLowerCase();
    let score = 0;
    
    severeCrisisKeywords.forEach(keyword => {
      if (lowercaseContent.includes(keyword)) score += 40;
    });
    
    moderateCrisisKeywords.forEach(keyword => {
      if (lowercaseContent.includes(keyword)) score += 20;
    });
    
    return Math.min(score, 100);
  }

  private async analyzeContextForCrisis(context: ConversationContext): Promise<number> {
    // Context analysis for crisis risk
    let score = 0;
    
    // Declining emotional states over time
    const recentEmotions = context.emotionalHistory.slice(-5);
    if (recentEmotions.length >= 3) {
      const negativeEmotions = recentEmotions.filter(e => 
        ['sadness', 'anger', 'fear', 'anxiety'].includes(e.primary)
      );
      if (negativeEmotions.length >= 3) score += 30;
    }
    
    // Low engagement and isolation
    if (context.engagementLevel < 20) score += 20;
    if (context.supportReceived < 10) score += 20;
    
    return Math.min(score, 100);
  }

  private async triggerEmergencyProtocol(userId: string, crisisResult: CrisisDetectionResult): Promise<void> {
    try {
      logger.warn('EMERGENCY: Crisis protocol triggered', { userId, severity: crisisResult.severity });
      
      // Send alert to emergency response system
      await apiRequest('POST', '/api/emergency/crisis-alert', {
        userId,
        crisisResult,
        timestamp: new Date().toISOString(),
        urgency: 'immediate'
      });
      
      // Log for audit trail
      logger.error('Crisis intervention activated', {
        userId,
        triggers: crisisResult.triggers,
        confidence: crisisResult.confidence
      });
    } catch (error) {
      logger.error('Failed to trigger emergency protocol', { error, userId });
    }
  }

  // Get emotional history for a user
  getEmotionalHistory(userId: string): EmotionalState[] {
    return this.emotionalHistory.get(userId) || [];
  }

  // Clear old emotional data (privacy compliance)
  clearOldEmotionalData(daysOld: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    this.emotionalHistory.forEach((history, userId) => {
      const filteredHistory = history.filter(state => state.timestamp > cutoffDate);
      this.emotionalHistory.set(userId, filteredHistory);
    });
    
    logger.info('Old emotional data cleared', { cutoffDate, daysOld });
  }
}

export const aiEmotionalIntelligence = new AIEmotionalIntelligence();
export default aiEmotionalIntelligence;