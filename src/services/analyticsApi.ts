import api from './api';

export interface ExpertMetrics {
  expertId: string;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  averageRating: number;
  totalRevenue: number;
  averageResponseTime: number;
  totalHours: number;
  sessionMetrics: SessionMetric[];
  timeframe: string;
}

export interface SessionMetric {
  id: string;
  sessionId: string;
  expertId: string;
  userId: string;
  duration: number;
  responseTime: number;
  messageCount: number;
  satisfactionScore: number;
  completed: boolean;
  revenue: number;
  category: string;
  createdAt: string;
}

export interface PlatformAnalytics {
  overview: {
    totalUsers: number;
    totalExperts: number;
    verifiedExperts: number;
    totalSessions: number;
    totalRevenue: number;
    averageRating: number;
    completionRate: number;
  };
  healthMetrics: PlatformHealthMetric[];
  timeframe: string;
}

export interface PlatformHealthMetric {
  id: string;
  date: string;
  activeUsers: number;
  activeSessions: number;
  flaggedContent: number;
  moderatedContent: number;
  serverLoad: number;
  responseTime: number;
  errorRate: number;
  uptime: number;
}

export interface ExpertRanking {
  expertId: string;
  expert: {
    name: string;
    specialization: string;
    avatarUrl?: string;
  };
  averageRating: number;
  totalSessions: number;
  totalRevenue: number;
  averageResponseTime: number;
  rank: number;
}

export interface UserSafetyAlert {
  id: string;
  userId: string;
  expertId?: string;
  sessionId?: string;
  alertType: 'crisis' | 'harassment' | 'inappropriate' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  aiConfidence: number;
  status: 'pending' | 'investigating' | 'resolved' | 'escalated';
  assignedTo?: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ContentModerationItem {
  id: string;
  contentId: string;
  contentType: 'post' | 'comment' | 'message';
  authorId: string;
  content: string;
  flagReason: string;
  flaggedBy: 'ai' | 'user' | 'expert';
  aiConfidence?: number;
  status: 'pending' | 'approved' | 'rejected' | 'appealed';
  moderatorId?: string;
  moderatorNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    responseTime: number;
    errorRate: number;
    activeConnections: number;
    throughput: number;
  };
  alerts: SystemAlert[];
  uptime: number;
  lastUpdated: string;
}

export interface SystemAlert {
  id: string;
  type: 'performance' | 'error' | 'security' | 'resource';
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  createdAt: string;
  acknowledged: boolean;
}

class AnalyticsApi {
  // Expert Analytics
  async getExpertAnalytics(expertId: string, timeframe: string = '30d'): Promise<{ success: boolean; data: ExpertMetrics }> {
    const response = await api.get(`/analytics/expert/${expertId}?timeframe=${timeframe}`);
    return response.data;
  }

  async getExpertRankings(sortBy: string = 'rating', limit: number = 10): Promise<{ success: boolean; data: ExpertRanking[] }> {
    const response = await api.get(`/analytics/rankings?sortBy=${sortBy}&limit=${limit}`);
    return response.data;
  }

  async recordSessionMetric(metric: Partial<SessionMetric>): Promise<{ success: boolean; data: SessionMetric }> {
    const response = await api.post('/analytics/session-metric', metric);
    return response.data;
  }

  // Platform Analytics
  async getPlatformAnalytics(timeframe: string = '30d'): Promise<{ success: boolean; data: PlatformAnalytics }> {
    const response = await api.get(`/analytics/platform?timeframe=${timeframe}`);
    return response.data;
  }

  async updatePlatformHealth(metrics: Partial<PlatformHealthMetric>): Promise<{ success: boolean; data: PlatformHealthMetric }> {
    const response = await api.post('/analytics/platform-health', metrics);
    return response.data;
  }

  // User Safety & Monitoring
  async getUserSafetyAlerts(status?: string): Promise<{ success: boolean; data: UserSafetyAlert[] }> {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/admin/safety-alerts${params}`);
    return response.data;
  }

  async createSafetyAlert(alert: Partial<UserSafetyAlert>): Promise<{ success: boolean; data: UserSafetyAlert }> {
    const response = await api.post('/admin/safety-alerts', alert);
    return response.data;
  }

  async updateSafetyAlert(alertId: string, updates: Partial<UserSafetyAlert>): Promise<{ success: boolean; data: UserSafetyAlert }> {
    const response = await api.patch(`/admin/safety-alerts/${alertId}`, updates);
    return response.data;
  }

  // Content Moderation
  async getModerationQueue(status?: string): Promise<{ success: boolean; data: ContentModerationItem[] }> {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/admin/moderation${params}`);
    return response.data;
  }

  async moderateContent(contentId: string, action: 'approve' | 'reject', notes?: string): Promise<{ success: boolean }> {
    const response = await api.post(`/admin/moderation/${contentId}`, { action, notes });
    return response.data;
  }

  async bulkModerationAction(contentIds: string[], action: 'approve' | 'reject'): Promise<{ success: boolean }> {
    const response = await api.post('/admin/moderation/bulk', { contentIds, action });
    return response.data;
  }

  // System Health Monitoring
  async getSystemHealth(): Promise<{ success: boolean; data: SystemHealth }> {
    const response = await api.get('/admin/system-health');
    return response.data;
  }

  async acknowledgeAlert(alertId: string): Promise<{ success: boolean }> {
    const response = await api.post(`/admin/system-alerts/${alertId}/acknowledge`);
    return response.data;
  }

  // Risk Assessment & Predictive Analytics
  async getUserRiskScore(userId: string): Promise<{ success: boolean; data: { score: number; factors: string[]; recommendations: string[] } }> {
    const response = await api.get(`/analytics/risk-assessment/${userId}`);
    return response.data;
  }

  async getPredictiveInsights(type: 'churn' | 'escalation' | 'engagement'): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/analytics/predictions/${type}`);
    return response.data;
  }

  // Revenue & Business Intelligence
  async getRevenueAnalytics(timeframe: string = '30d'): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/analytics/revenue?timeframe=${timeframe}`);
    return response.data;
  }

  async getGrowthMetrics(timeframe: string = '30d'): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/analytics/growth?timeframe=${timeframe}`);
    return response.data;
  }

  async getRetentionAnalysis(cohortType: 'weekly' | 'monthly' = 'monthly'): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/analytics/retention?cohortType=${cohortType}`);
    return response.data;
  }
}

export default new AnalyticsApi();