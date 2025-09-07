// Flagship Sanctuary Types - Complete Type System

export interface FlagshipSanctuarySession {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  
  // Host Information
  hostId: string;
  hostAlias: string;
  hostToken?: string;
  
  // Session Configuration
  maxParticipants: number;
  allowAnonymous: boolean;
  audioOnly: boolean;
  moderationEnabled: boolean;
  emergencyContactEnabled: boolean;
  recordingEnabled: boolean;
  voiceModulationEnabled: boolean;
  requireApproval: boolean;
  
  // Scheduling
  scheduledDateTime?: string;
  duration?: number; // in minutes
  timezone?: string;
  accessType: 'public' | 'invite_only' | 'link_only';
  invitationCode?: string;
  invitationLink?: string;
  
  // Session State  
  status: 'pending' | 'active' | 'ended' | 'scheduled' | 'waiting' | 'live' | 'completed' | 'cancelled';
  actualStartTime?: string;
  actualEndTime?: string;
  
  // Participants
  participants: FlagshipParticipant[];
  participantCount: number;
  preRegisteredParticipants: PreRegisteredParticipant[];
  waitingList: WaitingListEntry[];
  
  // Agora Configuration
  agoraChannelName: string;
  agoraToken?: string;
  
  // Voice Modulation
  availableVoices: ElevenLabsVoice[];
  voiceSettings: VoiceSettings;
  
  // AI Moderation
  moderationLevel: 'low' | 'medium' | 'high' | 'strict';
  aiModerationEnabled: boolean;
  emergencyProtocols: EmergencyProtocol[];
  
  // Session Metadata
  tags: string[];
  category: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  
  // Analytics
  metrics: SessionMetrics;
}

export interface FlagshipParticipant {
  id: string;
  alias: string;
  isHost: boolean;
  isModerator: boolean;
  isAnonymous: boolean;
  
  // Audio State
  isMuted: boolean;
  isDeafened: boolean;
  handRaised: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  
  // Voice Modulation
  selectedVoiceId?: string;
  voiceSettings?: ParticipantVoiceSettings;
  originalVoiceProfile?: string;
  
  // Session Data
  joinedAt: string;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
  speakingTime: number;
  messageCount: number;
  
  // Moderation
  warnings: number;
  isBanned: boolean;
  moderationFlags: ModerationFlag[];
  
  // UI State
  avatarIndex?: number;
  reactions: EmojiReaction[];
}

export interface PreRegisteredParticipant {
  id: string;
  alias: string;
  email?: string;
  registeredAt: string;
  approved: boolean;
  reminded: boolean;
  remindersSent: string[];
}

export interface WaitingListEntry {
  id: string;
  alias: string;
  requestedAt: string;
  message?: string;
  priority: 'normal' | 'high' | 'urgent';
}

export interface ElevenLabsVoice {
  voiceId: string;
  name: string;
  category: 'male' | 'female' | 'child' | 'elderly' | 'robotic';
  previewUrl?: string;
  description?: string;
  settings?: ElevenLabsVoiceSettings;
}

export interface VoiceSettings {
  enabled: boolean;
  defaultVoiceId: string;
  allowParticipantChoice: boolean;
  voiceChangeInterval?: number; // in seconds
  fallbackToOriginal: boolean;
}

export interface ParticipantVoiceSettings {
  voiceId: string;
  stability: number; // 0-1
  similarityBoost: number; // 0-1
  style: number; // 0-1
  useSpeakerBoost: boolean;
}

export interface ElevenLabsVoiceSettings {
  stability: number;
  similarityBoost: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface EmergencyProtocol {
  type: 'self_harm' | 'violence' | 'abuse' | 'crisis' | 'medical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoResponse: boolean;
  contactInfo: string[];
  escalationSteps: string[];
}

export interface ModerationFlag {
  id: string;
  type: 'inappropriate_language' | 'harassment' | 'spam' | 'self_harm' | 'violence';
  severity: 'low' | 'medium' | 'high';
  content: string;
  timestamp: string;
  aiConfidence: number;
  humanReviewed: boolean;
  action: 'warning' | 'mute' | 'kick' | 'ban' | 'escalate';
}

export interface EmojiReaction {
  emoji: string;
  timestamp: string;
  ttl: number; // time to live in ms
}

export interface SessionMetrics {
  totalJoins: number;
  peakParticipants: number;
  averageStayDuration: number; // in minutes
  messagesCount: number;
  reactionsCount: number;
  voiceModulationUsage: number;
  moderationInterventions: number;
  emergencyAlerts: number;
  networkQualityAverage: number;
  audioQualityScore: number;
}

// API Request/Response Types

export interface CreateFlagshipSanctuaryRequest {
  topic: string;
  description?: string;
  emoji?: string;
  
  // Configuration
  maxParticipants?: number;
  allowAnonymous?: boolean;
  audioOnly?: boolean;
  moderationEnabled?: boolean;
  emergencyContactEnabled?: boolean;
  recordingEnabled?: boolean;
  voiceModulationEnabled?: boolean;
  
