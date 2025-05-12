
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
  Shield
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

  return (
    <div className={cn(
      "h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800",
      className
    )}>
      {/* Logo */}
      <div className="flex items-center h-16 px-3 justify-between">
        <div className="text-xl font-semibold text-veilo-blue">Veilo</div>
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
                  'flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors',
                  isActive 
                    ? 'bg-veilo-blue-light text-veilo-blue-dark' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5',
                  location.pathname === item.href ? 'text-veilo-blue-dark' : ''
                )} />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Become a Beacon CTA */}
      <div className="p-3 mb-3">
        <NavLink to="/register-expert" onClick={handleNavigation}>
          <Button 
            className="w-full bg-veilo-blue hover:bg-veilo-blue-dark text-white"
          >
            Become a Beacon
          </Button>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
