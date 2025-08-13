import { apiRequest } from './api';

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
  async getExpertAnalytics(expertId: string, timeframe: string = '30d') {
    return await apiRequest('GET', `/analytics/expert/${expertId}?timeframe=${timeframe}`);
  }

  async getExpertRankings(sortBy: string = 'rating', limit: number = 10) {
    return await apiRequest('GET', `/analytics/rankings?sortBy=${sortBy}&limit=${limit}`);
  }

  async recordSessionMetric(metric: Partial<SessionMetric>) {
    return await apiRequest('POST', '/analytics/session-metric', metric);
  }

  // Platform Analytics
  async getPlatformAnalytics(timeframe: string = '30d') {
    return await apiRequest('GET', `/analytics/platform?timeframe=${timeframe}`);
  }

  async updatePlatformHealth(metrics: Partial<PlatformHealthMetric>) {
    return await apiRequest('POST', '/analytics/platform-health', metrics);
  }

  // User Safety & Monitoring
  async getUserSafetyAlerts(status?: string) {
    const params = status ? `?status=${status}` : '';
    return await apiRequest('GET', `/admin/safety-alerts${params}`);
  }

  async createSafetyAlert(alert: Partial<UserSafetyAlert>) {
    return await apiRequest('POST', '/admin/safety-alerts', alert);
  }

  async updateSafetyAlert(alertId: string, updates: Partial<UserSafetyAlert>) {
    return await apiRequest('PATCH', `/admin/safety-alerts/${alertId}`, updates);
  }

  // Content Moderation
  async getModerationQueue(status?: string) {
    const params = status ? `?status=${status}` : '';
    return await apiRequest('GET', `/admin/moderation${params}`);
  }

  async moderateContent(contentId: string, action: 'approve' | 'reject', notes?: string) {
    return await apiRequest('POST', `/admin/moderation/${contentId}`, { action, notes });
  }

  async bulkModerationAction(contentIds: string[], action: 'approve' | 'reject') {
    return await apiRequest('POST', '/admin/moderation/bulk', { contentIds, action });
  }

  // System Health Monitoring
  async getSystemHealth() {
    return await apiRequest('GET', '/admin/system-health');
  }

  async acknowledgeAlert(alertId: string) {
    return await apiRequest('POST', `/admin/system-alerts/${alertId}/acknowledge`);
  }

  // Risk Assessment & Predictive Analytics
  async getUserRiskScore(userId: string) {
    return await apiRequest('GET', `/analytics/risk-assessment/${userId}`);
  }

  async getPredictiveInsights(type: 'churn' | 'escalation' | 'engagement') {
    return await apiRequest('GET', `/analytics/predictions/${type}`);
  }

  // Revenue & Business Intelligence
  async getRevenueAnalytics(timeframe: string = '30d') {
    return await apiRequest('GET', `/analytics/revenue?timeframe=${timeframe}`);
  }

  async getGrowthMetrics(timeframe: string = '30d') {
    return await apiRequest('GET', `/analytics/growth?timeframe=${timeframe}`);
  }

  async getRetentionAnalysis(cohortType: 'weekly' | 'monthly' = 'monthly') {
    return await apiRequest('GET', `/analytics/retention?cohortType=${cohortType}`);
  }
}

export default new AnalyticsApi();