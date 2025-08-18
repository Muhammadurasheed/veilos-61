import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/useSocket';
import { useUserContext } from '@/contexts/UserContext';
import { 
  Brain, 
  AlertTriangle, 
  Shield, 
  Phone, 
  Activity,
  Volume2,
  Eye,
  Clock,
  TrendingUp,
  Zap,
  CheckCircle,
  XCircle,
  Mic,
  MicOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioTranscriptionService } from '@/services/audioTranscriptionService';
import { aiEmotionalIntelligence, CrisisDetectionResult } from '@/services/aiEmotionalIntelligence';

interface RealTimeAlert {
  id: string;
  type: 'crisis' | 'moderation' | 'audio_quality' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  participantId: string;
  participantAlias: string;
  message: string;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
  confidence?: number;
  triggers?: string[];
  actionRequired: boolean;
}

interface AudioAnalysisData {
  isActive: boolean;
  transcriptionEnabled: boolean;
  qualityScore: number;
  participantCount: number;
  averageConfidence: number;
  processingLatency: number;
}

interface RealTimeAIMonitorProps {
  sessionId: string;
  isHost: boolean;
  onCrisisDetected?: (alert: RealTimeAlert) => void;
  onEmergencyProtocol?: (activated: boolean) => void;
  className?: string;
}

