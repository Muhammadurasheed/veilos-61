import { logger } from './logger';
import { apiRequest } from './api';

export interface AudioTranscriptionResult {
  transcription: string;
  confidence: number;
  crisisAnalysis?: {
    isCrisis: boolean;
    severity: 'none' | 'mild' | 'moderate' | 'high' | 'critical';
    confidence: number;
    triggers: Array<{
      type: string;
      keywords: string[];
      contextScore: number;
    }>;
  };
  actionRequired: boolean;
  timestamp: Date;
}

export interface AudioAnalysisConfig {
  enableCrisisDetection: boolean;
  sensitivity: 'low' | 'medium' | 'high' | 'maximum';
  realTimeProcessing: boolean;
  bufferSize: number;
  sampleRate: number;
}

class AudioTranscriptionService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private isRecording = false;
  private audioBuffer: Blob[] = [];
  private processingQueue: Promise<void> = Promise.resolve();
  private config: AudioAnalysisConfig = {
    enableCrisisDetection: true,
    sensitivity: 'high',
    realTimeProcessing: true,
    bufferSize: 4096,
    sampleRate: 16000
  };

  async initialize(userMediaStream: MediaStream, config?: Partial<AudioAnalysisConfig>): Promise<void> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Initialize Web Audio API for advanced audio processing
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });

      // Setup MediaRecorder for audio capture
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };

      this.mediaRecorder = new MediaRecorder(userMediaStream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioBuffer.push(event.data);
          
          // Process audio chunks in real-time if enabled
          if (this.config.realTimeProcessing) {
            this.processingQueue = this.processingQueue.then(async () => {
              await this.processAudioChunk(event.data);
            });
          }
        }
      };

      this.mediaRecorder.onerror = (error) => {
        logger.error('MediaRecorder error:', error);
      };

      logger.info('Audio transcription service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize audio transcription service:', error);
      throw new Error('Audio transcription initialization failed');
    }
  }

  async startRecording(sessionId: string, participantId: string): Promise<void> {
    if (!this.mediaRecorder) {
      throw new Error('Audio transcription service not initialized');
    }

    if (this.isRecording) {
      logger.warn('Recording already in progress');
      return;
    }

    try {
      this.audioBuffer = [];
      this.isRecording = true;
      
      // Start recording with 5-second chunks for real-time processing
      this.mediaRecorder.start(5000);
      
      logger.info('Audio recording started', { sessionId, participantId });
    } catch (error) {
      this.isRecording = false;
      logger.error('Failed to start audio recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<AudioTranscriptionResult[]> {
    if (!this.mediaRecorder || !this.isRecording) {
      return [];
    }

    try {
      return new Promise((resolve, reject) => {
        const results: AudioTranscriptionResult[] = [];
        
        this.mediaRecorder!.onstop = async () => {
          try {
            // Wait for all pending audio processing to complete
            await this.processingQueue;
            
            // Process final audio buffer if any remaining
            if (this.audioBuffer.length > 0) {
              const finalBlob = new Blob(this.audioBuffer, { type: 'audio/webm' });
              const finalResult = await this.processAudioChunk(finalBlob);
              if (finalResult) {
                results.push(finalResult);
              }
            }

            this.isRecording = false;
            this.audioBuffer = [];
            resolve(results);
          } catch (error) {
            reject(error);
          }
        };

        this.mediaRecorder!.stop();
      });
    } catch (error) {
      this.isRecording = false;
      logger.error('Failed to stop audio recording:', error);
      throw error;
    }
  }

  private async processAudioChunk(audioBlob: Blob): Promise<AudioTranscriptionResult | null> {
    try {
      // Convert audio blob to base64 for API transmission
      const audioBase64 = await this.blobToBase64(audioBlob);
      
      // Send to backend for transcription and analysis
      const response = await apiRequest<{
        transcription: string;
        crisisAnalysis: any;
        actionRequired: boolean;
      }>('POST', '/api/ai/audio-transcription', {
        audioData: audioBase64,
        sessionId: 'current-session', // TODO: Get from context
        participantId: 'current-user' // TODO: Get from context
      });

      const result: AudioTranscriptionResult = {
        transcription: response.data?.transcription || '',
        confidence: 0.85, // TODO: Get from actual transcription service
        crisisAnalysis: response.data?.crisisAnalysis,
        actionRequired: response.data?.actionRequired || false,
        timestamp: new Date()
      };

      // Log significant transcriptions
      if (result.transcription && result.transcription.length > 10) {
        logger.info('Audio transcription processed', {
          transcriptionLength: result.transcription.length,
          crisisDetected: result.crisisAnalysis?.isCrisis || false,
          actionRequired: result.actionRequired
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to process audio chunk:', error);
      return null;
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Real-time audio analysis without transcription (for performance)
  async analyzeAudioFeatures(audioData: Float32Array): Promise<{
    volumeLevel: number;
    emotionalMarkers: string[];
    speechActivity: boolean;
    distressIndicators: number;
  }> {
    try {
      // Calculate volume level (RMS)
      const volumeLevel = this.calculateRMS(audioData);
      
      // Basic speech activity detection
      const speechActivity = volumeLevel > 0.01;
      
      // Simple distress indicators based on audio characteristics
      const distressIndicators = this.analyzeDistressIndicators(audioData);
      
      // Basic emotional markers (simplified)
      const emotionalMarkers = this.identifyEmotionalMarkers(audioData, volumeLevel);

      return {
        volumeLevel,
        emotionalMarkers,
        speechActivity,
        distressIndicators
      };
    } catch (error) {
      logger.error('Failed to analyze audio features:', error);
      return {
        volumeLevel: 0,
        emotionalMarkers: [],
        speechActivity: false,
        distressIndicators: 0
      };
    }
  }

  private calculateRMS(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  private analyzeDistressIndicators(audioData: Float32Array): number {
    // Simplified distress analysis based on audio characteristics
    const rms = this.calculateRMS(audioData);
    const variability = this.calculateVariability(audioData);
    
    // High variability + certain volume ranges can indicate distress
    let distressScore = 0;
    
    if (variability > 0.5) distressScore += 0.3;
    if (rms > 0.8 || rms < 0.1) distressScore += 0.2;
    
    return Math.min(distressScore, 1.0);
  }

  private calculateVariability(audioData: Float32Array): number {
    const mean = audioData.reduce((sum, val) => sum + Math.abs(val), 0) / audioData.length;
    const variance = audioData.reduce((sum, val) => sum + Math.pow(Math.abs(val) - mean, 2), 0) / audioData.length;
    return Math.sqrt(variance);
  }

  private identifyEmotionalMarkers(audioData: Float32Array, volumeLevel: number): string[] {
    const markers: string[] = [];
    
    // Simplified emotional marker detection
    if (volumeLevel > 0.7) markers.push('high_intensity');
    if (volumeLevel < 0.2) markers.push('low_energy');
    
    const variability = this.calculateVariability(audioData);
    if (variability > 0.6) markers.push('emotional_variability');
    if (variability < 0.1) markers.push('monotone');
    
    return markers;
  }

  // Update configuration during runtime
  updateConfig(newConfig: Partial<AudioAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Audio transcription config updated', newConfig);
  }

  // Get current recording status
  getStatus(): {
    isRecording: boolean;
    isInitialized: boolean;
    config: AudioAnalysisConfig;
    bufferSize: number;
  } {
    return {
      isRecording: this.isRecording,
      isInitialized: !!this.mediaRecorder && !!this.audioContext,
      config: this.config,
      bufferSize: this.audioBuffer.length
    };
  }

  // Cleanup resources
  cleanup(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.mediaRecorder = null;
    this.audioContext = null;
    this.isRecording = false;
    this.audioBuffer = [];
    
    logger.info('Audio transcription service cleaned up');
  }
}

export const audioTranscriptionService = new AudioTranscriptionService();
export default audioTranscriptionService;