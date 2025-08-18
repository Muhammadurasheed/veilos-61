import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Signal, 
  SignalHigh, 
  SignalMedium, 
  SignalLow, 
  SignalZero,
  Wifi,
  WifiOff,
  Volume2
} from 'lucide-react';

interface AudioStats {
  networkQuality: number;
  audioLevel: number;
  packetLoss: number;
  rtt: number;
}

interface AudioQualityMonitorProps {
  audioStats: AudioStats;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  isConnected: boolean;
  className?: string;
}

const AudioQualityMonitor = ({ 
  audioStats, 
  connectionQuality, 
  isConnected,
  className = "" 
}: AudioQualityMonitorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'excellent': return <SignalHigh className="h-4 w-4 text-green-500" />;
      case 'good': return <SignalMedium className="h-4 w-4 text-yellow-500" />;
      case 'poor': return <SignalLow className="h-4 w-4 text-orange-500" />;
      default: return <SignalZero className="h-4 w-4 text-red-500" />;
    }
  };

  const getConnectionColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-yellow-500';
      case 'poor': return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

  const getQualityText = () => {
    if (!isConnected) return 'Disconnected';
    switch (connectionQuality) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'poor': return 'Poor';
      default: return 'Connecting...';
    }
  };

  return (
    <Card className={`${className} transition-all duration-300 ${isExpanded ? 'min-w-80' : 'min-w-32'}`}>
      <CardContent className="p-3">
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Connection Status Indicator */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            {getConnectionIcon()}
          </div>

          {/* Quality Badge */}
          <Badge 
            variant="outline" 
            className={`text-xs ${isConnected ? 'border-green-300' : 'border-red-300'}`}
          >
            {getQualityText()}
          </Badge>

          {/* Expand/Collapse indicator */}
          {!isExpanded && (
            <div className="flex items-center space-x-1">
              <Volume2 className="h-3 w-3 text-gray-400" />
              <div className={`h-1 w-6 rounded ${getConnectionColor()}`} />
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 space-y-3 animate-in slide-in-from-top-2">
            {/* Audio Level */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Audio Level</span>
                <span className="font-medium">{Math.round(audioStats.audioLevel)}%</span>
              </div>
              <Progress 
                value={audioStats.audioLevel} 
                className="h-1"
              />
            </div>

            {/* Network Quality */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Network Quality</span>
                <span className="font-medium">{audioStats.networkQuality}/5</span>
              </div>
              <Progress 
                value={(audioStats.networkQuality / 5) * 100} 
                className="h-1"
              />
            </div>

            {/* RTT (Round Trip Time) */}
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Latency</span>
              <span className={`font-medium ${audioStats.rtt > 150 ? 'text-red-500' : audioStats.rtt > 100 ? 'text-yellow-500' : 'text-green-500'}`}>
                {audioStats.rtt}ms
              </span>
            </div>

            {/* Packet Loss */}
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Packet Loss</span>
              <span className={`font-medium ${audioStats.packetLoss > 5 ? 'text-red-500' : audioStats.packetLoss > 2 ? 'text-yellow-500' : 'text-green-500'}`}>
                {audioStats.packetLoss.toFixed(1)}%
              </span>
            </div>

            {/* Connection Status */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Status</span>
                <div className="flex items-center space-x-1">
                  <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-xs font-medium">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioQualityMonitor;