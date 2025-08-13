import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  Brain, 
  Activity, 
  Clock, 
  Users, 
  MessageSquare,
  Volume2,
  TrendingUp,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModerationAlert {
  id: string;
  type: 'crisis' | 'harassment' | 'spam' | 'inappropriate' | 'safety_concern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  participantId: string;
  participantAlias: string;
  content: string;
  timestamp: string;
  confidence: number;
  action: 'flagged' | 'auto_muted' | 'escalated' | 'resolved';
  aiReason: string;
}

interface SafetyMetrics {
  overallRisk: number;
  participantWellbeing: {
    [participantId: string]: {
      score: number;
      trend: 'improving' | 'stable' | 'declining';
      indicators: string[];
    };
  };
  sessionHealth: {
    engagement: number;
    toxicity: number;
    supportiveness: number;
  };
}

interface SanctuaryModerationAIProps {
  sessionId: string;
  isHost: boolean;
  participantCount: number;
  onEmergencyAlert: (participantId: string, crisis: boolean) => void;
}

const SanctuaryModerationAI = ({ sessionId, isHost, participantCount, onEmergencyAlert }: SanctuaryModerationAIProps) => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<ModerationAlert[]>([]);
  const [safetyMetrics, setSafetyMetrics] = useState<SafetyMetrics>({
    overallRisk: 15,
    participantWellbeing: {},
    sessionHealth: {
      engagement: 78,
      toxicity: 12,
      supportiveness: 85
    }
  });
  const [selectedAlert, setSelectedAlert] = useState<ModerationAlert | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [emergencyProtocol, setEmergencyProtocol] = useState(false);

  // Real-time AI monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate AI analysis updates
      if (Math.random() < 0.1) { // 10% chance of new alert
        const newAlert: ModerationAlert = {
          id: Date.now().toString(),
          type: ['crisis', 'harassment', 'inappropriate', 'safety_concern'][Math.floor(Math.random() * 4)] as any,
          severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          participantId: `user_${Math.floor(Math.random() * participantCount)}`,
          participantAlias: `Anonymous ${Math.floor(Math.random() * 100)}`,
          content: 'AI detected concerning content pattern',
          timestamp: new Date().toISOString(),
          confidence: 70 + Math.random() * 30,
          action: 'flagged',
          aiReason: 'Speech pattern analysis indicates potential distress indicators'
        };
        
        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
        
        // Auto-escalate critical alerts
        if (newAlert.severity === 'critical') {
          handleEscalateAlert(newAlert);
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [participantCount]);

  const handleEscalateAlert = useCallback(async (alert: ModerationAlert) => {
    if (alert.type === 'crisis') {
      setEmergencyProtocol(true);
      onEmergencyAlert(alert.participantId, true);
      
      toast({
        title: "🚨 Crisis Detected",
        description: "Emergency protocol activated. Professional help contacted.",
        variant: "destructive",
      });
    }
    
    // Update alert status
    setAlerts(prev => prev.map(a => 
      a.id === alert.id ? { ...a, action: 'escalated' } : a
    ));
  }, [onEmergencyAlert, toast]);

  const handleResolveAlert = useCallback(async (alertId: string) => {
    setIsProcessing(true);
    
    try {
      // In production, this would call the backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, action: 'resolved' } : a
      ));
      
      toast({
        title: "Alert resolved",
        description: "Moderation action completed successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to resolve alert",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'escalated': return <Phone className="h-4 w-4 text-red-500" />;
      case 'auto_muted': return <Ban className="h-4 w-4 text-orange-500" />;
      default: return <Eye className="h-4 w-4 text-blue-500" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Emergency Protocol Banner */}
      {emergencyProtocol && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-100 border-2 border-red-500 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
            <div>
              <h3 className="font-bold text-red-800">Emergency Protocol Active</h3>
              <p className="text-sm text-red-700">Crisis intervention team notified. Enhanced monitoring enabled.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Safety Metrics Overview */}
      <Card className="glass shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            AI Safety Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="relative mb-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-200 flex items-center justify-center">
                  <span className={`text-xl font-bold ${getHealthColor(100 - safetyMetrics.overallRisk)}`}>
                    {100 - safetyMetrics.overallRisk}%
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium">Safety Score</p>
              <p className="text-xs text-gray-500">Overall session safety</p>
            </div>
            
            <div className="text-center">
              <div className="relative mb-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-200 flex items-center justify-center">
                  <span className={`text-xl font-bold ${getHealthColor(safetyMetrics.sessionHealth.engagement)}`}>
                    {safetyMetrics.sessionHealth.engagement}%
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium">Engagement</p>
              <p className="text-xs text-gray-500">Participant involvement</p>
            </div>
            
            <div className="text-center">
              <div className="relative mb-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-200 flex items-center justify-center">
                  <span className={`text-xl font-bold ${getHealthColor(safetyMetrics.sessionHealth.supportiveness)}`}>
                    {safetyMetrics.sessionHealth.supportiveness}%
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium">Support Level</p>
              <p className="text-xs text-gray-500">Positive interactions</p>
            </div>
          </div>

          {/* Real-time Indicators */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Toxicity Detection</span>
              <div className="flex items-center space-x-2">
                <Progress value={safetyMetrics.sessionHealth.toxicity} className="w-20 h-2" />
                <span className="text-xs text-gray-500">{safetyMetrics.sessionHealth.toxicity}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Emotional Distress</span>
              <div className="flex items-center space-x-2">
                <Progress value={safetyMetrics.overallRisk} className="w-20 h-2" />
                <span className="text-xs text-gray-500">{safetyMetrics.overallRisk}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card className="glass shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Active Alerts ({alerts.filter(a => a.action !== 'resolved').length})
            </CardTitle>
            <Badge variant={alerts.some(a => a.severity === 'critical') ? "destructive" : "secondary"}>
              {alerts.some(a => a.severity === 'critical') ? 'Critical' : 'Monitoring'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-green-600 font-medium">All Clear</p>
              <p className="text-sm text-gray-500">AI monitoring shows no active concerns</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                <AnimatePresence>
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-3 rounded-lg border-l-4 ${
                        alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                        alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                        alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {alert.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {alert.confidence.toFixed(0)}% confidence
                            </span>
                          </div>
                          
                          <p className="text-sm font-medium text-gray-800 mb-1">
                            {alert.participantAlias}
                          </p>
                          
                          <p className="text-xs text-gray-600 mb-2">
                            {alert.aiReason}
                          </p>
                          
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                            {getActionIcon(alert.action)}
                            <span>{alert.action.replace('_', ' ')}</span>
                          </div>
                        </div>
                        
                        {isHost && alert.action === 'flagged' && (
                          <div className="flex flex-col space-y-1">
                            <Button
                              onClick={() => handleEscalateAlert(alert)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300"
                            >
                              Escalate
                            </Button>
                            <Button
                              onClick={() => handleResolveAlert(alert.id)}
                              size="sm"
                              variant="outline"
                              disabled={isProcessing}
                            >
                              Resolve
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {isHost && (
        <Card className="glass shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Quick Safety Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setEmergencyProtocol(!emergencyProtocol)}
              >
                <Phone className="h-4 w-4 mr-2" />
                {emergencyProtocol ? 'Disable' : 'Enable'} Crisis Protocol
              </Button>
              
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => toast({ title: "Enhanced monitoring activated" })}
              >
                <Brain className="h-4 w-4 mr-2" />
                Boost AI Sensitivity
              </Button>
              
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => toast({ title: "Wellness check sent to all participants" })}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Send Wellness Check
              </Button>
              
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => toast({ title: "Professional support contacted" })}
              >
                <Users className="h-4 w-4 mr-2" />
                Contact Support Team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Details Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Alert Details
            </DialogTitle>
            <DialogDescription>
              AI-detected safety concern requiring attention
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <p className="text-sm text-gray-600">{selectedAlert.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <p className="text-sm text-gray-600">{selectedAlert.severity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Participant</label>
                  <p className="text-sm text-gray-600">{selectedAlert.participantAlias}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Confidence</label>
                  <p className="text-sm text-gray-600">{selectedAlert.confidence.toFixed(0)}%</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">AI Analysis</label>
                <p className="text-sm text-gray-600 mt-1">{selectedAlert.aiReason}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SanctuaryModerationAI;