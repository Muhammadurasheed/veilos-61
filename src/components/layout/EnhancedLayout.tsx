import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { SEOHead, pageSEOConfigs } from '@/components/seo/SEOHead';
import { usePerformance } from '@/contexts/PerformanceContext';
import { usePWA } from '@/contexts/PWAContext';

interface LayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
  seoConfig?: any;
}

const Layout: React.FC<LayoutProps> = ({ children, hideSidebar, seoConfig }) => {
  const location = useLocation();
  const { trackPageLoad } = usePerformance();
  const { isOnline } = usePWA();

  React.useEffect(() => {
    // Track page navigation performance
    trackPageLoad(location.pathname);
  }, [location.pathname, trackPageLoad]);

  // Get page-specific SEO config
  const getPageSEOConfig = () => {
    if (seoConfig) return seoConfig;

    const path = location.pathname;
    if (path === '/') return pageSEOConfigs.home;
    if (path === '/beacons') return pageSEOConfigs.beacons;
    if (path.startsWith('/sanctuary')) return pageSEOConfigs.sanctuary;
    if (path.startsWith('/expert/')) return pageSEOConfigs.expertProfile;
    
    return {};
  };

  return (
    <>
      <SEOHead {...getPageSEOConfig()} />
      <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 ${!isOnline ? 'pt-10' : ''}`}>
        <main className="relative">
          {children}
        </main>
      </div>
    </>
  );
};

export default Layout;