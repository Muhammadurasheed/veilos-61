import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Shield, Heart, Users, ArrowRight, Loader2 } from 'lucide-react';
import { useUserContext, UserCreationState } from '@/contexts/UserContext';
import { toast } from '@/hooks/use-toast';

interface WelcomeScreenProps {
  isOpen: boolean;
  onComplete: () => void;
}

const welcomeSteps = [
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: "Welcome to Veilo",
    description: "Your anonymous sanctuary for mental health support and connection.",
    color: "hsl(var(--primary))"
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Complete Privacy",
    description: "Your identity is protected. Connect authentically without judgment.",
    color: "hsl(var(--accent))"
  },
  {
    icon: <Heart className="w-8 h-8" />,
    title: "Safe Space",
    description: "AI-moderated conversations ensure respectful, supportive interactions.",
    color: "hsl(var(--secondary))"
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Real Connections",
    description: "Join live sanctuary sessions or chat with verified mental health experts.",
    color: "hsl(var(--primary))"
  }
];

const creationSteps = [
  { step: 'initializing', message: 'Preparing your sanctuary...' },
  { step: 'creating', message: 'Crafting your anonymous identity...' },
  { step: 'authenticating', message: 'Securing your connection...' },
  { step: 'finalizing', message: 'Welcome to your safe space...' },
  { step: 'complete', message: 'Ready to begin your journey!' }
];

export function WelcomeScreen({ isOpen, onComplete }: WelcomeScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCreation, setShowCreation] = useState(false);
  const { createAnonymousAccount, creationState, retryAccountCreation, isLoading } = useUserContext();

  const handleNext = () => {
    if (currentStep < welcomeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowCreation(true);
    }
  };

  const handleGetStarted = async () => {
    try {
      await createAnonymousAccount();
      // Account creation success is handled by UserContext
      onComplete();
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Unable to create your sanctuary access. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRetry = async () => {
    try {
      await retryAccountCreation();
      onComplete();
    } catch (error) {
      // Error is handled by UserContext
    }
  };

  const getCreationProgress = (state: UserCreationState) => {
    const stepMap: Record<string, number> = {
      'idle': 0,
      'initializing': 20,
      'creating': 40,
      'authenticating': 60,
      'finalizing': 80,
      'complete': 100,
      'error': 0
    };
    return stepMap[state.step] || state.progress;
  };

  const getCurrentStepMessage = (state: UserCreationState) => {
    const currentCreationStep = creationSteps.find(s => s.step === state.step);
    return state.message || currentCreationStep?.message || 'Setting up your sanctuary...';
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <AnimatePresence mode="wait">
          {!showCreation ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8"
            >
              <DialogHeader className="mb-8">
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Welcome to Veilo 🕊️
                </DialogTitle>
                <DialogDescription className="text-lg text-muted-foreground">
                  Your journey to mental wellness starts here
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-8">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                 <Card className="border border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 shadow-veilo-lg">
                    <CardContent className="p-8">
                      <div className="flex items-start space-x-6">
                        <div 
                          className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex-shrink-0"
                        >
                          <div className="text-primary">
                            {welcomeSteps[currentStep].icon}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-semibold mb-3">
                            {welcomeSteps[currentStep].title}
                          </h3>
                          <p className="text-lg text-muted-foreground leading-relaxed">
                            {welcomeSteps[currentStep].description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {welcomeSteps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentStep
                            ? 'bg-primary scale-125'
                            : index < currentStep
                            ? 'bg-primary/60'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    {currentStep < welcomeSteps.length - 1 ? (
                      <Button onClick={handleNext} className="px-8">
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleNext} 
                        size="lg" 
                        className="px-8 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-veilo-md animate-pulse-glow"
                      >
                        Enter Sanctuary
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="creation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8"
            >
              <DialogHeader className="mb-8 text-center">
                <DialogTitle className="text-2xl font-bold">
                  Creating Your Sanctuary Access
                </DialogTitle>
                <DialogDescription>
                  Setting up your anonymous, secure identity...
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-8">
                <Card className="border border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-veilo-lg">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          {creationState.step === 'error' ? (
                            <div className="w-16 h-16 rounded-full bg-destructive/20 border border-destructive/30 flex items-center justify-center shadow-veilo-md">
                              <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.5, repeat: 2 }}
                                className="text-destructive text-2xl"
                              >
                                ⚠️
                              </motion.div>
                            </div>
                          ) : creationState.step === 'complete' ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-16 h-16 rounded-full bg-success/20 border border-success/30 flex items-center justify-center shadow-veilo-md"
                            >
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-success text-2xl animate-pulse-glow"
                              >
                                ✨
                              </motion.div>
                            </motion.div>
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shadow-veilo-md animate-pulse-glow">
                              <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold mb-2">
                            {getCurrentStepMessage(creationState)}
                          </h3>
                          {creationState.step !== 'error' && creationState.step !== 'complete' && (
                            <Badge variant="secondary" className="px-4 py-1">
                              Step {Math.max(1, Math.ceil(getCreationProgress(creationState) / 25))} of 4
                            </Badge>
                          )}
                        </div>

                        <Progress 
                          value={getCreationProgress(creationState)} 
                          className="h-3"
                        />

                        {creationState.step === 'error' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-4"
                          >
                            <p className="text-destructive text-sm">
                              {creationState.message}
                            </p>
                            <div className="flex justify-center space-x-3">
                              <Button 
                                onClick={handleRetry}
                                variant="outline"
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                Retry
                              </Button>
                              <Button onClick={onComplete} variant="secondary">
                                Continue Offline
                              </Button>
                            </div>
                          </motion.div>
                        )}

                        {creationState.step === 'complete' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-4"
                          >
                            <p className="text-success font-medium">
                              Your sanctuary access is ready! 🎉
                            </p>
                            <Button 
                              onClick={onComplete}
                              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-veilo-md animate-pulse-glow"
                              size="lg"
                            >
                              Enter Veilo
                            </Button>
                          </motion.div>
                        )}

                        {!['error', 'complete'].includes(creationState.step) && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-center"
                          >
                            <Button 
                              onClick={handleGetStarted}
                              variant="ghost"
                              disabled={isLoading}
                              className="text-sm"
                            >
                              {isLoading ? 'Creating...' : 'Skip to Complete'}
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center text-sm text-muted-foreground">
                  <p>🔒 Your data is encrypted and anonymous</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}