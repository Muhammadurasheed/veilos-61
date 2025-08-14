import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { logger } from '@/services/logger';

interface AppState {
  isFirstLaunch: boolean;
  hasCompletedOnboarding: boolean;
  isInitialized: boolean;
  currentStep: 'loading' | 'onboarding' | 'main';
}

interface AppStateContextType {
  appState: AppState;
  markOnboardingComplete: () => void;
  resetApp: () => void;
  setInitialized: () => void;
}

const APP_STATE_KEY = 'veilo-app-state';

const defaultAppState: AppState = {
  isFirstLaunch: true,
  hasCompletedOnboarding: false,
  isInitialized: false,
  currentStep: 'loading'
};

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [appState, setAppState] = useState<AppState>(defaultAppState);

  // Initialize app state from localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(APP_STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setAppState(prev => ({
          ...prev,
          ...parsed,
          isInitialized: true,
          currentStep: parsed.hasCompletedOnboarding ? 'main' : 'onboarding'
        }));
        logger.info('App state loaded from localStorage', parsed);
      } else {
        // First time user
        setAppState(prev => ({
          ...prev,
          isInitialized: true,
          currentStep: 'onboarding'
        }));
        logger.info('First launch detected - showing onboarding');
      }
    } catch (error) {
      logger.error('Error loading app state', error);
      setAppState(prev => ({ ...prev, isInitialized: true, currentStep: 'onboarding' }));
    }
  }, []);

  // Save app state to localStorage whenever it changes
  useEffect(() => {
    if (appState.isInitialized) {
      try {
        const stateToSave = {
          isFirstLaunch: appState.isFirstLaunch,
          hasCompletedOnboarding: appState.hasCompletedOnboarding
        };
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(stateToSave));
        logger.debug('App state saved to localStorage', stateToSave);
      } catch (error) {
        logger.error('Error saving app state', error);
      }
    }
  }, [appState]);

  const markOnboardingComplete = () => {
    setAppState(prev => ({
      ...prev,
      isFirstLaunch: false,
      hasCompletedOnboarding: true,
      currentStep: 'main'
    }));
    logger.userAction('Onboarding completed');
  };

  const resetApp = () => {
    localStorage.removeItem(APP_STATE_KEY);
    setAppState(defaultAppState);
    logger.userAction('App reset to initial state');
  };

  const setInitialized = () => {
    setAppState(prev => ({ ...prev, isInitialized: true }));
  };

  const value: AppStateContextType = {
    appState,
    markOnboardingComplete,
    resetApp,
    setInitialized
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};