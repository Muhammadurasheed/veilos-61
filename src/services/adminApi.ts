import { apiRequest } from './api';

// Enhanced Admin API methods
export const EnhancedAdminApi = {
  // Get experts with advanced filtering and pagination
  async getExpertsAdvanced(params: {
    page?: number;
    limit?: number;
    status?: string;
    verificationLevel?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}) {
    // Filter out placeholder values
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([key, value]) => 
        value !== undefined && 
        value !== 'all_statuses' && 
        value !== 'all_levels' &&
        value !== ''
      )
    );
    
    return apiRequest('GET', '/api/admin/experts/advanced', null, { params: filteredParams });
  },

  // Bulk actions on experts
  async bulkExpertAction(data: {
    expertIds: string[];
    action: 'approve' | 'reject' | 'suspend' | 'reactivate';
    notes?: string;
  }) {
    return apiRequest('POST', '/api/admin/experts/bulk-action', data);
  },

  // Platform analytics overview
  async getPlatformOverview(params: { timeframe?: string } = {}) {
    return apiRequest('GET', '/api/admin/analytics/platform-overview', null, { params });
  },

  // Content moderation queue
  async getModerationQueue(params: { priority?: string; type?: string } = {}) {
    return apiRequest('GET', '/api/admin/moderation/queue', null, { params });
  },

  // Crisis detection monitoring
  async getCrisisDetection() {
    return apiRequest('GET', '/api/admin/monitoring/crisis-detection');
  },

  // Live sanctuary monitoring
  async getSanctuaryMonitoring() {
    return apiRequest('GET', '/api/admin/monitoring/sanctuary-sessions');
  },

  // Expert performance analytics
  async getExpertPerformance() {
    return apiRequest('GET', '/api/admin/analytics/expert-performance');
  }
};