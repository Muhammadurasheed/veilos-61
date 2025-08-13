import axios from 'axios';

const API_BASE = process.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface LiveSanctuaryResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateLiveSanctuaryRequest {
  topic: string;
  description?: string;
  emoji?: string;
  maxParticipants?: number;
  audioOnly?: boolean;
  allowAnonymous?: boolean;
  moderationEnabled?: boolean;
  emergencyContactEnabled?: boolean;
  expireHours?: number;
}

export interface JoinAudioRoomRequest {
  alias?: string;
  isAnonymous?: boolean;
  voiceModulation?: {
    enabled: boolean;
    type: string;
    intensity: number;
  };
}

export const LiveAudioApi = {
  // Live Sanctuary Session Management
  createSession: async (data: CreateLiveSanctuaryRequest): Promise<LiveSanctuaryResponse> => {
    const response = await axios.post(`${API_BASE}/api/live-sanctuary`, data, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.data;
  },

  getSession: async (sessionId: string): Promise<LiveSanctuaryResponse> => {
    const response = await axios.get(`${API_BASE}/api/live-sanctuary/${sessionId}`);
    return response.data;
  },

  joinAudioRoom: async (sessionId: string, data: JoinAudioRoomRequest): Promise<LiveSanctuaryResponse> => {
    const response = await axios.post(`${API_BASE}/api/live-sanctuary/${sessionId}/join`, data, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.data;
  },

  leaveAudioRoom: async (sessionId: string): Promise<LiveSanctuaryResponse> => {
    const response = await axios.post(`${API_BASE}/api/live-sanctuary/${sessionId}/leave`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.data;
  },

  // Breakout Rooms
  createBreakoutRoom: async (sessionId: string, data: any): Promise<LiveSanctuaryResponse> => {
    const response = await axios.post(`${API_BASE}/api/live-sanctuary/${sessionId}/breakout`, data, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.data;
  },

  getBreakoutRooms: async (sessionId: string): Promise<LiveSanctuaryResponse> => {
    const response = await axios.get(`${API_BASE}/api/live-sanctuary/${sessionId}/breakout`);
    return response.data;
  },

  joinBreakoutRoom: async (sessionId: string, roomId: string, data: any): Promise<LiveSanctuaryResponse> => {
    const response = await axios.post(`${API_BASE}/api/live-sanctuary/${sessionId}/breakout/${roomId}/join`, data, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.data;
  },

  leaveBreakoutRoom: async (sessionId: string, roomId: string): Promise<LiveSanctuaryResponse> => {
    const response = await axios.post(`${API_BASE}/api/live-sanctuary/${sessionId}/breakout/${roomId}/leave`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.data;
  },

  closeBreakoutRoom: async (sessionId: string, roomId: string): Promise<LiveSanctuaryResponse> => {
    const response = await axios.post(`${API_BASE}/api/live-sanctuary/${sessionId}/breakout/${roomId}/close`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.data;
  },

  // Recording Management
  startRecording: async (sessionId: string, options: any): Promise<LiveSanctuaryResponse> => {
    const response = await axios.post(`${API_BASE}/api/live-sanctuary/${sessionId}/recording/start`, options, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.data;
  },

  stopRecording: async (sessionId: string): Promise<LiveSanctuaryResponse> => {
    const response = await axios.post(`${API_BASE}/api/live-sanctuary/${sessionId}/recording/stop`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.data;
  },

  giveRecordingConsent: async (sessionId: string, data: any): Promise<LiveSanctuaryResponse> => {
    const response = await axios.post(`${API_BASE}/api/live-sanctuary/${sessionId}/recording/consent`, data, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.data;
  },

  // AI Moderation
  getModerationAnalytics: async (sessionId: string): Promise<LiveSanctuaryResponse> => {
    const response = await axios.get(`${API_BASE}/api/live-sanctuary/${sessionId}/moderation/analytics`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.data;
  },

  logModerationEvent: async (sessionId: string, data: any): Promise<LiveSanctuaryResponse> => {
    const response = await axios.post(`${API_BASE}/api/live-sanctuary/${sessionId}/moderation/log`, data, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.data;
  },

  takeModerationAction: async (sessionId: string, data: any): Promise<LiveSanctuaryResponse> => {
    const response = await axios.post(`${API_BASE}/api/live-sanctuary/${sessionId}/moderation/action`, data, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.data;
  },

  // Emergency Alerts
  sendEmergencyAlert: async (sessionId: string, data: any): Promise<LiveSanctuaryResponse> => {
    const response = await axios.post(`${API_BASE}/api/live-sanctuary/${sessionId}/emergency`, data, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.data;
  }
};