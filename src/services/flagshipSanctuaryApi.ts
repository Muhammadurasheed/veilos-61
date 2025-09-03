import { apiRequest } from './api';
import type {
  FlagshipSanctuarySession,
  CreateFlagshipSanctuaryRequest,
  JoinFlagshipSanctuaryRequest,
  UpdateVoiceRequest,
  SendReactionRequest,
  ModerationActionRequest,
  EmergencyAlertRequest,
  ScheduleReminderRequest,
  SanctuaryAnalytics,
  FlagshipApiResponse,
  ElevenLabsVoice
} from '@/types/flagship-sanctuary';

// Flagship Sanctuary API Service - Production Grade Implementation

export const FlagshipSanctuaryApi = {
  // Session Management
  async createSession(data: CreateFlagshipSanctuaryRequest): Promise<FlagshipApiResponse<FlagshipSanctuarySession>> {
    const res = await apiRequest('POST', '/api/flagship-sanctuary/create', data);
    if (res.success && (res.data as any)?.session) {
      return { ...res, data: (res.data as any).session } as any;
    }
    return res;
  },

  async getSession(sessionId: string): Promise<FlagshipApiResponse<FlagshipSanctuarySession>> {
    const res = await apiRequest('GET', `/api/flagship-sanctuary/${sessionId}`);
    if (res.success && (res.data as any)?.session) {
      return { ...res, data: (res.data as any).session } as any;
    }
    return res;
  },

  async updateSession(sessionId: string, updates: Partial<FlagshipSanctuarySession>): Promise<FlagshipApiResponse<FlagshipSanctuarySession>> {
    return apiRequest('PUT', `/api/flagship-sanctuary/${sessionId}`, updates);
  },

  async deleteSession(sessionId: string): Promise<FlagshipApiResponse<void>> {
    return apiRequest('DELETE', `/api/flagship-sanctuary/${sessionId}`);
  },

  // Participant Management
  async joinSession(sessionId: string, data: JoinFlagshipSanctuaryRequest): Promise<FlagshipApiResponse<{
    participant: any;
    agoraToken: string;
    voiceOptions: ElevenLabsVoice[];
  }>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/join`, data);
  },

  async leaveSession(sessionId: string): Promise<FlagshipApiResponse<void>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/leave`);
  },

  async getParticipants(sessionId: string): Promise<FlagshipApiResponse<any[]>> {
    return apiRequest('GET', `/api/flagship-sanctuary/${sessionId}/participants`);
  },

  // Scheduling
  async scheduleSession(data: CreateFlagshipSanctuaryRequest): Promise<FlagshipApiResponse<FlagshipSanctuarySession>> {
    const res = await apiRequest('POST', '/api/flagship-sanctuary/schedule', data);
    if (res.success && (res.data as any)?.session) {
      return { ...res, data: (res.data as any).session } as any;
    }
    return res;
  },

  async getScheduledSessions(params?: {
    hostId?: string;
    upcoming?: boolean;
    limit?: number;
  }): Promise<FlagshipApiResponse<FlagshipSanctuarySession[]>> {
    return apiRequest('GET', '/api/flagship-sanctuary/scheduled', null, { params });
  },

  async joinViaInvite(inviteCode: string, data: JoinFlagshipSanctuaryRequest): Promise<FlagshipApiResponse<{
    session: FlagshipSanctuarySession;
    participant: any;
    agoraToken: string;
  }>> {
    return apiRequest('POST', `/api/flagship-sanctuary/join-invite/${inviteCode}`, data);
  },

  async sendReminders(sessionId: string, data: ScheduleReminderRequest): Promise<FlagshipApiResponse<void>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/reminders`, data);
  },

  // Voice Modulation
  async getAvailableVoices(): Promise<FlagshipApiResponse<ElevenLabsVoice[]>> {
    return apiRequest('GET', '/api/flagship-sanctuary/voices');
  },

  async updateVoice(sessionId: string, data: UpdateVoiceRequest): Promise<FlagshipApiResponse<void>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/voice`, data);
  },

  async processAudio(sessionId: string, audioData: Blob, voiceId?: string): Promise<FlagshipApiResponse<{
    processedAudioUrl: string;
    originalBackup?: string;
  }>> {
    const formData = new FormData();
    formData.append('audio', audioData);
    if (voiceId) formData.append('voiceId', voiceId);

    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/process-audio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Interactions
  async sendReaction(sessionId: string, data: SendReactionRequest): Promise<FlagshipApiResponse<void>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/reaction`, data);
  },

  async sendMessage(sessionId: string, content: string, type: 'text' | 'system' = 'text'): Promise<FlagshipApiResponse<void>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/message`, { content, type });
  },

  async raiseHand(sessionId: string, isRaised: boolean): Promise<FlagshipApiResponse<void>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/hand`, { isRaised });
  },

  // Moderation
  async performModerationAction(sessionId: string, data: ModerationActionRequest): Promise<FlagshipApiResponse<void>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/moderate`, data);
  },

  async sendEmergencyAlert(sessionId: string, data: EmergencyAlertRequest): Promise<FlagshipApiResponse<void>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/emergency`, data);
  },

  async getModerationLogs(sessionId: string): Promise<FlagshipApiResponse<any[]>> {
    return apiRequest('GET', `/api/flagship-sanctuary/${sessionId}/moderation-logs`);
  },

  async reportParticipant(sessionId: string, participantId: string, reason: string): Promise<FlagshipApiResponse<void>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/report`, {
      participantId,
      reason
    });
  },

  // Analytics
  async getSessionAnalytics(sessionId: string): Promise<FlagshipApiResponse<SanctuaryAnalytics>> {
    return apiRequest('GET', `/api/flagship-sanctuary/${sessionId}/analytics`);
  },

  async getHostAnalytics(hostId: string, params?: {
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<FlagshipApiResponse<{
    totalSessions: number;
    averageParticipants: number;
    averageDuration: number;
    satisfactionScore: number;
    analytics: SanctuaryAnalytics[];
  }>> {
    return apiRequest('GET', `/api/flagship-sanctuary/host/${hostId}/analytics`, null, { params });
  },

  // Discovery
  async discoverSessions(params?: {
    category?: string;
    language?: string;
    tags?: string[];
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<FlagshipApiResponse<{
    sessions: FlagshipSanctuarySession[];
    totalCount: number;
    hasMore: boolean;
  }>> {
    return apiRequest('GET', '/api/flagship-sanctuary/discover', null, { params });
  },

  async searchSessions(query: string, params?: {
    limit?: number;
    filters?: any;
  }): Promise<FlagshipApiResponse<FlagshipSanctuarySession[]>> {
    return apiRequest('POST', '/api/flagship-sanctuary/search', { query, ...params });
  },

  // Session Lifecycle
  async startSession(sessionId: string): Promise<FlagshipApiResponse<{
    agoraToken: string;
    channelName: string;
    moderationSettings: any;
  }>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/start`);
  },

  async endSession(sessionId: string, reason?: string): Promise<FlagshipApiResponse<SanctuaryAnalytics>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/end`, { reason });
  },

  async extendSession(sessionId: string, additionalMinutes: number): Promise<FlagshipApiResponse<void>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/extend`, { additionalMinutes });
  },

  // Advanced Features
  async createBreakoutRoom(sessionId: string, data: {
    name: string;
    maxParticipants?: number;
    participantIds?: string[];
  }): Promise<FlagshipApiResponse<any>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/breakout`, data);
  },

  async getRecordings(sessionId: string): Promise<FlagshipApiResponse<any[]>> {
    return apiRequest('GET', `/api/flagship-sanctuary/${sessionId}/recordings`);
  },

  async requestRecording(sessionId: string, consentRequired: boolean = true): Promise<FlagshipApiResponse<void>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/record`, { consentRequired });
  },

  async exportTranscript(sessionId: string, format: 'txt' | 'pdf' | 'json' = 'txt'): Promise<FlagshipApiResponse<{
    downloadUrl: string;
    expiresAt: string;
  }>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/transcript`, { format });
  },

  // Real-time Status
  async getRealtimeStatus(sessionId: string): Promise<FlagshipApiResponse<{
    isActive: boolean;
    participantCount: number;
    currentSpeaker?: string;
    networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
    moderationActive: boolean;
  }>> {
    return apiRequest('GET', `/api/flagship-sanctuary/${sessionId}/status`);
  },

  async updateNetworkQuality(sessionId: string, quality: {
    participantId: string;
    networkQuality: number;
    audioLatency: number;
    packetLoss: number;
  }): Promise<FlagshipApiResponse<void>> {
    return apiRequest('POST', `/api/flagship-sanctuary/${sessionId}/network-quality`, quality);
  }
};

// Legacy API compatibility for existing components
export const LiveSanctuaryApi = {
  async getSession(sessionId: string) {
    const response = await FlagshipSanctuaryApi.getSession(sessionId);
    return {
      success: response.success,
      data: {
        session: response.data,
        ...response.data
      },
      error: response.error
    };
  },

  async joinSession(sessionId: string, data: any) {
    return FlagshipSanctuaryApi.joinSession(sessionId, data);
  },

  async leaveSession(sessionId: string) {
    return FlagshipSanctuaryApi.leaveSession(sessionId);
  },

  async createSession(data: any) {
    return FlagshipSanctuaryApi.createSession(data);
  }
};