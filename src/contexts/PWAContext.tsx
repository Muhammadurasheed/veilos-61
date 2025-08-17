import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { logger } from '@/services/logger';

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  installApp: () => Promise<void>;
  updateAvailable: boolean;
  refreshApp: () => void;
}

const PWAContext = createContext<PWAContextType | null>(null);

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};

interface PWAProviderProps {
  children: ReactNode;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ children }) => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const isInstalled = isStandalone || isIOSStandalone;
      
      setIsInstalled(isInstalled);
      
      if (isInstalled) {
        logger.debug('PWA', 'App detected as installed');
      }
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      logger.debug('PWA', 'Install prompt ready');
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      
      logger.info('PWA', 'App installed successfully');
    };

    // Listen for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      logger.debug('PWA', 'App came online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.debug('PWA', 'App went offline');
    };

    // Register service worker and handle updates
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          setSwRegistration(registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  logger.info('PWA', 'App update available');
                }
              });
            }
          });

          // Handle service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'CACHE_UPDATED') {
              setUpdateAvailable(true);
            }
          });

          logger.debug('PWA', 'Service worker registered');
        } catch (error) {
          logger.error('PWA Service worker registration failed', { error });
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker
    registerServiceWorker();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      logger.warn('PWA', 'Install prompt not available');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        logger.info('PWA', 'User accepted install prompt');
      } else {
        logger.info('PWA', 'User dismissed install prompt');
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      logger.error('PWA Install prompt failed', { error });
    }
  };

  const refreshApp = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
    
    logger.info('PWA', 'App refreshed for update');
  };

  // Preload critical resources
  useEffect(() => {
    const preloadCriticalResources = () => {
      const criticalResources = [
        '/veilo-logo.png',
        '/experts/expert-1.jpg',
        '/experts/expert-2.jpg',
        '/experts/expert-3.jpg'
      ];

      criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = resource;
        document.head.appendChild(link);
      });
    };

    if (isOnline) {
      preloadCriticalResources();
    }
  }, [isOnline]);

  // Handle background sync (when online again)
  useEffect(() => {
    if (isOnline && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if ('sync' in registration) {
          // Trigger background sync for any queued actions
          (registration as any).sync.register('background-sync').catch(() => {
            logger.debug('PWA', 'Background sync registration failed');
          });
        }
      });
    }
  }, [isOnline]);

  const contextValue: PWAContextType = {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
    updateAvailable,
    refreshApp
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
    </PWAContext.Provider>
  );
};

// Component for showing PWA install prompt
export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, installApp } = usePWA();

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install Veilo</h3>
          <p className="text-xs opacity-90">
            Get the full app experience with offline access and push notifications.
          </p>
        </div>
        <div className="ml-4 flex gap-2">
          <button 
            onClick={installApp}
            className="bg-white text-purple-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

// Component for showing update available notification
export const PWAUpdateNotification: React.FC = () => {
  const { updateAvailable, refreshApp } = usePWA();

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-4 right-4 bg-green-600 text-white p-3 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Update Available</h3>
          <p className="text-xs opacity-90">
            A new version of Veilo is ready to install.
          </p>
        </div>
        <div className="ml-4">
          <button 
            onClick={refreshApp}
            className="bg-white text-green-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

// Component for offline status indicator
export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-50">
      📡 You're offline. Some features may be limited.
    </div>
  );
};

export default PWAProvider;