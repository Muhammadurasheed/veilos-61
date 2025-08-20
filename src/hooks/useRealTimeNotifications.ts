import { useEffect, useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import socket from '@/services/socket';

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

  useEffect(() => {
    if (!user) return;

    // Connect socket first
    socket.connect().then(() => {
      // Join appropriate notification channels based on user role
      if (user.role === 'admin') {
        socket.emit('join_admin_panel');
        
        // Listen for expert application submissions
        socket.on('expert_application_submitted', (data) => {
        const notification = {
          id: `expert_app_${Date.now()}`,
          type: 'expert_application' as const,
          message: `New expert application from ${data.expert.name}`,
          timestamp: data.timestamp,
          data: data.expert
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]);
        
        toast({
          title: 'New Expert Application',
          description: `${data.expert.name} has applied to become an expert`,
          duration: 5000,
        });
      });
      
      // Listen for admin panel updates
      socket.on('admin_panel_update', (data) => {
        const notification = {
          id: `admin_update_${Date.now()}`,
          type: 'admin_update' as const,
          message: getAdminUpdateMessage(data),
          timestamp: data.timestamp,
          data
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]);
      });
      
      // Listen for bulk action completions
      socket.on('bulk_action_completed', (data) => {
        toast({
          title: 'Bulk Action Completed',
          description: `${data.action} applied to ${data.expertCount} experts`,
          duration: 3000,
        });
      });
      
    } else if (user.role === 'beacon' && user.expertId) {
      // For experts, join their notification channel
      socket.emit('join_expert_notifications', { expertId: user.expertId });
      
      // Listen for status updates
      socket.on('expert_status_updated', (data) => {
        const notification = {
          id: `status_update_${Date.now()}`,
          type: 'status_update' as const,
          message: getStatusUpdateMessage(data.status),
          timestamp: data.timestamp,
          data
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]);
        
        toast({
          title: 'Application Status Updated',
          description: getStatusUpdateMessage(data.status),
          variant: data.status === 'approved' ? 'default' : 'destructive',
          duration: 5000,
        });
      });
      }
    }).catch(console.error);

    return () => {
      socket.off('expert_application_submitted');
      socket.off('expert_status_updated');
      socket.off('admin_panel_update');
      socket.off('bulk_action_completed');
    };
  }, [user, toast]);

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