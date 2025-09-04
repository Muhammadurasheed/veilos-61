
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';
  import { 
  Home,
  MessageSquare,
  Calendar,
  User,
  Settings,
  Shield,
  X,
  ChevronRight,
  LayoutDashboard,
  Users,
  UserCog,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  // Set collapsed to true by default for all devices
  const [collapsed, setCollapsed] = useState(true);
  
  // Effect to collapse sidebar on mobile by default
  useEffect(() => {
    // Listen for toggle-sidebar events
    const handleToggleSidebar = () => {
      setCollapsed(prev => !prev);
    };
    
    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggleSidebar);
    };
  }, []);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home
    },
    {
      name: 'Community Feed',
      href: '/feed',
      icon: MessageSquare
    },
    {
      name: 'Create Sanctuary',
      href: '/sanctuary',
      icon: Shield
    },
    {
      name: 'My Sanctuaries',
      href: '/my-sanctuaries',
      icon: LayoutDashboard
    },
    {
      name: 'Find Experts',
      href: '/beacons',
      icon: Users
    },
    {
      name: 'My Sessions',
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
  if (user?.role === 'beacon') {
    navigationItems.splice(4, 0, {
      name: 'Expert Dashboard',
      href: '/expert-dashboard',
      icon: UserCog
    });
  }

  // Admin link for admin users
  if (user?.role === 'admin') {
    navigationItems.push({
      name: 'Admin',
      href: '/admin',
      icon: ShieldCheck
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

  const sidebarVariants = {
    open: { 
      x: 0,
      width: isMobile ? '100%' : '16rem',
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 30
      }
    },
    collapsed: { 
      x: isMobile ? '-100%' : 0,
      width: isMobile ? '100%' : '4rem',
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 30
      }
    }
  };

  return (
    <motion.div
      variants={sidebarVariants}
      initial="collapsed"
      animate={collapsed ? "collapsed" : "open"}
      className={cn(
        "h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed left-0 top-0 bottom-0 z-40 shadow-md",
        isMobile && collapsed ? "-translate-x-full" : "translate-x-0",
        className
      )}
    >
      {/* Overlay for mobile */}
      {!collapsed && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-30" 
          onClick={toggleCollapse}
        />
      )}

      <div className="relative h-full flex flex-col">
        {/* Logo and collapse button */}
        <div className="flex items-center h-16 px-3 justify-between border-b border-gray-100 dark:border-gray-800">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              >
                Veilo
              </motion.div>
            )}
          </AnimatePresence>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full"
            onClick={toggleCollapse}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              isMobile ? <X className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 rotate-180" />
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
                      ? 'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed ? 'justify-center' : 'space-x-3'
                  )}
                >
                  <item.icon className={cn(
                    'h-5 w-5',
                    location.pathname === item.href 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  )} />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium truncate"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
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
              variant="default"
              className={cn(
                "w-full transition-all shadow-md",
                collapsed && "p-2"
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
    </motion.div>
  );
};

export default Sidebar;
