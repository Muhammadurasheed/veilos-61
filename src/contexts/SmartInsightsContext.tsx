import React, { createContext, useContext, useEffect, useState } from 'react';
import { aiRecommendationEngine } from '@/services/aiRecommendationEngine';
import { usePerformance } from '@/contexts/PerformanceContext';

interface SmartInsightsContextType {
  userInsights: {
    stressLevel: 'low' | 'medium' | 'high' | 'critical';
    preferredTopics: string[];
    engagementPatterns: string[];
    recommendedExperts: string[];
    riskFactors: string[];
  };
  platformInsights: {
    peakUsageHours: number[];
    popularTopics: string[];
    successfulMatchRate: number;
    averageResponseTime: number;
  };
  refreshInsights: () => Promise<void>;
  trackUserBehavior: (action: string, metadata?: any) => void;
}

const SmartInsightsContext = createContext<SmartInsightsContextType | null>(null);

export const useSmartInsights = () => {
  const context = useContext(SmartInsightsContext);
  if (!context) {
    throw new Error('useSmartInsights must be used within SmartInsightsProvider');
  }
  return context;
};

export const SmartInsightsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { trackUserInteraction } = usePerformance();
  const [userInsights, setUserInsights] = useState({
    stressLevel: 'medium' as const,
    preferredTopics: ['anxiety', 'stress management'],
    engagementPatterns: ['evening_active', 'weekend_usage'],
    recommendedExperts: ['expert-1', 'expert-2'],
    riskFactors: []
  });

  const [platformInsights, setPlatformInsights] = useState({
    peakUsageHours: [19, 20, 21], // 7-9 PM
    popularTopics: ['anxiety', 'depression', 'relationship'],
    successfulMatchRate: 0.85,
    averageResponseTime: 1200 // ms
  });

  const refreshInsights = async () => {
    try {
      // In production, this would fetch real insights from AI service
      const mockInsights = await aiRecommendationEngine.getPersonalizedRecommendations('user-123');
      
      // Update insights based on real data
      setUserInsights(prev => ({
        ...prev,
        recommendedExperts: mockInsights.experts?.map(e => e.expertId) || []
      }));
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    }
  };

  const trackUserBehavior = (action: string, metadata?: any) => {
    trackUserInteraction(action);
    
    // Advanced behavior tracking for AI learning
    aiRecommendationEngine.trackUserInteraction('user-123', {
      type: action as any,
      targetId: metadata?.targetId || 'unknown',
      timestamp: new Date(),
      metadata
    });
  };

  useEffect(() => {
    refreshInsights();
    
    // Refresh insights every 10 minutes
    const interval = setInterval(refreshInsights, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <SmartInsightsContext.Provider value={{
      userInsights,
      platformInsights,
      refreshInsights,
      trackUserBehavior
    }}>
      {children}
    </SmartInsightsContext.Provider>
  );
};

export default SmartInsightsProvider;