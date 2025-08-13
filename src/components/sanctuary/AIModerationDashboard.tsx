import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  Brain, 
  Eye, 
  Volume2, 
  Heart, 
  MessageSquare,
  TrendingUp,
  UserX,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react';
import { AIModerationLog, SanctuaryAlert, ModerationAction } from '@/types/sanctuary';
import { motion, AnimatePresence } from 'framer-motion';

interface AIModerationDashboardProps {
  sessionId: string;
  sessionType: 'sanctuary' | 'breakout' | 'private' | 'live-sanctuary';
  isHost: boolean;
  isModerator: boolean;
  realTimeEnabled?: boolean;
}

interface ModerationStats {
  totalFlags: number;
  criticalRisks: number;
  escalatedCases: number;
  resolvedCases: number;
  averageConfidence: number;
  topCategories: string[];
}

interface RealTimeAlert {
  id: string;
  participantId: string;
  participantAlias: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  confidence: number;
  timestamp: string;
  content: string;
  resolved: boolean;
}

const AIModerationDashboard = ({ 
  sessionId, 
  sessionType, 
  isHost, 
  isModerator,
  realTimeEnabled = true 
}: AIModerationDashboardProps) => {
  const { toast } = useToast();
  const [stats, setStats] = useState<ModerationStats>({
    totalFlags: 0,
    criticalRisks: 0,
    escalatedCases: 0,
    resolvedCases: 0,
    averageConfidence: 0,
    topCategories: []
  });
  const [alerts, setAlerts] = useState<RealTimeAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<RealTimeAlert | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiModelStatus, setAiModelStatus] = useState<'active' | 'paused' | 'error'>('active');
  const [emotionalTone, setEmotionalTone] = useState({
    positive: 65,
    negative: 20,
    neutral: 15
  });

  // Fetch moderation analytics
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/live-sanctuary/${sessionId}/moderation/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  }, [sessionId]);

  // Simulate real-time AI detection
  useEffect(() => {
    if (!realTimeEnabled) return;

    const simulateDetection = () => {
      // Simulate various types of content detection
      const categories = ['harassment', 'emotional_distress', 'off_topic', 'inappropriate_content', 'crisis_language'];
      const riskLevels: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
      
      // Randomly generate alerts (in production, these come from real AI analysis)
      if (Math.random() < 0.1) { // 10% chance every interval
        const newAlert: RealTimeAlert = {
          id: Date.now().toString(),
          participantId: `user-${Math.floor(Math.random() * 10) + 1}`,
          participantAlias: `Anonymous User ${Math.floor(Math.random() * 10) + 1}`,
          riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
          category: categories[Math.floor(Math.random() * categories.length)],
          confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
          timestamp: new Date().toISOString(),
          content: "Flagged content detected in audio stream",
          resolved: false
        };

        setAlerts(prev => [newAlert, ...prev.slice(0, 19)]); // Keep last 20 alerts

        // Show toast for high-risk alerts
        if (newAlert.riskLevel === 'critical' || newAlert.riskLevel === 'high') {
          toast({
            title: `${newAlert.riskLevel.toUpperCase()} Risk Detected`,
            description: `${newAlert.category} - ${newAlert.participantAlias}`,
            variant: newAlert.riskLevel === 'critical' ? 'destructive' : 'default',
          });
        }
      }
    };

    const interval = setInterval(simulateDetection, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [realTimeEnabled, toast]);

  // Update emotional tone periodically
  useEffect(() => {
    const updateTone = () => {
      setEmotionalTone({
        positive: Math.max(20, Math.min(80, emotionalTone.positive + (Math.random() - 0.5) * 10)),
        negative: Math.max(5, Math.min(40, emotionalTone.negative + (Math.random() - 0.5) * 5)),
        neutral: Math.max(10, Math.min(60, emotionalTone.neutral + (Math.random() - 0.5) * 8))
      });
    };

    const interval = setInterval(updateTone, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [emotionalTone]);

  const takeAction = useCallback(async (alertId: string, action: 'warning' | 'mute' | 'temporary_removal' | 'escalation') => {
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/live-sanctuary/${sessionId}/moderation/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          moderationId: alertId,
          actionTaken: action,
          actionTakenBy: 'human_moderator'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update alert status
        setAlerts(prev => 
          prev.map(alert => 
            alert.id === alertId 
              ? { ...alert, resolved: true }
              : alert
          )
        );

        toast({
          title: "Action taken",
          description: `${action.replace('_', ' ')} applied successfully`,
        });

        setSelectedAlert(null);
        fetchStats(); // Refresh stats
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Action error:', error);
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, toast, fetchStats]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Eye className="h-4 w-4 text-yellow-500" />;
      default: return <Shield className="h-4 w-4 text-blue-500" />;
    }
  };

  if (!isHost && !isModerator) {
    return (
      <Card className="glass shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">AI moderation is active and protecting this space</p>
            <p className="text-sm text-gray-400 mt-1">Only hosts and moderators can view detailed analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Status & Overview */}
      <Card className="glass shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              AI Moderation System
            </CardTitle>
            <Badge variant={aiModelStatus === 'active' ? 'default' : 'destructive'}>
              {aiModelStatus}
            </Badge>
          </div>
          <CardDescription>
            Real-time content analysis and safety monitoring
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{stats.totalFlags}</div>
              <div className="text-xs text-gray-500">Total Flags</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.criticalRisks}</div>
              <div className="text-xs text-gray-500">Critical Risks</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.escalatedCases}</div>
              <div className="text-xs text-gray-500">Escalated</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.resolvedCases}</div>
              <div className="text-xs text-gray-500">Resolved</div>
            </div>
          </div>

          {/* Emotional Tone Analysis */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <Heart className="h-4 w-4 mr-2" />
              Session Emotional Tone
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600">Positive</span>
                <span className="text-sm font-medium">{Math.round(emotionalTone.positive)}%</span>
              </div>
              <Progress value={emotionalTone.positive} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600">Negative</span>
                <span className="text-sm font-medium">{Math.round(emotionalTone.negative)}%</span>
              </div>
              <Progress value={emotionalTone.negative} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Neutral</span>
                <span className="text-sm font-medium">{Math.round(emotionalTone.neutral)}%</span>
              </div>
              <Progress value={emotionalTone.neutral} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Alerts */}
      <Card className="glass shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Real-Time Alerts ({alerts.filter(a => !a.resolved).length})
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-gray-500">No moderation alerts</p>
              <p className="text-sm text-gray-400 mt-1">AI is actively monitoring for safety</p>
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
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${getRiskColor(alert.riskLevel)} ${
                        alert.resolved ? 'opacity-50' : 'hover:shadow-sm'
                      }`}
                      onClick={() => !alert.resolved && setSelectedAlert(alert)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getRiskIcon(alert.riskLevel)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm">{alert.participantAlias}</span>
                              <Badge variant="outline" className="text-xs">
                                {alert.category.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">{alert.content}</p>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span>Confidence: {Math.round(alert.confidence * 100)}%</span>
                              <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {alert.resolved ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Alert Action Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        {selectedAlert && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {getRiskIcon(selectedAlert.riskLevel)}
                <span className="ml-2">Moderation Action Required</span>
              </DialogTitle>
              <DialogDescription>
                Review the flagged content and take appropriate action.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className={`p-4 rounded-lg border ${getRiskColor(selectedAlert.riskLevel)}`}>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Participant:</span>
                    <p>{selectedAlert.participantAlias}</p>
                  </div>
                  <div>
                    <span className="font-medium">Risk Level:</span>
                    <p className="capitalize">{selectedAlert.riskLevel}</p>
                  </div>
                  <div>
                    <span className="font-medium">Category:</span>
                    <p>{selectedAlert.category.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="font-medium">Confidence:</span>
                    <p>{Math.round(selectedAlert.confidence * 100)}%</p>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-medium text-sm">Flagged Content:</span>
                  <p className="mt-1 text-sm">{selectedAlert.content}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => takeAction(selectedAlert.id, 'warning')}
                  disabled={isProcessing}
                  variant="outline"
                  className="text-yellow-600 border-yellow-300"
                >
                  Send Warning
                </Button>
                <Button
                  onClick={() => takeAction(selectedAlert.id, 'mute')}
                  disabled={isProcessing}
                  variant="outline"
                  className="text-orange-600 border-orange-300"
                >
                  Temporary Mute
                </Button>
                <Button
                  onClick={() => takeAction(selectedAlert.id, 'temporary_removal')}
                  disabled={isProcessing}
                  variant="outline"
                  className="text-red-600 border-red-300"
                >
                  Remove from Session
                </Button>
                <Button
                  onClick={() => takeAction(selectedAlert.id, 'escalation')}
                  disabled={isProcessing}
                  variant="destructive"
                >
                  Escalate to Crisis Team
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default AIModerationDashboard;