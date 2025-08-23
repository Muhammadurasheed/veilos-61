import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUserContext, UserCreationStateInterface } from '@/contexts/UserContext';
import { CheckCircle, AlertCircle, Loader2, Sparkles, Shield, Users } from 'lucide-react';

interface AccountCreationFlowProps {
  onComplete?: () => void;
  onCancel?: () => void;
  variant?: 'modal' | 'inline';
}

export const AccountCreationFlow = ({ 
  onComplete, 
  onCancel, 
  variant = 'modal' 
}: AccountCreationFlowProps) => {
  const { createAnonymousAccount, creationState, retryAccountCreation, isLoading } = useUserContext();
  const [showDetails, setShowDetails] = useState(false);

  // Auto-trigger completion callback
  useEffect(() => {
    if (creationState.step === 'complete' && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [creationState.step, onComplete]);

  const getStepIcon = (step: UserCreationStateInterface['step']) => {
    switch (step) {
      case 'initializing':
      case 'creating':
      case 'authenticating':
      case 'finalizing':
        return <Loader2 className="h-5 w-5 animate-spin text-veilo-blue" />;
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-veilo-green" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-veilo-purple" />;
    }
  };

  const getStepColor = (step: UserCreationStateInterface['step']) => {
    switch (step) {
      case 'complete':
        return 'text-veilo-green';
      case 'error':
        return 'text-red-500';
      case 'initializing':
      case 'creating':
      case 'authenticating':
      case 'finalizing':
        return 'text-veilo-blue';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const containerClass = variant === 'modal' 
    ? "bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-8 max-w-md mx-auto"
    : "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6";

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto w-16 h-16 mb-4"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-veilo-blue to-veilo-purple rounded-full opacity-20 animate-pulse"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-veilo-blue to-veilo-purple rounded-full flex items-center justify-center">
            <motion.div
              key={creationState.step}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {getStepIcon(creationState.step)}
            </motion.div>
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {creationState.step === 'idle' && 'Create Anonymous Identity'}
          {creationState.step === 'complete' && 'Welcome to Veilo! 🕊️'}
          {creationState.step === 'error' && 'Connection Issue'}
          {['initializing', 'creating', 'authenticating', 'finalizing'].includes(creationState.step) && 'Setting Up Your Identity'}
        </h2>

        <p className="text-gray-600 dark:text-gray-300 text-sm">
          {creationState.step === 'idle' && 'Get instant access to our anonymous mental health sanctuary'}
          {creationState.step === 'complete' && 'Your anonymous sanctuary is ready'}
          {creationState.step === 'error' && 'We couldn\'t establish a connection'}
          {['initializing', 'creating', 'authenticating', 'finalizing'].includes(creationState.step) && 'Creating your secure, anonymous profile'}
        </p>
      </div>

      {/* Progress Section */}
      <AnimatePresence mode="wait">
        {creationState.step !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span>Progress</span>
                <span>{creationState.progress}%</span>
              </div>
              <Progress 
                value={creationState.progress} 
                className="h-2 bg-gray-100 dark:bg-gray-700"
              />
            </div>

            {/* Status Message */}
            <motion.div
              key={creationState.message}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center text-sm font-medium ${getStepColor(creationState.step)}`}
            >
              {creationState.message}
            </motion.div>

            {/* Retry Button for Error State */}
            {creationState.step === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 space-y-3"
              >
                <Button
                  onClick={retryAccountCreation}
                  disabled={isLoading}
                  className="w-full bg-veilo-blue hover:bg-veilo-blue-dark text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    'Try Again'
                  )}
                </Button>
                
                {onCancel && (
                  <Button
                    onClick={onCancel}
                    variant="outline"
                    className="w-full border-gray-300 dark:border-gray-600"
                  >
                    Cancel
                  </Button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial State Actions */}
      {creationState.step === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Features List */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Shield className="h-4 w-4 text-veilo-green mr-3" />
              <span>100% Anonymous & Secure</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Users className="h-4 w-4 text-veilo-blue mr-3" />
              <span>Instant Access to Community</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Sparkles className="h-4 w-4 text-veilo-purple mr-3" />
              <span>No Registration Required</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => createAnonymousAccount()}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-veilo-blue to-veilo-purple hover:from-veilo-blue-dark hover:to-veilo-purple-dark text-white font-medium h-12"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Identity...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Anonymous Identity
                </>
              )}
            </Button>

            {/* Details Toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {showDetails ? 'Hide' : 'Show'} technical details
            </button>

            {onCancel && (
              <Button
                onClick={onCancel}
                variant="outline"
                className="w-full border-gray-300 dark:border-gray-600"
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Technical Details */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300 space-y-1"
              >
                <div>• End-to-end encrypted communication</div>
                <div>• No personal data stored</div>
                <div>• Random alias generation</div>
                <div>• Secure JWT authentication</div>
                <div>• GDPR compliant</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Success State */}
      {creationState.step === 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-12 h-12 bg-veilo-green rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="h-6 w-6 text-white" />
          </motion.div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Your sanctuary awaits. Redirecting you now...
          </p>
        </motion.div>
      )}
    </div>
  );
};