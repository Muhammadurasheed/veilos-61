
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Listen for toggle-sidebar events
  useEffect(() => {
    const handleToggleSidebarEvent = () => {
      setSidebarOpen(prev => !prev);
    };

    window.addEventListener('toggle-sidebar', handleToggleSidebarEvent);
    
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggleSidebarEvent);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-veilo-blue-light/10 to-veilo-purple-light/10 dark:bg-gray-900 dark:from-veilo-blue-dark/20 dark:to-veilo-purple-dark/20">
      <Topbar onToggleSidebar={handleToggleSidebar} sidebarOpen={sidebarOpen} />
      
      <div className="flex flex-1 w-full">
        {/* Sidebar - hidden by default, controlled by sidebarOpen state */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:translate-x-0", // On larger screens, keep it in flow if open
          !sidebarOpen && "md:w-0 md:hidden" // When closed on desktop, don't take up space
        )}>
          <Sidebar />
        </div>
        
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