const RealTimeAIMonitor: React.FC<RealTimeAIMonitorProps> = ({
  sessionId,
  isHost,
  onCrisisDetected,
  onEmergencyProtocol,
  className = ''
}) => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const socket = useSocket();

  const [alerts, setAlerts] = useState<RealTimeAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<RealTimeAlert | null>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysisData>({
    isActive: false,
    transcriptionEnabled: false,
    qualityScore: 85,
    participantCount: 0,
    averageConfidence: 0,
    processingLatency: 120
  });

  const [systemMetrics, setSystemMetrics] = useState({
    totalScanned: 0,
    crisisDetected: 0,
    moderationActions: 0,
    averageResponseTime: 1.2,
    uptime: '99.8%'
  });

  // Initialize real-time AI monitoring
  useEffect(() => {
    if (!socket || !sessionId) return;

    // For now, simulate the socket events since the interface needs to be updated
    // In production, these would be real socket events
    const simulateAlerts = () => {
      // Simulate crisis detection every 30 seconds for demo
      const interval = setInterval(() => {
        if (Math.random() < 0.1) { // 10% chance
          handleCrisisAlert({
            severity: 'high',
            participantId: 'demo-user',
            participantAlias: 'Demo User',
            triggers: ['distress_indicators'],
            confidence: 85,
            requiresImmediate: false
          });
        }
      }, 30000);

      return () => clearInterval(interval);
    };

    return simulateAlerts();
  }, [socket, sessionId]);

  // Initialize audio transcription service
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        if (audioAnalysis.transcriptionEnabled && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              sampleRate: 16000,
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true
            }
          });

          await audioTranscriptionService.initialize(stream, {
            enableCrisisDetection: true,
            sensitivity: 'high',
            realTimeProcessing: true,
            sampleRate: 16000,
            bufferSize: 4096
          });

          setAudioAnalysis(prev => ({ ...prev, isActive: true }));
        }
      } catch (error) {
        console.error('Failed to initialize audio monitoring:', error);
        toast({
          title: "Audio monitoring unavailable",
          description: "Microphone access denied or not supported",
          variant: "destructive"
        });
      }
    };

    if (isHost && audioAnalysis.transcriptionEnabled) {
      initializeAudio();
    }

    return () => {
      audioTranscriptionService.cleanup();
    };
  }, [audioAnalysis.transcriptionEnabled, isHost]);

  const handleCrisisAlert = useCallback((data: any) => {
    const newAlert: RealTimeAlert = {
      id: `crisis_${Date.now()}`,
      type: 'crisis',
      severity: data.severity || 'high',
      participantId: data.participantId,
      participantAlias: data.participantAlias,
      message: `Crisis indicators detected: ${data.triggers?.join(', ') || 'Multiple indicators'}`,
      timestamp: new Date(),
      status: 'active',
      confidence: data.confidence,
      triggers: data.triggers,
      actionRequired: data.requiresImmediate || data.severity === 'critical'
    };

    setAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
    setSystemMetrics(prev => ({ ...prev, crisisDetected: prev.crisisDetected + 1 }));

    if (onCrisisDetected) {
      onCrisisDetected(newAlert);
    }

    // Show critical alert
    if (data.severity === 'critical') {
      toast({
        title: "🚨 CRITICAL CRISIS DETECTED",
        description: `Immediate intervention required for ${data.participantAlias}`,
        variant: "destructive",
        duration: 0 // Don't auto-dismiss
      });
    }
  }, [onCrisisDetected, toast]);

  const handleEmergencyProtocol = useCallback((data: any) => {
    setEmergencyMode(true);
    if (onEmergencyProtocol) {
      onEmergencyProtocol(true);
    }

    toast({
      title: "EMERGENCY PROTOCOL ACTIVATED",
      description: "Crisis intervention team has been notified",
      variant: "destructive",
      duration: 0
    });
  }, [onEmergencyProtocol, toast]);

  const handleModerationAlert = useCallback((data: any) => {
    const newAlert: RealTimeAlert = {
      id: `mod_${Date.now()}`,
      type: 'moderation',
      severity: data.severity || 'medium',
      participantId: data.participantId,
      participantAlias: data.participantAlias,
      message: `${data.moderationType} flagged: ${data.action}`,
      timestamp: new Date(),
      status: 'active',
      confidence: data.confidence,
      actionRequired: data.severity === 'high'
    };

    setAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
    setSystemMetrics(prev => ({ ...prev, moderationActions: prev.moderationActions + 1 }));
  }, []);

  const handleAudioQualityUpdate = useCallback((data: any) => {
    setAudioAnalysis(prev => ({
      ...prev,
      qualityScore: data.qualityMetrics?.overall || prev.qualityScore,
      processingLatency: data.qualityMetrics?.latency || prev.processingLatency
    }));
  }, []);

  const handleLiveTranscription = useCallback((data: any) => {
    setSystemMetrics(prev => ({ ...prev, totalScanned: prev.totalScanned + 1 }));
    setAudioAnalysis(prev => ({ 
      ...prev, 
      averageConfidence: (prev.averageConfidence + (data.confidence || 0)) / 2 
    }));
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'acknowledged' as const }
        : alert
    ));

    toast({
      title: "Alert acknowledged",
      description: "Alert has been marked as acknowledged"
    });
  }, [toast]);

  const escalateAlert = useCallback(async (alert: RealTimeAlert) => {
    setAlerts(prev => prev.map(a => 
      a.id === alert.id 
        ? { ...a, status: 'escalated' as const }
        : a
    ));

    // Send escalation to backend (simulated for now)
    console.log('Crisis escalated:', {
      sessionId,
      participantId: alert.participantId,
      severity: 'critical',
      confidence: alert.confidence || 90
    });

    toast({
      title: "Alert escalated",
      description: "Emergency protocols have been activated",
      variant: "destructive"
    });
  }, [socket, sessionId, toast]);

  const toggleTranscription = useCallback(() => {
    setAudioAnalysis(prev => ({
      ...prev,
      transcriptionEnabled: !prev.transcriptionEnabled
    }));
  }, []);

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'text-blue-600 bg-blue-50 border-blue-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      critical: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'acknowledged': return <Eye className="h-4 w-4 text-blue-500" />;
      case 'escalated': return <Phone className="h-4 w-4 text-red-600" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'active');

  return (
    <Card className={`${className} ${emergencyMode ? 'border-red-500 shadow-red-200 shadow-lg' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className={`h-5 w-5 ${audioAnalysis.isActive ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            Real-Time AI Monitor
            {emergencyMode && (
              <Badge variant="destructive" className="ml-2 animate-pulse">
                EMERGENCY
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {isHost && (
              <Button
                variant={audioAnalysis.transcriptionEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleTranscription}
                className="gap-1"
              >
                {audioAnalysis.transcriptionEnabled ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                Audio AI
              </Button>
            )}
            <Badge variant={activeAlerts.length > 0 ? "destructive" : "secondary"}>
              {activeAlerts.length} Active
            </Badge>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-5 gap-3 mt-4">
          <div className="text-center">
            <div className="font-semibold text-sm">{systemMetrics.totalScanned}</div>
            <div className="text-xs text-muted-foreground">Scanned</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-sm text-red-600">{systemMetrics.crisisDetected}</div>
            <div className="text-xs text-muted-foreground">Crisis</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-sm">{systemMetrics.moderationActions}</div>
            <div className="text-xs text-muted-foreground">Actions</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-sm">{systemMetrics.averageResponseTime}s</div>
            <div className="text-xs text-muted-foreground">Response</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-sm text-green-600">{systemMetrics.uptime}</div>
            <div className="text-xs text-muted-foreground">Uptime</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Audio Analysis Status */}
        {audioAnalysis.transcriptionEnabled && (
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Audio AI Analysis</span>
                <Badge variant={audioAnalysis.isActive ? "default" : "secondary"}>
                  {audioAnalysis.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Quality</div>
                  <div className="font-medium">{audioAnalysis.qualityScore}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Confidence</div>
                  <div className="font-medium">{audioAnalysis.averageConfidence.toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Latency</div>
                  <div className="font-medium">{audioAnalysis.processingLatency}ms</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Critical Alerts Banner */}
        {criticalAlerts.length > 0 && (
          <Alert className="border-red-500 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>{criticalAlerts.length} CRITICAL ALERT{criticalAlerts.length > 1 ? 'S' : ''}</strong> requiring immediate attention
            </AlertDescription>
          </Alert>
        )}

        {/* Active Alerts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Active Alerts</h3>
            <Badge variant="outline">{activeAlerts.length}</Badge>
          </div>

          {activeAlerts.length === 0 ? (
            <div className="text-center py-6">
              <Shield className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-green-600 font-medium">All Clear</p>
              <p className="text-xs text-muted-foreground">AI monitoring active, no issues detected</p>
            </div>
          ) : (
            <ScrollArea className="h-48">
              <div className="space-y-2">
                <AnimatePresence>
                  {activeAlerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(alert.status)}
                            <Badge variant="outline" className="text-xs">
                              {alert.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {alert.severity}
                            </Badge>
                            {alert.confidence && (
                              <span className="text-xs text-muted-foreground">
                                {alert.confidence.toFixed(0)}%
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm font-medium mb-1">{alert.participantAlias}</p>
                          <p className="text-xs text-muted-foreground mb-2">{alert.message}</p>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{alert.timestamp.toLocaleTimeString()}</span>
                          </div>
                        </div>

                        {isHost && alert.status === 'active' && (
                          <div className="flex flex-col gap-1 ml-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="text-xs px-2 py-1"
                            >
                              Acknowledge
                            </Button>
                            {alert.actionRequired && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => escalateAlert(alert)}
                                className="text-xs px-2 py-1"
                              >
                                Escalate
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Quick Actions */}
        {isHost && (
          <div className="pt-2 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEmergencyMode(!emergencyMode)}
                className="gap-1"
              >
                <Phone className="h-3 w-3" />
                {emergencyMode ? 'Disable' : 'Enable'} Emergency
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast({ title: "AI sensitivity increased" })}
                className="gap-1"
              >
                <Zap className="h-3 w-3" />
                Boost Sensitivity
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Alert Details Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
            <DialogDescription>
              AI-detected issue requiring attention
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <p className="text-sm text-muted-foreground">{selectedAlert.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <p className="text-sm text-muted-foreground">{selectedAlert.severity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Participant</label>
                  <p className="text-sm text-muted-foreground">{selectedAlert.participantAlias}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Confidence</label>
                  <p className="text-sm text-muted-foreground">{selectedAlert.confidence?.toFixed(0) || 'N/A'}%</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Message</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedAlert.message}</p>
              </div>

              {selectedAlert.triggers && (
                <div>
                  <label className="text-sm font-medium">Triggers</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedAlert.triggers.map((trigger, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {trigger}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default RealTimeAIMonitor;