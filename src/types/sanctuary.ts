// Sanctuary Live Audio Types for Phase 4

export interface LiveSanctuarySession {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  hostId: string;
  hostAlias: string;
  hostToken?: string;
  agoraChannelName: string;
  agoraToken: string;
  expiresAt: string;
  isActive: boolean;
  participants: LiveParticipant[];
  maxParticipants: number;
  currentParticipants: number;
  allowAnonymous: boolean;
  audioOnly: boolean;
  moderationEnabled: boolean;
  emergencyContactEnabled: boolean;
  createdAt: string;
  startTime: string;
  isRecorded: boolean;
  recordingConsent: string[];
  breakoutRooms: BreakoutRoom[];
  moderationLevel: 'low' | 'medium' | 'high';
  emergencyProtocols: boolean;
  aiMonitoring: boolean;
  estimatedDuration?: number;
  tags: string[];
  language: string;
  status: 'waiting' | 'active' | 'ended';
}

export interface LiveParticipant {
  id: string;
  alias: string;
  isHost: boolean;
  isModerator: boolean;
  isMuted: boolean;
  isBlocked: boolean;
  handRaised: boolean;
  joinedAt: string;
  avatarIndex?: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  audioLevel: number; // 0-100
  speakingTime: number; // in seconds
}

export interface AudioRoom {
  id: string;
  sessionId: string;
  participants: LiveParticipant[];
  speakerQueue: string[]; // participant IDs
  currentSpeaker?: string;
  audioSettings: {
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
    qualityMode: 'voice' | 'music' | 'auto';
  };
  moderationSettings: {
    autoMute: boolean;
    speakerApproval: boolean;
    profanityFilter: boolean;
    emotionalTriggerDetection: boolean;
  };
}

export interface EmojiReaction {
  id: string;
  participantId: string;
  emoji: string;
  timestamp: string;
  duration: number; // in ms
}

export interface SanctuaryAlert {
  id: string;
  sessionId: string;
  type: 'emergency' | 'moderation' | 'technical' | 'wellness_check';
  participantId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  escalated: boolean;
}

export interface BreakoutRoom {
  id: string;
  parentSessionId: string;
  name: string;
  topic?: string;
  description?: string;
  createdBy: string;
  facilitatorId: string;
  agoraChannelName: string;
  agoraToken: string;
  maxParticipants: number;
  currentParticipants: number;
  isPrivate: boolean;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  expiresAt: string;
}

export interface ModerationAction {
  id: string;
  sessionId: string;
  moderatorId: string;
  targetParticipantId: string;
  action: 'mute' | 'unmute' | 'kick' | 'timeout' | 'warning' | 'block';
  reason: string;
  duration?: number; // in minutes for timeout
  timestamp: string;
  automated: boolean;
}

export interface VoiceModulation {
  enabled: boolean;
  type: 'pitch_shift' | 'formant_shift' | 'gender_neutral' | 'robotic';
  intensity: number; // 0-100
}

export interface SpeakerRequest {
  id: string;
  participantId: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  denied: boolean;
  deniedReason?: string;
}

export interface SessionRecording {
  id: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  fileUrl?: string;
  transcriptUrl?: string;
  retentionPolicy: 'delete_after_session' | 'keep_24h' | 'keep_7d' | 'keep_30d';
  processingStatus: 'recording' | 'processing' | 'completed' | 'failed' | 'deleted';
  consentGiven: boolean;
  encryptionKey: string;
}

export interface AIModerationLog {
  id: string;
  sessionId: string;
  participantId: string;
  participantAlias: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  categories: string[];
  confidence: number;
  flaggedContent: string;
  actionTaken: string;
  resolved: boolean;
  timestamp: string;
}

// API Request Types for Live Sanctuary
export interface ApiLiveSanctuaryCreateRequest {
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

export interface ApiJoinAudioRoomRequest {
  alias?: string;
  isAnonymous?: boolean;
  voiceModulation?: VoiceModulation;
}

export interface ApiModerationActionRequest {
  targetParticipantId: string;
  action: 'mute' | 'unmute' | 'kick' | 'timeout' | 'warning' | 'block';
  reason: string;
  duration?: number;
}

export interface ApiSpeakerRequestRequest {
  requestMessage?: string;
}

export interface ApiBreakoutRoomRequest {
  name: string;
  maxParticipants?: number;
  topic?: string;
  isPrivate?: boolean;
  inviteParticipants?: string[];
}

export interface ApiEmergencyAlertRequest {
  type: 'panic' | 'harassment' | 'self_harm' | 'technical_issue';
  description: string;
  severity: 'medium' | 'high' | 'critical';
}