import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Square, 
  Pause, 
  Download, 
  Shield, 
  Clock, 
  FileAudio, 
  Users, 
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  FileText,
  Lock
} from 'lucide-react';
import { SessionRecording } from '@/types/sanctuary';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionRecorderProps {
  sessionId: string;
  sessionType: 'sanctuary' | 'breakout' | 'private' | 'live-sanctuary';
  isHost: boolean;
  participantCount?: number;
  onConsentRequest?: () => void;
}

interface RecordingState {
  isRecording: boolean;
  duration: number;
  status: 'idle' | 'recording' | 'processing' | 'completed' | 'failed';
  fileSize?: number;
  recordingId?: string;
}

const SessionRecorder = ({ sessionId, sessionType, isHost, participantCount, onConsentRequest }: SessionRecorderProps) => {
  const { toast } = useToast();
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    duration: 0,
    status: 'idle'
  });
  const [recordings, setRecordings] = useState<SessionRecording[]>([]);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [retentionPolicy, setRetentionPolicy] = useState<'delete_after_session' | 'keep_24h' | 'keep_7d' | 'keep_30d'>('delete_after_session');
  const [recordingType, setRecordingType] = useState<'audio_only' | 'audio_with_transcript'>('audio_only');
  const [autoTranscribe, setAutoTranscribe] = useState(true);

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (recordingState.isRecording) {
      interval = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingState.isRecording]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    if (!isHost) {
      toast({
        title: "Permission denied",
        description: "Only hosts can start recording",
        variant: "destructive"
      });
      return;
    }

    // Show consent dialog first
    setShowConsentDialog(true);
  }, [isHost, toast]);

  const confirmStartRecording = useCallback(async () => {
    try {
      const response = await fetch(`/api/live-sanctuary/${sessionId}/recording/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          sessionType,
          recordingType: autoTranscribe ? 'audio_with_transcript' : 'audio_only',
          retentionPolicy
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setRecordingState({
          isRecording: true,
          duration: 0,
          status: 'recording',
          recordingId: result.data.recordingId
        });
        
        setShowConsentDialog(false);
        
        toast({
          title: "Recording started",
          description: "Session is now being recorded with participant consent",
        });

        // Trigger consent collection from participants
        onConsentRequest?.();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Start recording error:', error);
      toast({
        title: "Failed to start recording",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  }, [sessionId, sessionType, retentionPolicy, autoTranscribe, toast, onConsentRequest]);

  const stopRecording = useCallback(async () => {
    if (!recordingState.recordingId) return;

    try {
      const response = await fetch(`/api/live-sanctuary/${sessionId}/recording/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setRecordingState({
          isRecording: false,
          duration: recordingState.duration,
          status: 'processing',
          recordingId: recordingState.recordingId
        });
        
        toast({
          title: "Recording stopped",
          description: "Processing audio file and generating transcript...",
        });
        
        // Refresh recordings list
        fetchRecordings();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      toast({
        title: "Failed to stop recording",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  }, [recordingState, sessionId, toast]);

  const giveConsent = useCallback(async (consent: boolean) => {
    try {
      const response = await fetch(`/api/live-sanctuary/${sessionId}/recording/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          consentGiven: consent,
          alias: 'Current User'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setConsentGiven(consent);
        toast({
          title: consent ? "Consent given" : "Consent withdrawn",
          description: consent 
            ? "Your audio will be included in the recording" 
            : "Your audio will be excluded from the recording",
        });
      }
    } catch (error) {
      console.error('Consent error:', error);
      toast({
        title: "Failed to update consent",
        description: "Please try again",
        variant: "destructive"
      });
    }
  }, [sessionId, toast]);

  const fetchRecordings = useCallback(async () => {
    try {
      const response = await fetch(`/api/live-sanctuary/${sessionId}/recordings`);
      const result = await response.json();
      
      if (result.success) {
        setRecordings(result.data);
      }
    } catch (error) {
      console.error('Fetch recordings error:', error);
    }
  }, [sessionId]);

  const downloadRecording = useCallback(async (recordingId: string) => {
    try {
      // In production, this would generate a secure download URL
      const response = await fetch(`/api/recordings/${recordingId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sanctuary-recording-${recordingId}.mp3`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Unable to download recording",
        variant: "destructive"
      });
    }
  }, [toast]);

  return (
    <Card className="glass shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <FileAudio className="h-5 w-5 mr-2" />
            Session Recording
          </CardTitle>
          <Badge variant={recordingState.isRecording ? "destructive" : "secondary"}>
            {recordingState.status}
          </Badge>
        </div>
        <CardDescription>
          {recordingState.isRecording 
            ? `Recording in progress: ${formatDuration(recordingState.duration)}`
            : "Secure audio recording with privacy controls"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Recording Controls */}
        <div className="flex items-center justify-center space-x-4">
          {!recordingState.isRecording ? (
            <Button
              onClick={startRecording}
              disabled={!isHost}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
          )}
          
          {!isHost && recordingState.isRecording && (
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => giveConsent(!consentGiven)}
                variant={consentGiven ? "default" : "outline"}
                size="sm"
              >
                {consentGiven ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                {consentGiven ? 'Included' : 'Excluded'}
              </Button>
            </div>
          )}
        </div>

        {/* Live Recording Indicator */}
        {recordingState.isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                <span className="font-medium text-red-800">Recording Live</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-red-700">
                <span>{formatDuration(recordingState.duration)}</span>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {participantCount} participants
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recording Settings */}
        {isHost && !recordingState.isRecording && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800">Recording Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Retention Policy</label>
                <select
                  value={retentionPolicy}
                  onChange={(e) => setRetentionPolicy(e.target.value as any)}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="delete_after_session">Delete after session</option>
                  <option value="keep_24h">Keep 24 hours</option>
                  <option value="keep_7d">Keep 7 days</option>
                  <option value="keep_30d">Keep 30 days</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <Switch
                    checked={autoTranscribe}
                    onCheckedChange={setAutoTranscribe}
                  />
                  <span className="text-sm">Auto-transcribe</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Privacy Protection</p>
              <p>All recordings are encrypted and require explicit consent. Participants can opt out at any time.</p>
            </div>
          </div>
        </div>

        {/* Previous Recordings */}
        {recordings.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Previous Recordings</h3>
            <div className="space-y-2">
              {recordings.map((recording) => (
                <div key={recording.id} className="p-3 border rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileAudio className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(recording.startTime).toLocaleDateString()} Recording
                      </p>
                      <p className="text-xs text-gray-500">
                        {recording.duration && formatDuration(recording.duration)} • {recording.processingStatus}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {recording.transcriptUrl && (
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-1" />
                        Transcript
                      </Button>
                    )}
                    {recording.processingStatus === 'completed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadRecording(recording.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Recording Consent Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Recording Consent Required
            </DialogTitle>
            <DialogDescription>
              This will start recording the audio session. All participants will be notified and can choose whether to include their audio.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">Recording Details:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Type: {autoTranscribe ? 'Audio with transcript' : 'Audio only'}</li>
                <li>• Retention: {retentionPolicy.replace('_', ' ')}</li>
                <li>• Participants: {participantCount} people will be notified</li>
                <li>• Privacy: End-to-end encrypted, consent-based</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConsentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStartRecording} className="bg-red-600 hover:bg-red-700">
              Start Recording
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SessionRecorder;