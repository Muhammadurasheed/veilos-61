import React from 'react';
import { useAppState } from '@/contexts/AppStateContext';
import { useUserContext } from '@/contexts/UserContext';
import { EnhancedLoadingState } from '@/components/ui/enhanced-loading-states';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { logger } from '@/services/logger';

interface SmartRouterProps {
  children: React.ReactNode;
}

export const SmartRouter: React.FC<SmartRouterProps> = ({ children }) => {
  const { appState, markOnboardingComplete } = useAppState();
  const { isLoading: userLoading, user } = useUserContext();

  // Show loading while app is initializing
  if (!appState.isInitialized || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <EnhancedLoadingState 
          variant="connection" 
          message="Initializing your sanctuary..." 
        />
      </div>
    );
  }

  // Show onboarding for first-time users
  if (appState.currentStep === 'onboarding' && !appState.hasCompletedOnboarding) {
    logger.debug('Showing onboarding flow for first-time user');
    return (
      <OnboardingFlow 
        isOpen={true} 
        onComplete={() => {
          logger.userAction('Onboarding completed successfully');
          // Don't call markOnboardingComplete here, it's handled in OnboardingFlow
        }} 
      />
    );
  }

  // Show main app for returning users or after onboarding
  logger.debug('Showing main application', { 
    hasUser: !!user, 
    hasCompletedOnboarding: appState.hasCompletedOnboarding 
  });
  
  return <>{children}</>;
};