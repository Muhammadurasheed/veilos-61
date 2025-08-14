import { motion } from 'framer-motion';
import { Loader2, Heart, Shield, Users, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface LoadingStateProps {
  variant?: 'default' | 'sanctuary' | 'connection' | 'secure';
  message?: string;
  progress?: number;
}

export function EnhancedLoadingState({ 
  variant = 'default', 
  message = 'Loading...', 
  progress 
}: LoadingStateProps) {
  const variants = {
    default: {
      icon: <Loader2 className="w-8 h-8 animate-spin" />,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    sanctuary: {
      icon: <Heart className="w-8 h-8" />,
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    },
    connection: {
      icon: <Users className="w-8 h-8" />,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    secure: {
      icon: <Shield className="w-8 h-8" />,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    }
  };

  const currentVariant = variants[variant];

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-8">
        <div className="flex flex-col items-center space-y-6">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: variant === 'default' ? [0, 360] : [0, 5, -5, 0]
            }}
            transition={{ 
              duration: variant === 'default' ? 2 : 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`p-4 rounded-full ${currentVariant.bg} ${currentVariant.color}`}
          >
            {currentVariant.icon}
          </motion.div>

          <div className="text-center space-y-3">
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-semibold"
            >
              {message}
            </motion.h3>

            {progress !== undefined && (
              <div className="w-64 space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {progress}% complete
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SuccessStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function SuccessState({ title, description, action }: SuccessStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-2 border-green-500/20 bg-gradient-to-br from-background to-green-500/5">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="p-4 rounded-full bg-green-500/20 text-green-500"
            >
              <CheckCircle className="w-12 h-12" />
            </motion.div>

            <div className="space-y-3">
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-green-600"
              >
                {title}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground max-w-md"
              >
                {description}
              </motion.p>
            </div>

            {action && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={action.onClick}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                {action.label}
              </motion.button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}