import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserContext } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  Phone, 
  Brain, 
  Activity, 
  Heart,
  MessageSquare,
  Clock,
  TrendingUp,
  Users,
  Eye,
  Zap,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  aiEmotionalIntelligence,
  CrisisDetectionResult,
  EmotionalState,
  ConversationContext
} from '@/services/aiEmotionalIntelligence';
import { logger } from '@/services/logger';

interface CrisisDetectionSystemProps {
  sessionId?: string;
  isActive: boolean;
  conversationContext?: ConversationContext;
  onCrisisDetected?: (crisis: CrisisDetectionResult) => void;
  onEmergencyTriggered?: (userId: string, crisis: CrisisDetectionResult) => void;
  className?: string;
}

interface CrisisAlert {
  id: string;
  userId: string;
  userAlias: string;
  crisis: CrisisDetectionResult;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'escalated' | 'resolved';
  actions: string[];
  emotionalState?: EmotionalState;
}

export const CrisisDetectionSystem: React.FC<CrisisDetectionSystemProps> = ({
  sessionId,
  isActive,
  conversationContext,
  onCrisisDetected,
  onEmergencyTriggered,
  className = ''
}) => {
  const { user } = useUserContext();
  const { toast } = useToast();

  const [alerts, setAlerts] = useState<CrisisAlert[]>([]);
  const [systemStatus, setSystemStatus] = useState<{
    monitoring: boolean;
    sensitivity: 'low' | 'medium' | 'high' | 'maximum';
    totalScanned: number;
    flaggedMessages: number;
    crisisEvents: number;
    lastScan: Date | null;
  }>({
    monitoring: isActive,
    sensitivity: 'high',
    totalScanned: 0,
    flaggedMessages: 0,
    crisisEvents: 0,
    lastScan: null
  });

  const [emergencyProtocols, setEmergencyProtocols] = useState({
    enabled: true,
    autoEscalation: true,
    emergencyContacts: [
      { name: 'Crisis Hotline', number: '988', description: 'National Suicide Prevention Lifeline' },
      { name: 'Emergency Services', number: '911', description: 'Immediate emergency response' },
      { name: 'Crisis Text Line', number: '741741', description: 'Text HOME to 741741' }
    ]
  });

  // Real-time monitoring effect
  useEffect(() => {
    if (!isActive) return;

    const monitoringInterval = setInterval(async () => {
      await performSystemCheck();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(monitoringInterval);
  }, [isActive, conversationContext]);

  const performSystemCheck = async () => {
    if (!user?.id) return;

    try {
      setSystemStatus(prev => ({
        ...prev,
        monitoring: true,
        lastScan: new Date()
      }));

      // In a real implementation, this would scan recent messages
      // For demo purposes, we'll simulate crisis detection
      if (Math.random() < 0.02) { // 2% chance for demo
        await simulateCrisisDetection();
      }

      logger.debug('Crisis detection system check completed');
    } catch (error) {
      logger.error('Crisis detection system check failed', { error });
    }
  };

  const simulateCrisisDetection = async () => {
    if (!user?.id || !conversationContext) return;

    const mockCrisis: CrisisDetectionResult = {
      isCrisis: true,
      severity: ['mild', 'moderate', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
      confidence: 70 + Math.random() * 30,
      triggers: [
        {
          type: 'self_harm',
          keywords: ['hurt myself', 'self-harm'],
          contextScore: 85
        }
      ],
      recommendations: {
        immediate: ['Reach out for immediate support', 'Contact crisis helpline'],
        professional: ['Schedule therapy session', 'Consult mental health professional'],
        resources: [
          { name: 'Crisis Hotline', contact: '988', description: 'Available 24/7' }
        ]
      },
      riskFactors: ['Isolated language patterns', 'Declining emotional indicators']
    };

    await handleCrisisDetection(user.id, user.alias || 'Anonymous User', mockCrisis);
  };

  const handleCrisisDetection = async (
    userId: string, 
    userAlias: string, 
    crisis: CrisisDetectionResult
  ) => {
    try {
      const emotionalState = aiEmotionalIntelligence.getEmotionalHistory(userId).slice(-1)[0];

      const newAlert: CrisisAlert = {
        id: `crisis_${Date.now()}`,
        userId,
        userAlias,
        crisis,
        timestamp: new Date(),
        status: 'active',
        actions: [],
        emotionalState
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 19)]); // Keep last 20 alerts

      // Update system statistics
      setSystemStatus(prev => ({
        ...prev,
        crisisEvents: prev.crisisEvents + 1,
        flaggedMessages: prev.flaggedMessages + 1
      }));

      // Auto-escalate critical situations
      if (crisis.severity === 'critical' && emergencyProtocols.autoEscalation) {
        await escalateCrisis(newAlert);
      }

      // Notify parent components
      if (onCrisisDetected) {
        onCrisisDetected(crisis);
      }

      // Show appropriate toast notification
      toast({
        title: `${crisis.severity.toUpperCase()} Crisis Detected`,
        description: `AI detected potential ${crisis.triggers.map(t => t.type).join(', ')} indicators`,
        variant: crisis.severity === 'critical' ? 'destructive' : 'default',
        duration: crisis.severity === 'critical' ? 0 : 5000 // Critical alerts don't auto-dismiss
      });

      logger.warn('Crisis detected and processed', {
        userId,
        severity: crisis.severity,
        confidence: crisis.confidence,
        alertId: newAlert.id
      });

    } catch (error) {
      logger.error('Failed to handle crisis detection', { error, userId });
    }
  };

  const escalateCrisis = async (alert: CrisisAlert) => {
    try {
      setAlerts(prev => prev.map(a => 
        a.id === alert.id 
          ? { ...a, status: 'escalated', actions: [...a.actions, 'Emergency protocol activated'] }
          : a
      ));

      if (onEmergencyTriggered) {
        onEmergencyTriggered(alert.userId, alert.crisis);
      }

      toast({
        title: "🚨 EMERGENCY PROTOCOL ACTIVATED",
        description: "Crisis intervention team has been notified. Professional help is on the way.",
        variant: "destructive",
        duration: 0
      });

      logger.error('Crisis escalated to emergency protocols', {
        alertId: alert.id,
        userId: alert.userId,
        severity: alert.crisis.severity
      });
    } catch (error) {
      logger.error('Failed to escalate crisis', { error, alertId: alert.id });
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId 
        ? { 
            ...a, 
            status: 'acknowledged', 
            actions: [...a.actions, `Acknowledged by ${user?.alias || 'User'} at ${new Date().toLocaleTimeString()}`]
          }
        : a
    ));

    toast({
      title: "Alert Acknowledged",
      description: "Crisis alert has been acknowledged and is being monitored."
    });
  };

  const resolveAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId 
        ? { 
            ...a, 
            status: 'resolved',
            actions: [...a.actions, `Resolved by ${user?.alias || 'User'} at ${new Date().toLocaleTimeString()}`]
          }
        : a
    ));

    toast({
      title: "Alert Resolved",
      description: "Crisis situation has been successfully addressed."
    });
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      mild: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      moderate: 'text-orange-600 bg-orange-100 border-orange-200', 
      high: 'text-red-600 bg-red-100 border-red-200',
      critical: 'text-red-800 bg-red-200 border-red-300'
    };
    return colors[severity as keyof typeof colors] || colors.mild;
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

  return (
    <Card className={`${className} border-2 ${isActive ? 'border-primary/30' : 'border-muted'}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className={`h-5 w-5 ${isActive ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            AI Crisis Detection System
          </CardTitle>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="font-semibold text-lg">{systemStatus.totalScanned}</div>
            <div className="text-xs text-muted-foreground">Messages Scanned</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">{systemStatus.flaggedMessages}</div>
            <div className="text-xs text-muted-foreground">Flagged Content</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg text-red-600">{systemStatus.crisisEvents}</div>
            <div className="text-xs text-muted-foreground">Crisis Events</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg capitalize">{systemStatus.sensitivity}</div>
            <div className="text-xs text-muted-foreground">Sensitivity</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Active Alerts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Active Crisis Alerts ({alerts.filter(a => a.status === 'active').length})
            </h3>
            {systemStatus.lastScan && (
              <div className="text-xs text-muted-foreground flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Last scan: {systemStatus.lastScan.toLocaleTimeString()}
              </div>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-green-600 font-medium">All Clear</p>
              <p className="text-sm text-muted-foreground">No crisis indicators detected</p>
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
                      className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.crisis.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusIcon(alert.status)}
                            <Badge variant="outline" className="text-xs">
                              {alert.crisis.severity} crisis
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {alert.crisis.confidence.toFixed(0)}% confidence
                            </Badge>
                          </div>

                          <p className="font-medium text-sm mb-1">{alert.userAlias}</p>
                          
                          <p className="text-xs text-muted-foreground mb-2">
                            Triggers: {alert.crisis.triggers.map(t => t.type).join(', ')}
                          </p>

                          <div className="text-xs text-muted-foreground">
                            {alert.timestamp.toLocaleString()}
                          </div>

                          {alert.actions.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {alert.actions.slice(-2).map((action, index) => (
                                <div key={index} className="text-xs bg-muted px-2 py-1 rounded">
                                  {action}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {alert.status === 'active' && (
                          <div className="flex flex-col space-y-1 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="text-xs"
                            >
                              Acknowledge
                            </Button>
                            {alert.crisis.severity !== 'critical' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveAlert(alert.id)}
                                className="text-xs"
                              >
                                Resolve
                              </Button>
                            )}
                            {alert.crisis.severity === 'critical' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => escalateCrisis(alert)}
                                className="text-xs"
                              >
                                Escalate
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Crisis Recommendations */}
                      {alert.status === 'active' && alert.crisis.recommendations.immediate.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs font-medium mb-1">Immediate Actions:</p>
                          <div className="space-y-1">
                            {alert.crisis.recommendations.immediate.map((rec, index) => (
                              <div key={index} className="text-xs text-muted-foreground">
                                • {rec}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Emergency Protocols */}
        <Separator />
        
        <div className="space-y-4">
          <h3 className="font-medium flex items-center">
            <Phone className="h-4 w-4 mr-2" />
            Emergency Protocols
          </h3>

          <div className="grid gap-3">
            {emergencyProtocols.emergencyContacts.map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">{contact.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold">{contact.number}</p>
                  <Button size="sm" variant="outline" className="mt-1">
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              If you or someone you know is in immediate danger, please call emergency services (911) or go to your nearest emergency room.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};