  // Scheduling
  scheduledDateTime?: string;
  duration?: number;
  timezone?: string;
  accessType?: 'public' | 'invite_only' | 'link_only';
  
  // Settings
  moderationLevel?: 'low' | 'medium' | 'high' | 'strict';
  tags?: string[];
  category?: string;
  language?: string;
}

export interface JoinFlagshipSanctuaryRequest {
  alias?: string;
  isAnonymous?: boolean;
  invitationCode?: string;
  voicePreference?: string;
  acknowledgement?: boolean;
  acknowledged?: boolean;
  participantId?: string;
}

export interface UpdateVoiceRequest {
  voiceId: string;
  settings?: ParticipantVoiceSettings;
}

export interface SendReactionRequest {
  emoji: string;
  targetParticipant?: string;
}

export interface ModerationActionRequest {
  targetParticipantId: string;
  action: 'warn' | 'mute' | 'kick' | 'ban';
  reason: string;
  duration?: number; // in minutes for temporary actions
}

export interface EmergencyAlertRequest {
  type: 'self_harm' | 'violence' | 'abuse' | 'crisis' | 'medical';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  anonymous: boolean;
}

export interface ScheduleReminderRequest {
  participantIds: string[];
  reminderType: '1_day' | '1_hour' | '15_min';
  customMessage?: string;
}

// Socket Events

export interface SocketEvents {
  // Connection Events
  'sanctuary:join': { sessionId: string; participant: FlagshipParticipant };
  'sanctuary:leave': { sessionId: string; participantId: string };
  'sanctuary:participant_joined': { participant: FlagshipParticipant };
  'sanctuary:participant_left': { participantId: string; alias: string };
  
  // Audio Events
  'sanctuary:audio_state_changed': { participantId: string; isMuted: boolean; audioLevel: number };
  'sanctuary:voice_changed': { participantId: string; voiceId: string };
  'sanctuary:speaking_started': { participantId: string };
  'sanctuary:speaking_ended': { participantId: string };
  
  // Interaction Events
  'sanctuary:hand_raised': { participantId: string; isRaised: boolean };
  'sanctuary:reaction_sent': { participantId: string; emoji: string; timestamp: string };
  'sanctuary:message_sent': { participantId: string; content: string; timestamp: string };
  
  // Moderation Events
  'sanctuary:participant_muted': { participantId: string; mutedBy: string; reason?: string };
  'sanctuary:participant_kicked': { participantId: string; kickedBy: string; reason: string };
  'sanctuary:moderation_flag': { participantId: string; flag: ModerationFlag };
  'sanctuary:emergency_alert': { alert: EmergencyAlertRequest; fromParticipant: string };
  
  // Host Events
  'sanctuary:promoted_to_speaker': { participantId: string; promotedBy: string };
  'sanctuary:host_action': { action: string; targetId?: string; data?: any };
  'sanctuary:session_updated': { updates: Partial<FlagshipSanctuarySession> };
  
  // System Events
  'sanctuary:session_started': { sessionId: string; actualStartTime: string };
  'sanctuary:session_ending': { sessionId: string; timeRemaining: number };
  'sanctuary:session_ended': { sessionId: string; endReason: string };
  'sanctuary:technical_error': { error: string; participantId?: string };
}

// Analytics Types

export interface SanctuaryAnalytics {
  sessionId: string;
  totalDuration: number;
  participantMetrics: ParticipantMetrics[];
  audioMetrics: AudioMetrics;
  moderationMetrics: ModerationMetrics;
  voiceModulationMetrics: VoiceModulationMetrics;
  engagementMetrics: EngagementMetrics;
}

export interface ParticipantMetrics {
  participantId: string;
  joinTime: string;
  leaveTime?: string;
  totalSpeakingTime: number;
  messagesSent: number;
  reactionsGiven: number;
  voiceChanges: number;
  moderationWarnings: number;
  networkQualityAverage: number;
}

export interface AudioMetrics {
  averageAudioQuality: number;
  totalSpeakingTime: number;
  silencePercentage: number;
  backgroundNoiseLevel: number;
  audioDropouts: number;
  latencyAverage: number;
}

export interface ModerationMetrics {
  totalFlags: number;
  flagsByType: Record<string, number>;
  actionsPerformed: number;
  emergencyAlerts: number;
  falsePositives: number;
  averageResponseTime: number;
}

export interface VoiceModulationMetrics {
  totalUsers: number;
  voiceChangeFrequency: number;
  popularVoices: Record<string, number>;
  processingLatency: number;
  failureRate: number;
}

export interface EngagementMetrics {
  averageStayDuration: number;
  participantTurnover: number;
  messageFrequency: number;
  reactionFrequency: number;
  handRaiseFrequency: number;
  peakConcurrentUsers: number;
}

// Error Types

export interface FlagshipSanctuaryError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  sessionId?: string;
  participantId?: string;
}

// API Response Types

export interface FlagshipApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}