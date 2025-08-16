import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Shield, Heart, Users, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useUserContext, UserCreationState } from '@/contexts/UserContext';
import { useAppState } from '@/contexts/AppStateContext';
import { toast } from '@/hooks/use-toast';

interface OnboardingFlowProps {
  isOpen: boolean;
  onComplete: () => void;
}

const onboardingSteps = [
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: "Welcome to Veilo",
    subtitle: "Your Mental Health Sanctuary",
    description: "A safe, anonymous space where you can connect with others, share your thoughts, and find professional support when you need it most.",
    color: "hsl(var(--primary))"
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Complete Privacy",
    subtitle: "Your Identity is Protected",
    description: "We never ask for personal information. Create an anonymous identity and connect authentically without fear of judgment.",
    color: "hsl(var(--accent))"
  },
  {
    icon: <Heart className="w-8 h-8" />,
    title: "Safe Environment",
    subtitle: "AI-Powered Moderation",
    description: "Our advanced AI ensures all conversations remain respectful, supportive, and free from harmful content.",
    color: "hsl(var(--secondary))"
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Real Connections",
    subtitle: "Community & Professional Support",
    description: "Join live sanctuary sessions with peers or book private consultations with verified mental health experts.",
    color: "hsl(var(--primary))"
  }
];

export function OnboardingFlow({ isOpen, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const { createAnonymousAccount, creationState, retryAccountCreation, isLoading } = useUserContext();
  const { markOnboardingComplete } = useAppState();

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCreatingAccount(true);
      handleCreateAccount();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipToAccount = () => {
    setIsCreatingAccount(true);
    handleCreateAccount();
  };

  const handleCreateAccount = async () => {
    try {
      const success = await createAnonymousAccount();
      if (success) {
        // Mark onboarding as complete in app state
        markOnboardingComplete();
        
        // Wait a moment for the success animation then complete
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
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
      const success = await retryAccountCreation();
      if (success) {
        markOnboardingComplete();
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
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
    const messages: Record<string, string> = {
      'idle': 'Ready to begin...',
      'initializing': 'Preparing your sanctuary...',
      'creating': 'Crafting your anonymous identity...',
      'authenticating': 'Securing your connection...',
      'finalizing': 'Welcome to your safe space...',
      'complete': 'Ready to begin your journey! 🎉',
      'error': state.message || 'Something went wrong. Please try again.'
    };
    return state.message || messages[state.step] || 'Setting up your sanctuary...';
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-background via-background to-primary/5">
        <AnimatePresence mode="wait">
          {!isCreatingAccount ? (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8"
            >
              <DialogHeader className="mb-8 text-center">
                <DialogTitle className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Welcome to Veilo 🕊️
                </DialogTitle>
                <DialogDescription className="text-lg text-muted-foreground mt-2">
                  Your journey to mental wellness starts here
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-8">
                {/* Step Content */}
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <Card className="border border-primary/20 bg-gradient-to-br from-background via-background/80 to-primary/10 shadow-lg">
                    <CardContent className="p-10">
                      <div className="flex items-start space-x-8">
                        <div 
                          className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex-shrink-0 shadow-md"
                        >
                          <div className="text-primary">
                            {onboardingSteps[currentStep].icon}
                          </div>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-3xl font-bold mb-2 text-foreground">
                              {onboardingSteps[currentStep].title}
                            </h3>
                            <h4 className="text-xl font-medium text-primary mb-4">
                              {onboardingSteps[currentStep].subtitle}
                            </h4>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                              {onboardingSteps[currentStep].description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Progress Indicators */}
                <div className="flex items-center justify-center space-x-3">
                  {onboardingSteps.map((_, index) => (
                    <motion.div
                      key={index}
                      initial={false}
                      animate={{
                        scale: index === currentStep ? 1.5 : 1,
                      }}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? 'bg-primary'
                          : index < currentStep
                            ? 'bg-primary/60'
                            : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-3">
                    {currentStep > 0 && (
                      <Button 
                        onClick={handlePrevious}
                        variant="outline"
                        className="px-6"
                      >
                        Previous
                      </Button>
                    )}
                    
                    <Button 
                      onClick={handleSkipToAccount}
                      variant="ghost"
                      className="px-6 text-muted-foreground hover:text-foreground"
                    >
                      Skip Introduction
                    </Button>
                  </div>

                  <div>
                    {currentStep < onboardingSteps.length - 1 ? (
                      <Button 
                        onClick={handleNext} 
                        className="px-8 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleNext} 
                        size="lg" 
                        className="px-12 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg text-lg font-semibold"
                      >
                        Create My Sanctuary
                        <Sparkles className="w-5 h-5 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="account-creation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8"
            >
              <DialogHeader className="mb-8 text-center">
                <DialogTitle className="text-3xl font-bold">
                  Creating Your Anonymous Identity
                </DialogTitle>
                <DialogDescription className="text-lg">
                  Setting up your secure, private sanctuary access...
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-8">
                <Card className="border border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-lg">
                  <CardContent className="p-10">
                    <div className="space-y-8">
                      {/* Status Icon */}
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          {creationState.step === 'error' ? (
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 0.5, repeat: 2 }}
                              className="w-20 h-20 rounded-full bg-destructive/20 border-2 border-destructive/30 flex items-center justify-center shadow-lg"
                            >
                              <div className="text-destructive text-3xl">⚠️</div>
                            </motion.div>
                          ) : creationState.step === 'complete' ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200 }}
                              className="w-20 h-20 rounded-full bg-success/20 border-2 border-success/30 flex items-center justify-center shadow-lg"
                            >
                              <CheckCircle2 className="w-10 h-10 text-success" />
                            </motion.div>
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center shadow-lg">
                              <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Message */}
                      <div className="space-y-6">
                        <div className="text-center">
                          <h3 className="text-2xl font-semibold mb-3 text-foreground">
                            {getCurrentStepMessage(creationState)}
                          </h3>
                          {creationState.step !== 'error' && creationState.step !== 'complete' && (
                            <Badge variant="secondary" className="px-6 py-2 text-sm">
                              Step {Math.max(1, Math.ceil(getCreationProgress(creationState) / 25))} of 4
                            </Badge>
                          )}
                        </div>

                        <div className="max-w-md mx-auto">
                          <Progress 
                            value={getCreationProgress(creationState)} 
                            className="h-4 bg-muted/50"
                          />
                        </div>

                        {/* Error State Actions */}
                        {creationState.step === 'error' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-6"
                          >
                            <p className="text-destructive font-medium">
                              {creationState.message || "Connection failed. Please try again."}
                            </p>
                            <div className="flex justify-center space-x-4">
                              <Button 
                                onClick={handleRetry}
                                disabled={isLoading}
                                className="px-8 bg-primary hover:bg-primary/90"
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Retrying...
                                  </>
                                ) : (
                                  'Try Again'
                                )}
                              </Button>
                              <Button 
                                onClick={() => {
                                  markOnboardingComplete();
                                  onComplete();
                                }}
                                variant="outline"
                                className="px-8"
                              >
                                Continue Offline
                              </Button>
                            </div>
                          </motion.div>
                        )}

                        {/* Success State */}
                        {creationState.step === 'complete' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-6"
                          >
                            <div>
                              <p className="text-success font-semibold text-xl mb-2">
                                Your sanctuary is ready! 🎉
                              </p>
                              <p className="text-muted-foreground">
                                Welcome to Veilo - your safe space for mental wellness
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy Notice */}
                <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-4">
                  <p className="flex items-center justify-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Your data is encrypted, anonymous, and completely private
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}