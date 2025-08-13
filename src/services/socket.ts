import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  connect(token?: string): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        this.socket = io(serverUrl, {
          auth: {
            token: token || localStorage.getItem('auth_token')
          },
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
          console.log('Socket connected:', this.socket?.id);
          this.isConnected = true;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          this.isConnected = false;
        });

        this.socket.on('reconnect', () => {
          console.log('Socket reconnected');
          this.isConnected = true;
        });

      } catch (error) {
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionPromise = null;
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Chat functionality
  joinChat(sessionId: string, userType: 'user' | 'expert'): void {
    if (!this.socket) return;
    
    this.socket.emit('join_chat', { sessionId, userType });
  }

  leaveChat(sessionId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('leave_chat', { sessionId });
  }

  sendMessage(sessionId: string, content: string, type: 'text' | 'image' | 'voice' = 'text', attachment?: any, isExpert = false): void {
    if (!this.socket) return;
    
    this.socket.emit('send_message', {
      sessionId,
      content,
      type,
      attachment,
      isExpert
    });
  }

  startTyping(sessionId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('typing_start', { sessionId });
  }

  stopTyping(sessionId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('typing_stop', { sessionId });
  }

  markMessageDelivered(messageId: string, sessionId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('message_delivered', { messageId, sessionId });
  }

  markMessageRead(messageId: string, sessionId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('message_read', { messageId, sessionId });
  }

  // Sanctuary functionality
  joinSanctuary(sanctuaryId: string, participant: { alias?: string; isAnonymous?: boolean }): void {
    if (!this.socket) return;
    
    this.socket.emit('join_sanctuary', { sanctuaryId, participant });
  }

  leaveSanctuary(sanctuaryId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('leave_sanctuary', { sanctuaryId });
  }

  sendSanctuaryMessage(sanctuaryId: string, content: string, participantAlias: string, type: 'text' | 'emoji-reaction' = 'text'): void {
    if (!this.socket) return;
    
    this.socket.emit('sanctuary_message', {
      sanctuaryId,
      content,
      participantAlias,
      type
    });
  }

  // Voice chat functionality
  requestVoiceChat(targetUserId: string, sessionId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('request_voice_chat', { targetUserId, sessionId });
  }

  respondToVoiceChat(targetUserId: string, accepted: boolean, sessionId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('voice_chat_response', { targetUserId, accepted, sessionId });
  }

  // Event listeners
  onNewMessage(callback: (message: any) => void): void {
    this.socket?.on('new_message', callback);
  }

  onUserJoined(callback: (user: any) => void): void {
    this.socket?.on('user_joined', callback);
  }

  onUserLeft(callback: (user: any) => void): void {
    this.socket?.on('user_left', callback);
  }

  onUserTyping(callback: (data: any) => void): void {
    this.socket?.on('user_typing', callback);
  }

  onMessageStatusUpdate(callback: (data: any) => void): void {
    this.socket?.on('message_status_update', callback);
  }

  onSanctuaryNewMessage(callback: (message: any) => void): void {
    this.socket?.on('sanctuary_new_message', callback);
  }

  onParticipantJoined(callback: (participant: any) => void): void {
    this.socket?.on('participant_joined', callback);
  }

  onParticipantLeft(callback: (participant: any) => void): void {
    this.socket?.on('participant_left', callback);
  }

  onVoiceChatRequest(callback: (request: any) => void): void {
    this.socket?.on('voice_chat_request', callback);
  }

  onVoiceChatResponse(callback: (response: any) => void): void {
    this.socket?.on('voice_chat_response', callback);
  }

  // Remove event listeners
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  removeListener(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;