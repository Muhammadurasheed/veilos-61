
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUserContext } from '@/contexts/UserContext';
import { 
  Home,
  MessageSquare,
  Calendar,
  User,
  Settings,
  Shield,
  Menu,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserRole } from '@/types';

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const { user } = useUserContext();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);

  const navigationItems = [
    {
      name: 'Home',
      href: '/',
      icon: Home
    },
    {
      name: 'Feed',
      href: '/feed',
      icon: MessageSquare
    },
    {
      name: 'Beacons',
      href: '/beacons',
      icon: Shield
    },
    {
      name: 'Sessions',
      href: '/sessions',
      icon: Calendar
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings
    }
  ];

  // Add expert dashboard for beacon users
  if (user?.role === UserRole.BEACON || user?.expertId) {
    navigationItems.splice(4, 0, {
      name: 'Expert Dashboard',
      href: '/expert-dashboard',
      icon: Shield
    });
  }

  // Admin link for admin users
  if (user?.role === UserRole.ADMIN) {
    navigationItems.push({
      name: 'Admin',
      href: '/admin',
      icon: Shield
    });
  }

  // Close sidebar on navigation on mobile
  const handleNavigation = () => {
    if (isMobile) {
      // Dispatch an event to close the sidebar
      window.dispatchEvent(new CustomEvent('toggle-sidebar'));
    }
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={cn(
      "h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 relative transition-all duration-300 flex flex-col",
      collapsed ? "w-20" : "w-64",
      className
    )}>
      {/* Logo and collapse button */}
      <div className="flex items-center h-16 px-3 justify-between border-b border-gray-100 dark:border-gray-800">
        <div className={cn(
          "text-xl font-semibold text-veilo-blue transition-opacity",
          collapsed ? "opacity-0 w-0" : "opacity-100"
        )}>Veilo</div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full"
          onClick={toggleCollapse}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                onClick={handleNavigation}
                className={({ isActive }) => cn(
                  'flex items-center px-3 py-2 rounded-lg transition-all',
                  isActive 
                    ? 'bg-veilo-blue-light text-veilo-blue-dark dark:bg-veilo-blue-dark/30 dark:text-veilo-blue-light'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                  collapsed ? 'justify-center' : 'space-x-3'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5',
                  location.pathname === item.href 
                    ? 'text-veilo-blue-dark dark:text-veilo-blue-light' 
                    : 'text-gray-500 dark:text-gray-400'
                )} />
                {!collapsed && <span className="font-medium truncate">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Become a Beacon CTA */}
      <div className={cn(
        "p-3 mb-3 transition-all",
        collapsed && "px-1"
      )}>
        <NavLink to="/register-expert" onClick={handleNavigation}>
          <Button 
            className={cn(
              "bg-veilo-blue hover:bg-veilo-blue-dark text-white w-full transition-all",
              collapsed && "w-full p-2"
            )}
          >
            {collapsed ? (
              <Shield className="h-5 w-5" />
            ) : (
              "Become a Beacon"
            )}
          </Button>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
