
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateAlias } from '@/lib/alias';
import { useUserContext } from '@/contexts/UserContext';

const Header = () => {
  const { user, setUser, logout } = useUserContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogin = () => {
    // Generate a new anonymous user
    const alias = generateAlias();
    const avatarIndex = Math.floor(Math.random() * 12) + 1;
    
    setUser({
      id: crypto.randomUUID(),
      alias,
      avatarIndex,
      loggedIn: true
    });
  };

  return (
    <header className="py-4 px-6 bg-white bg-opacity-80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
      <div className="container flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-veilo-blue to-veilo-purple-light flex items-center justify-center">
            <span className="text-white font-bold">V</span>
          </div>
          <span className="text-xl font-semibold text-veilo-blue-dark">Veilo</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-600 hover:text-veilo-blue transition-colors">Home</Link>
          <Link to="/feed" className="text-gray-600 hover:text-veilo-blue transition-colors">Feed</Link>
          <Link to="/beacons" className="text-gray-600 hover:text-veilo-blue transition-colors">Beacons</Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          {user?.loggedIn ? (
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full p-0 h-10 w-10">
                  <Avatar className="h-9 w-9 transition-all hover:ring-2 hover:ring-veilo-blue">
                    <AvatarImage src={`/avatars/avatar-${user.avatarIndex}.svg`} alt={user.alias} />
                    <AvatarFallback className="bg-veilo-blue-light text-veilo-blue-dark">
                      {user.alias.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                  {user.alias}
                </div>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-500 hover:text-red-600">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleLogin} variant="outline" className="bg-white shadow-sm border-veilo-blue-light text-veilo-blue-dark hover:bg-veilo-blue hover:text-white">
              Enter Anonymously
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
