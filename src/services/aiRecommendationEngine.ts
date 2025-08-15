import { apiRequest } from './api';
import { Expert, User, Post } from '@/types/index';

export interface RecommendationScore {
  expertId: string;
  score: number;
  reasons: string[];
  specializations: string[];
}

export interface PersonalizedRecommendation {
  experts: RecommendationScore[];
  sanctuarySpaces: {
    id: string;
    topic: string;
    relevanceScore: number;
    reasons: string[];
  }[];
  content: {
    postId: string;
    relevanceScore: number;
    categories: string[];
  }[];
}

class AIRecommendationEngine {
  private userInteractionHistory: Map<string, any[]> = new Map();
  
  async getPersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendation> {
    try {
      const response = await apiRequest<PersonalizedRecommendation>('POST', '/api/ai/recommendations', { 
        userId,
        includeExperts: true,
        includeSanctuarySpaces: true,
        includeContent: true 
      });
      
      return response.data || this.getFallbackRecommendations();
    } catch (error) {
      console.error('AI Recommendation error:', error);
      return this.getFallbackRecommendations();
    }
  }

  async getSmartExpertMatching(userPost: string, userHistory: any[]): Promise<RecommendationScore[]> {
    try {
      const response = await apiRequest<RecommendationScore[]>('POST', '/api/ai/expert-matching', {
        postContent: userPost,
        userHistory,
        sentimentAnalysis: true,
        urgencyDetection: true
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Expert matching error:', error);
      return [];
    }
  }

  async analyzeUserRiskLevel(userId: string, recentPosts: Post[]): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    triggers: string[];
    recommendations: string[];
  }> {
    try {
      const response = await apiRequest('POST', '/api/ai/risk-assessment', {
        userId,
        posts: recentPosts,
        timeframe: '7d'
      });
      
      return response.data as any || {
        riskLevel: 'low' as const,
        confidence: 0.5,
        triggers: [],
        recommendations: []
      };
    } catch (error) {
      console.error('Risk assessment error:', error);
      return {
        riskLevel: 'low' as const,
        confidence: 0.5,
        triggers: [],
        recommendations: []
      };
    }
  }

  async generateSmartResponse(postContent: string, expertSpecialization: string[]): Promise<{
    suggestedResponse: string;
    tone: 'supportive' | 'professional' | 'empathetic' | 'urgent';
    keyPoints: string[];
    resources: string[];
  }> {
    try {
      const response = await apiRequest('POST', '/api/ai/smart-response', {
        content: postContent,
        specializations: expertSpecialization,
        responseType: 'expert_guidance'
      });
      
      return response.data as any || {
        suggestedResponse: '',
        tone: 'supportive' as const,
        keyPoints: [],
        resources: []
      };
    } catch (error) {
      console.error('Smart response error:', error);
      return {
        suggestedResponse: '',
        tone: 'supportive' as const,
        keyPoints: [],
        resources: []
      };
    }
  }

  async trackUserInteraction(userId: string, interaction: {
    type: 'post_view' | 'expert_view' | 'sanctuary_join' | 'session_book';
    targetId: string;
    timestamp: Date;
    metadata?: any;
  }): Promise<void> {
    const history = this.userInteractionHistory.get(userId) || [];
    history.push(interaction);
    
    // Keep only last 100 interactions
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.userInteractionHistory.set(userId, history);
    
    // Send to backend for persistent storage
    try {
      await apiRequest('POST', '/api/ai/track-interaction', { userId, interaction });
    } catch (error) {
      console.error('Interaction tracking error:', error);
    }
  }

  private getFallbackRecommendations(): PersonalizedRecommendation {
    return {
      experts: [],
      sanctuarySpaces: [],
      content: []
    };
  }

  // Crisis detection with AI
  async detectCrisisSignals(content: string): Promise<{
    isCrisis: boolean;
    confidence: number;
    urgencyLevel: 'low' | 'medium' | 'high' | 'immediate';
    suggestedActions: string[];
    resources: {
      type: 'hotline' | 'emergency' | 'professional';
      contact: string;
      description: string;
    }[];
  }> {
    try {
      const response = await apiRequest('POST', '/api/ai/crisis-detection', { content });
      
      return response.data as any || {
        isCrisis: false,
        confidence: 0,
        urgencyLevel: 'low' as const,
        suggestedActions: [],
        resources: []
      };
    } catch (error) {
      console.error('Crisis detection error:', error);
      return {
        isCrisis: false,
        confidence: 0,
        urgencyLevel: 'low' as const,
        suggestedActions: [],
        resources: []
      };
    }
  }
}

export const aiRecommendationEngine = new AIRecommendationEngine();
export default aiRecommendationEngine;
