import { useEffect, useCallback, useRef } from 'react';
import socketService from '@/services/socket';
import { useUserContext } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  const isConnecting = useRef(false);

  const connect = useCallback(async () => {
    if (isConnecting.current || socketService.isSocketConnected()) {
      return;
    }

    isConnecting.current = true;
    
    try {
      const token = localStorage.getItem('veilo-auth-token');
      await socketService.connect(token);
      
      onConnect?.();
      
      // Show connection success for logged in users
      if (user?.loggedIn) {
        toast({
          title: "Connected",
          description: "Real-time features are now active",
        });
      }
    } catch (error) {
      console.error('Socket connection failed:', error);
      onError?.(error);
      
      toast({
        title: "Connection Error",
        description: "Some real-time features may not work",
        variant: "destructive",
      });
    } finally {
      isConnecting.current = false;
    }
  }, [user, toast, onConnect, onError]);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    onDisconnect?.();
  }, [onDisconnect]);

  useEffect(() => {
    if (autoConnect && user?.loggedIn && !socketService.isSocketConnected()) {
      connect();
    }

    return () => {
      // Don't disconnect on unmount as other components might be using it
    };
  }, [autoConnect, user?.loggedIn, connect]);

  return {
    connect,
    disconnect,
    isConnected: socketService.isSocketConnected(),
    socket: socketService
  };
};

// Hook for chat functionality
export const useChatSocket = (sessionId: string, userType: 'user' | 'expert' = 'user') => {
  const { socket } = useSocket();
  const hasJoined = useRef(false);

  useEffect(() => {
    if (socket.isSocketConnected() && sessionId && !hasJoined.current) {
      socket.joinChat(sessionId, userType);
      hasJoined.current = true;
    }

    return () => {
      if (hasJoined.current) {
        socket.leaveChat(sessionId);
        hasJoined.current = false;
      }
    };
  }, [socket, sessionId, userType]);

  const sendMessage = useCallback((content: string, type: 'text' | 'image' | 'voice' = 'text', attachment?: any) => {
    socket.sendMessage(sessionId, content, type, attachment, userType === 'expert');
  }, [socket, sessionId, userType]);

  const startTyping = useCallback(() => {
    socket.startTyping(sessionId);
  }, [socket, sessionId]);

  const stopTyping = useCallback(() => {
    socket.stopTyping(sessionId);
  }, [socket, sessionId]);

  return {
    sendMessage,
    startTyping,
    stopTyping,
    isConnected: socket.isSocketConnected()
  };
};

// Hook for sanctuary functionality
export const useSanctuarySocket = (sanctuaryId: string, participant: { alias?: string; isAnonymous?: boolean }) => {
  const { socket } = useSocket();
  const hasJoined = useRef(false);

  useEffect(() => {
    if (socket.isSocketConnected() && sanctuaryId && !hasJoined.current) {
      socket.joinSanctuary(sanctuaryId, participant);
      hasJoined.current = true;
    }

    return () => {
      if (hasJoined.current) {
        socket.leaveSanctuary(sanctuaryId);
        hasJoined.current = false;
      }
    };
  }, [socket, sanctuaryId, participant]);

  const sendMessage = useCallback((content: string, type: 'text' | 'emoji-reaction' = 'text') => {
    socket.sendSanctuaryMessage(sanctuaryId, content, participant.alias || 'Anonymous', type);
  }, [socket, sanctuaryId, participant.alias]);

  return {
    sendMessage,
    isConnected: socket.isSocketConnected()
  };
};