import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Award,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { motion } from 'framer-motion';

interface WellnessMetric {
  name: string;
  current: number;
  previous: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  category: 'mental' | 'social' | 'progress';
}

export const WellnessInsights = () => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('week');

  const metrics: WellnessMetric[] = [
    {
      name: 'Mental Health Score',
      current: 85,
      previous: 78,
      target: 90,
      unit: '/100',
      trend: 'up',
      category: 'mental'
    },
    {
      name: 'Social Connections',
      current: 12,
      previous: 8,
      target: 15,
      unit: 'active',
      trend: 'up',
      category: 'social'
    },
    {
      name: 'Session Completion',
      current: 92,
      previous: 85,
      target: 95,
      unit: '%',
      trend: 'up',
      category: 'progress'
    },
    {
      name: 'Sanctuary Engagement',
      current: 76,
      previous: 82,
      target: 80,
      unit: '%',
      trend: 'down',
      category: 'social'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-3 w-3 text-green-500" />;
      case 'down': return <ArrowDown className="h-3 w-3 text-red-500" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const calculateChange = (current: number, previous: number) => {
    const change = current - previous;
    const percentage = previous > 0 ? Math.abs((change / previous) * 100) : 0;
    return { change, percentage: Math.round(percentage * 10) / 10 };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Wellness Insights</h3>
          <p className="text-sm text-muted-foreground">
            Track your mental health journey with personalized metrics
          </p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric, index) => {
          const { change, percentage } = calculateChange(metric.current, metric.previous);
          const progressPercentage = (metric.current / metric.target) * 100;
          
          return (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {metric.name}
                    </CardTitle>
                    <Badge 
                      variant="secondary"
                      className={`${getTrendColor(metric.trend)} bg-transparent`}
                    >
                      {getTrendIcon(metric.trend)}
                      {percentage > 0 && `${percentage}%`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">
                        {metric.current}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {metric.unit}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        of {metric.target}{metric.unit}
                      </span>
                    </div>
                    
                    <Progress 
                      value={Math.min(progressPercentage, 100)} 
                      className="h-2" 
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {change > 0 ? '+' : ''}{change} from last {timeframe}
                      </span>
                      <span>
                        {Math.round(progressPercentage)}% to goal
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-5 w-5 text-primary" />
            Weekly Goal Progress
          </CardTitle>
          <CardDescription>
            You're making excellent progress on your wellness journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Overall Wellness Score</span>
              <span className="font-medium">85/100</span>
            </div>
            <Progress value={85} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Keep up the great work!</span>
              <span>5 points to reach your goal</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};