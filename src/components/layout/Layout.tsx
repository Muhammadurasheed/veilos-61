
import { useTheme } from '@/contexts/ThemeContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-veilo-blue-light/10 to-veilo-purple-light/10 dark:bg-gray-900 dark:from-veilo-blue-dark/20 dark:to-veilo-purple-dark/20">
      <Sidebar />
      
      <div className="ml-16 md:ml-64 flex flex-col flex-1">
        <Topbar toggleTheme={toggleTheme} theme={theme} />
        
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
