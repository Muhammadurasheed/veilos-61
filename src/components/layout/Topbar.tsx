
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MessageSquare, Calendar, Sun, Moon, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUserContext } from '@/contexts/UserContext';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { DrawerTrigger } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer } from '@/components/ui/drawer';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { useTranslation } from 'react-i18next';

interface TopbarProps {
  toggleTheme: () => void;
  theme: 'dark' | 'light';
}

const Topbar = ({ toggleTheme, theme }: TopbarProps) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const [notificationCount] = useState(3); // This would come from a real notification system
  const [messageCount] = useState(2); // This would come from a real messaging system
  const isMobile = useIsMobile();

  return (
    <div className="h-16 px-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
      {/* Logo and Menu Button */}
      <div className="flex items-center">
        {isMobile ? (
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
          </Drawer>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => {
              // This will be handled by the Layout component to toggle sidebar
              const event = new CustomEvent('toggle-sidebar');
              window.dispatchEvent(event);
            }}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <span className="text-xl font-semibold text-veilo-blue">Veilo</span>
      </div>

      <div className="flex items-center space-x-3 ml-auto">
        {/* Language Selector */}
        <LanguageSelector />
        
        {/* Calendar / Schedule */}
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link to="/sessions">
            <Calendar className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Link>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-4 text-center border-b">
              <h3 className="font-medium">{t('profile.notifications')}</h3>
            </div>
            <div className="max-h-72 overflow-y-auto">
              <div className="p-3 border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <p className="text-sm">Your expert registration has been approved!</p>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
              <div className="p-3 border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <p className="text-sm">New session request from WiseSoul42</p>
                <span className="text-xs text-gray-500">Yesterday</span>
              </div>
              <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <p className="text-sm">Your post received a response from a verified expert</p>
                <span className="text-xs text-gray-500">3 days ago</span>
              </div>
            </div>
            <div className="p-2 text-center border-t">
              <Link to="/notifications" className="text-sm text-veilo-blue hover:underline">
                View all notifications
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Messages */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <MessageSquare className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              {messageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-veilo-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {messageCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-4 text-center border-b">
              <h3 className="font-medium">{t('navigation.feed')}</h3>
            </div>
            <div className="max-h-72 overflow-y-auto">
              <div className="p-3 border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/avatar-2.svg" alt="User" />
                    <AvatarFallback>GS</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">GentleShadow78</p>
                    <p className="text-xs text-gray-500 truncate">Hi, are you available for a chat session?</p>
                  </div>
                  <span className="text-xs text-gray-500">10m</span>
                </div>
              </div>
              <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/avatar-3.svg" alt="User" />
                    <AvatarFallback>PS</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">PeacefulWind23</p>
                    <p className="text-xs text-gray-500 truncate">Thank you for your support yesterday...</p>
                  </div>
                  <span className="text-xs text-gray-500">1d</span>
                </div>
              </div>
            </div>
            <div className="p-2 text-center border-t">
              <Link to="/chat" className="text-sm text-veilo-blue hover:underline">
                View all messages
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          className="text-gray-700 dark:text-gray-300"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={`/avatars/avatar-${user?.avatarIndex || 1}.svg`} 
                  alt={user?.alias || 'User'} 
                />
                <AvatarFallback>
                  {user?.alias?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-2 border-b">
              <p className="font-medium">{user?.alias || 'Anonymous User'}</p>
              <p className="text-xs text-gray-500">{user?.role || 'shadow'}</p>
            </div>
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">{t('navigation.profile')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">{t('navigation.settings')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/logout" className="cursor-pointer text-red-500">{t('auth.logout')}</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Topbar;
