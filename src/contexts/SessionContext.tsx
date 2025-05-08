
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Session {
  id: string;
  expertId: string;
  userId: string;
  userAlias: string;
  expertName: string;
  expertAvatarUrl: string;
  status: 'requested' | 'scheduled' | 'active' | 'completed' | 'canceled';
  sessionType: 'chat' | 'video' | 'voice';
  scheduledTime?: string;
  createdAt: string;
  lastMessageAt?: string;
}

interface SessionContextType {
  sessions: Session[];
  activeSessions: Session[];
  requestedSessions: Session[];
  scheduledSessions: Session[];
  createSession: (expertId: string, sessionType: 'chat' | 'video' | 'voice', initialMessage?: string) => Promise<string | null>;
  acceptSession: (sessionId: string) => Promise<boolean>;
  cancelSession: (sessionId: string) => Promise<boolean>;
  completeSession: (sessionId: string, rating?: number, feedback?: string) => Promise<boolean>;
  scheduleSession: (expertId: string, scheduledTime: Date) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter sessions by status
  const activeSessions = sessions.filter(session => session.status === 'active');
  const requestedSessions = sessions.filter(session => session.status === 'requested');
  const scheduledSessions = sessions.filter(session => session.status === 'scheduled');

  useEffect(() => {
    // This would be a real API call to fetch user's sessions
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        
        // Simulated API response
        const mockSessions: Session[] = [
          {
            id: 'session-123',
            expertId: 'expert-1',
            userId: 'user-1',
            userAlias: 'MindfulSeeker42',
            expertName: 'Dr. Emma Wilson',
            expertAvatarUrl: '/experts/expert-1.jpg',
            status: 'active',
            sessionType: 'chat',
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
          },
          {
            id: 'session-456',
            expertId: 'expert-2',
            userId: 'user-1',
            userAlias: 'MindfulSeeker42',
            expertName: 'Dr. Michael Chen',
            expertAvatarUrl: '/experts/expert-2.jpg',
            status: 'scheduled',
            sessionType: 'video',
            scheduledTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 1 day from now
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
          },
          {
            id: 'session-789',
            expertId: 'expert-3',
            userId: 'user-1',
            userAlias: 'MindfulSeeker42',
            expertName: 'Sarah Johnson',
            expertAvatarUrl: '/experts/expert-3.jpg',
            status: 'completed',
            sessionType: 'chat',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
          }
        ];
        
        setSessions(mockSessions);
        setError(null);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load sessions');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load sessions. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSessions();
  }, [toast]);

  const createSession = async (expertId: string, sessionType: 'chat' | 'video' | 'voice', initialMessage?: string): Promise<string | null> => {
    try {
      // This would be a real API call to create a session
      console.log(`Creating ${sessionType} session with expert ${expertId}`);
      
      // Simulate API response
      const newSession: Session = {
        id: `session-${Date.now()}`,
        expertId,
        userId: 'user-1',
        userAlias: 'MindfulSeeker42',
        expertName: 'Dr. Emma Wilson',
        expertAvatarUrl: '/experts/expert-1.jpg',
        status: 'requested',
        sessionType,
        createdAt: new Date().toISOString()
      };
      
      setSessions(prev => [...prev, newSession]);
      
      toast({
        title: 'Session Requested',
        description: 'Your session request has been sent to the expert.',
      });
      
      return newSession.id;
    } catch (err) {
      console.error('Error creating session:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create session. Please try again.',
      });
      return null;
    }
  };

  const acceptSession = async (sessionId: string): Promise<boolean> => {
    try {
      // This would be a real API call to accept a session
      console.log(`Accepting session ${sessionId}`);
      
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'active' } 
            : session
        )
      );
      
      toast({
        title: 'Session Active',
        description: 'You have accepted the session.',
      });
      
      return true;
    } catch (err) {
      console.error('Error accepting session:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to accept session. Please try again.',
      });
      return false;
    }
  };

  const cancelSession = async (sessionId: string): Promise<boolean> => {
    try {
      // This would be a real API call to cancel a session
      console.log(`Canceling session ${sessionId}`);
      
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'canceled' } 
            : session
        )
      );
      
      toast({
        title: 'Session Canceled',
        description: 'The session has been canceled.',
      });
      
      return true;
    } catch (err) {
      console.error('Error canceling session:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel session. Please try again.',
      });
      return false;
    }
  };

  const completeSession = async (sessionId: string, rating?: number, feedback?: string): Promise<boolean> => {
    try {
      // This would be a real API call to complete a session
      console.log(`Completing session ${sessionId}`, { rating, feedback });
      
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'completed' } 
            : session
        )
      );
      
      toast({
        title: 'Session Completed',
        description: 'Thank you for using our service.',
      });
      
      return true;
    } catch (err) {
      console.error('Error completing session:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete session. Please try again.',
      });
      return false;
    }
  };

  const scheduleSession = async (expertId: string, scheduledTime: Date): Promise<string | null> => {
    try {
      // This would be a real API call to schedule a session
      console.log(`Scheduling session with expert ${expertId} at ${scheduledTime.toISOString()}`);
      
      // Simulate API response
      const newSession: Session = {
        id: `session-${Date.now()}`,
        expertId,
        userId: 'user-1',
        userAlias: 'MindfulSeeker42',
        expertName: 'Dr. Emma Wilson',
        expertAvatarUrl: '/experts/expert-1.jpg',
        status: 'scheduled',
        sessionType: 'chat',
        scheduledTime: scheduledTime.toISOString(),
        createdAt: new Date().toISOString()
      };
      
      setSessions(prev => [...prev, newSession]);
      
      toast({
        title: 'Session Scheduled',
        description: `Your session has been scheduled for ${scheduledTime.toLocaleString()}.`,
      });
      
      return newSession.id;
    } catch (err) {
      console.error('Error scheduling session:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to schedule session. Please try again.',
      });
      return null;
    }
  };

  const value: SessionContextType = {
    sessions,
    activeSessions,
    requestedSessions,
    scheduledSessions,
    createSession,
    acceptSession,
    cancelSession,
    completeSession,
    scheduleSession,
    isLoading,
    error
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};
