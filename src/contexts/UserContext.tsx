
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { generateAlias } from '@/lib/alias';
import { UserRole } from '@/types';

// Define the user type
export interface User {
  id: string;
  alias: string;
  avatarIndex: number;
  loggedIn: boolean;
  role?: UserRole; // Add role to match what's used in AdminPanel.tsx
}

// Define the context type
interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  refreshIdentity: () => void;
}

// Create context with default values
const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  refreshIdentity: () => {},
});

// Custom hook to use the UserContext
export const useUserContext = () => useContext(UserContext);

// Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Check localStorage for saved user
    const savedUser = localStorage.getItem('veilo-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('veilo-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('veilo-user');
    }
  }, [user]);

  const logout = () => {
    setUser(null);
  };

  const refreshIdentity = () => {
    if (user) {
      setUser({
        ...user,
        alias: generateAlias(),
        avatarIndex: Math.floor(Math.random() * 12) + 1,
      });
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, refreshIdentity }}>
      {children}
    </UserContext.Provider>
  );
};
