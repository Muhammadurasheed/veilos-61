import { useEffect, useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/useSocket';

interface NotificationData {
  id: string;
  type: 'expert_application' | 'status_update' | 'bulk_action' | 'admin_update';
  message: string;
  timestamp: string;
  data?: any;
}

export const useRealTimeNotifications = () => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const { socket, isConnected } = useSocket({ autoConnect: true });

  useEffect(() => {
    if (!user || !isConnected || !socket) {
      console.log('Real-time notifications not ready:', { user: !!user, isConnected, socket: !!socket });
      return;
    }

    console.log('🚀 Setting up real-time notifications for user:', user.role);

    // Join appropriate channels based on user role
    if (user.role === 'admin') {
      console.log('🔑 Admin joining admin panel channel...');
      
      // Emit join admin panel - same pattern as sanctuary
      socket.emit('join_admin_panel');
      
      // Listen for admin panel join confirmation
      const handleAdminPanelJoined = (data) => {
        console.log('📢 Admin panel join response:', data);
        if (data.success) {
          console.log('✅ Successfully joined admin panel for real-time notifications');
        } else {
          console.error('❌ Failed to join admin panel:', data.error);
        }
      };
      
      socket.on('admin_panel_joined', handleAdminPanelJoined);
      
      // Listen for expert application submissions - same pattern as sanctuary submissions
      const handleExpertApplication = (data) => {
        console.log('📨 Received expert application notification:', data);
        const notification = {
          id: `expert_app_${Date.now()}`,
          type: 'expert_application' as const,
          message: `New expert application from ${data.expert.name}`,
          timestamp: data.timestamp,
          data: data.expert
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]);
        
        toast({
          title: '🎯 New Expert Application',
          description: `${data.expert.name} has applied to become an expert`,
          duration: 8000,
        });
        
        console.log('✅ Expert application notification processed and displayed');
      };
      
      socket.on('expert_application_submitted', handleExpertApplication);
      
      // Listen for admin panel updates
      const handleAdminUpdate = (data) => {
        console.log('📊 Received admin panel update:', data);
        const notification = {
          id: `admin_update_${Date.now()}`,
          type: 'admin_update' as const,
          message: getAdminUpdateMessage(data),
          timestamp: data.timestamp,
          data
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]);
      };
      
      socket.on('admin_panel_update', handleAdminUpdate);
      
      // Listen for bulk action completions
      const handleBulkAction = (data) => {
        console.log('⚡ Received bulk action completion:', data);
        toast({
          title: '⚡ Bulk Action Completed',
          description: `${data.action} applied to ${data.expertCount} experts`,
          duration: 3000,
        });
      };
      
      socket.on('bulk_action_completed', handleBulkAction);
      
    } else if (user.role === 'beacon' && user.expertId) {
      // For experts, join their notification channel
      console.log('🎯 Expert joining notification channel for expertId:', user.expertId);
      socket.emit('join_expert_notifications', { expertId: user.expertId });
      
      // Listen for status updates
      const handleExpertStatusUpdate = (data) => {
        console.log('📊 Received expert status update:', data);
        const notification = {
          id: `status_update_${Date.now()}`,
          type: 'status_update' as const,
          message: getStatusUpdateMessage(data.status),
          timestamp: data.timestamp,
          data
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]);
        
        toast({
          title: '📋 Application Status Updated',
          description: getStatusUpdateMessage(data.status),
          variant: data.status === 'approved' ? 'default' : 'destructive',
          duration: 5000,
        });
      };
      
      socket.on('expert_status_updated', handleExpertStatusUpdate);
    }

    return () => {
      console.log('🧹 Cleaning up notification listeners');
      if (socket) {
        socket.off('admin_panel_joined');
        socket.off('expert_application_submitted');
        socket.off('expert_status_updated');
        socket.off('admin_panel_update');  
        socket.off('bulk_action_completed');
      }
    };
  }, [user, isConnected, socket, toast]);

  const getAdminUpdateMessage = (data: any) => {
    switch (data.type) {
      case 'expert_verified':
        return `Expert ${data.expertId} verification status updated to ${data.status}`;
      case 'bulk_expert_update':
        return `Bulk ${data.action} applied to ${data.count} experts`;
      default:
        return 'Admin panel updated';
    }
  };

  const getStatusUpdateMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Congratulations! Your expert application has been approved.';
      case 'rejected':
        return 'Your expert application requires attention. Please check the feedback.';
      case 'suspended':
        return 'Your expert account has been temporarily suspended.';
      case 'pending':
        return 'Your expert application is under review.';
      default:
        return 'Your application status has been updated.';
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true } 
          : notif
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    unreadCount: notifications.filter(n => !('read' in n) || !n.read).length
  };
};