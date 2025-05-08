
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUserContext } from '@/contexts/UserContext';
import { 
  ChevronLeft, 
  ChevronRight,
  Home,
  MessageSquare,
  Calendar,
  User,
  Settings,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-mobile';

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const { user } = useUserContext();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [collapsed, setCollapsed] = useState(isMobile);

  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

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
  if (user?.role === 'ADMIN') {
    navigationItems.push({
      name: 'Admin',
      href: '/admin',
      icon: Shield
    });
  }

  return (
    <aside 
      className={cn(
        'h-screen fixed left-0 top-0 z-30 flex flex-col transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-3',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="text-xl font-semibold text-veilo-blue">Veilo</div>
        )}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleCollapse}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) => cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors',
                  isActive 
                    ? 'bg-veilo-blue-light text-veilo-blue-dark' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                  collapsed ? 'justify-center' : ''
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5',
                  location.pathname === item.href ? 'text-veilo-blue-dark' : ''
                )} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Become a Beacon CTA */}
      <div className={cn(
        'p-3 mb-3',
        collapsed ? 'items-center justify-center' : ''
      )}>
        {collapsed ? (
          <NavLink to="/register-expert">
            <Button 
              variant="ghost"
              size="icon"
              className="bg-veilo-blue hover:bg-veilo-blue-dark text-white rounded-full w-10 h-10"
            >
              <Shield className="h-5 w-5" />
            </Button>
          </NavLink>
        ) : (
          <NavLink to="/register-expert">
            <Button 
              className="w-full bg-veilo-blue hover:bg-veilo-blue-dark text-white"
            >
              Become a Beacon
            </Button>
          </NavLink>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
