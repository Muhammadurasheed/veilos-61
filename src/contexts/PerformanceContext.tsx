import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { logger } from '@/services/logger';

interface PerformanceMetrics {
  pageLoadTime: number;
  componentRenderTime: number;
  apiResponseTimes: Map<string, number>;
  errorCount: number;
  userInteractions: number;
  memoryUsage: number;
}

interface PerformanceContextType {
  metrics: PerformanceMetrics;
  trackPageLoad: (pageName: string) => void;
  trackComponentRender: (componentName: string, renderTime: number) => void;
  trackApiCall: (endpoint: string, duration: number) => void;
  trackError: (error: Error, context?: string) => void;
  trackUserInteraction: (action: string) => void;
  getPerformanceReport: () => PerformanceMetrics;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};

interface PerformanceProviderProps {
  children: ReactNode;
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ children }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    componentRenderTime: 0,
    apiResponseTimes: new Map(),
    errorCount: 0,
    userInteractions: 0,
    memoryUsage: 0
  });

  // Initialize performance monitoring
  useEffect(() => {
    // Track initial page load time
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      const loadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
      setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }));
      
      logger.debug('Page Load', { 
        loadTime,
        domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart,
        ttfb: navigationEntry.responseStart - navigationEntry.fetchStart
      });
    }

    // Monitor memory usage
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        setMetrics(prev => ({ 
          ...prev, 
          memoryUsage: memInfo.usedJSHeapSize / 1024 / 1024 // Convert to MB
        }));
      }
    };

    const memoryInterval = setInterval(monitorMemory, 10000); // Check every 10 seconds

    // Track Core Web Vitals
    trackCoreWebVitals();

    return () => {
      clearInterval(memoryInterval);
    };
  }, []);

  const trackCoreWebVitals = () => {
    // Track Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            logger.debug('LCP', { value: lastEntry.startTime });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Track First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fid = (entry as any).processingStart - entry.startTime;
            logger.debug('FID', { value: fid });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Track Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          if (clsValue > 0) {
            logger.debug('CLS', { value: clsValue });
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Performance Observer not fully supported');
      }
    }
  };

  const trackPageLoad = (pageName: string) => {
    const startTime = performance.now();
    
    // Use requestIdleCallback if available for non-blocking measurement
    const measure = () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }));
      
      logger.debug('Page Navigation', {
        page: pageName,
        loadTime,
        timestamp: Date.now()
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(measure);
    } else {
      setTimeout(measure, 0);
    }
  };

  const trackComponentRender = (componentName: string, renderTime: number) => {
    setMetrics(prev => ({ 
      ...prev, 
      componentRenderTime: prev.componentRenderTime + renderTime 
    }));

    // Only log slow renders (> 16ms for 60fps)
    if (renderTime > 16) {
      logger.debug('Slow Component Render', {
        component: componentName,
        renderTime,
        timestamp: Date.now()
      });
    }
  };

  const trackApiCall = (endpoint: string, duration: number) => {
    setMetrics(prev => {
      const newApiTimes = new Map(prev.apiResponseTimes);
      newApiTimes.set(endpoint, duration);
      return { ...prev, apiResponseTimes: newApiTimes };
    });

    logger.apiResponse('API', endpoint, 200, { duration });

    // Alert on slow API calls (> 3 seconds)
    if (duration > 3000) {
      logger.debug('Slow API Call', {
        endpoint,
        duration,
        timestamp: Date.now()
      });
    }
  };

  const trackError = (error: Error, context?: string) => {
    setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  };

  const trackUserInteraction = (action: string) => {
    setMetrics(prev => ({ ...prev, userInteractions: prev.userInteractions + 1 }));
    
    logger.debug('User Interaction', {
      action,
      timestamp: Date.now(),
      page: window.location.pathname
    });
  };

  const getPerformanceReport = (): PerformanceMetrics => {
    return { ...metrics };
  };

  const contextValue: PerformanceContextType = {
    metrics,
    trackPageLoad,
    trackComponentRender,
    trackApiCall,
    trackError,
    trackUserInteraction,
    getPerformanceReport
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
};

// HOC for tracking component render performance
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function WrappedComponent(props: P) {
    const { trackComponentRender } = usePerformance();
    
    useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        trackComponentRender(componentName, endTime - startTime);
      };
    }, [trackComponentRender]);

    return <Component {...props} />;
  };
}

// Hook for measuring async operations
export function usePerformanceMeasure() {
  const { trackApiCall } = usePerformance();
  
  return {
    measureApiCall: async <T,>(
      endpoint: string, 
      apiCall: () => Promise<T>
    ): Promise<T> => {
      const startTime = performance.now();
      try {
        const result = await apiCall();
        const duration = performance.now() - startTime;
        trackApiCall(endpoint, duration);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        trackApiCall(endpoint, duration);
        throw error;
      }
    }
  };
}

export default PerformanceProvider;