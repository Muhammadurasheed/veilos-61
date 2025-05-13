
import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  hideSidebar?: boolean;
  hideHeader?: boolean;
  className?: string;
}

const Layout = ({
  children,
  hideFooter,
  hideSidebar,
  hideHeader,
  className,
}: LayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // Listen for sidebar toggle events
  useEffect(() => {
    const handleToggleSidebar = () => {
      setSidebarCollapsed(prev => !prev);
    };
    
    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggleSidebar);
    };
  }, []);
  
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {!hideSidebar && <Sidebar />}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "flex flex-col min-h-screen w-full transition-all duration-300",
          !hideSidebar && (isMobile ? "ml-0" : sidebarCollapsed ? "ml-16" : "ml-64"),
        )}
      >
        {!hideHeader && <Header />}
        <main className={cn("flex-grow", className)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        {!hideFooter && <Footer />}
      </motion.div>
    </div>
  );
};

export default Layout;
