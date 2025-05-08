
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleToggleSidebar = () => {
      setSidebarOpen(prev => !prev);
    };

    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggleSidebar);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-veilo-blue-light/10 to-veilo-purple-light/10 dark:bg-gray-900 dark:from-veilo-blue-dark/20 dark:to-veilo-purple-dark/20">
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        sidebarOpen ? "md:ml-64" : "ml-0"
      )}>
        <Topbar toggleTheme={toggleTheme} theme={theme} />
        
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
      
      <Sidebar className={sidebarOpen ? "" : "hidden md:flex"} />
    </div>
  );
};

export default Layout;
