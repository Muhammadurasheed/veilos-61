import { useEffect, useState, useRef } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import socketService from '@/services/socket';

interface ExpertApplication {
  id: string;
  expertId: string;
  name: string;
  email: string;
  specialization: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  documents?: any[];
  verificationLevel?: string;
  read?: boolean;
}

interface ExpertApplicationUpdate {
  expertId: string;
  applicationId: string;
  status: 'approved' | 'rejected' | 'pending';
  message?: string;
  timestamp: string;
}

export const useExpertApplicationsRealtime = () => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const [applications, setApplications] = useState<ExpertApplication[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (!user?.role) return;

    const initializeRealtime = async () => {
      try {
        // Ensure socket connection
        if (!socketService.isSocketConnected()) {
          console.log('🔌 Connecting to socket for expert applications...');
          await socketService.connect();
        }

        setIsConnected(socketService.isSocketConnected());

        if (user.role === 'admin' && !hasJoinedRef.current) {
          console.log('🎯 Admin joining expert applications channel...');
          
          // Join admin expert applications channel
          socketService.emit('join_expert_applications_admin', {
            userId: user.id,
            role: user.role,
            timestamp: new Date().toISOString()
          });

          hasJoinedRef.current = true;

          // Listen for new expert applications
          socketService.on('new_expert_application', (data: ExpertApplication) => {
            console.log('📨 🚨 NEW EXPERT APPLICATION RECEIVED! 🚨', data);
            
            setApplications(prev => [data, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            toast({
              title: '🎯 New Expert Application',
              description: `${data.name} has submitted an application for ${data.specialization}`,
              duration: 8000,
            });

            // Force refresh of admin dashboard if open
            if (window.location.pathname.includes('/admin')) {
              window.dispatchEvent(new CustomEvent('expertApplicationReceived', { 
                detail: data 
              }));
            }
          });

          // Listen for application status updates
          socketService.on('expert_application_status_updated', (data: ExpertApplicationUpdate) => {
            console.log('📊 Expert application status updated:', data);
            
            setApplications(prev => 
              prev.map(app => 
                app.expertId === data.expertId 
                  ? { ...app, status: data.status }
                  : app
              )
            );

            toast({
              title: '📋 Application Status Updated',
              description: `Expert application ${data.status}`,
              variant: data.status === 'approved' ? 'default' : 'destructive',
            });
          });

          // Listen for join confirmation
          socketService.on('expert_applications_admin_joined', (data) => {
            console.log('✅ Successfully joined expert applications admin channel:', data);
            setIsConnected(true);
            
            toast({
              title: "🎯 Expert Applications Monitor Active",
              description: "Real-time expert application notifications enabled",
              duration: 3000,
            });
          });

        } else if (user.role === 'beacon' && (user as any).expertId) {
          // For experts, listen for their own application status updates
          console.log('🎯 Expert listening for application updates:', (user as any).expertId);
          
          socketService.emit('join_expert_application_updates', {
            expertId: (user as any).expertId,
            userId: user.id
          });

          socketService.on('your_application_status_updated', (data: ExpertApplicationUpdate) => {
            console.log('📊 Your application status updated:', data);
            
            toast({
              title: '📋 Application Status Updated',
              description: getStatusMessage(data.status),
              variant: data.status === 'approved' ? 'default' : 'destructive',
              duration: 8000,
            });
          });
        }

      } catch (error) {
        console.error('❌ Error initializing expert applications realtime:', error);
        setIsConnected(false);
      }
    };

    initializeRealtime();

    return () => {
      console.log('🧹 Cleaning up expert applications realtime...');
      if (socketService) {
        socketService.off('new_expert_application');
        socketService.off('expert_application_status_updated');
        socketService.off('expert_applications_admin_joined');
        socketService.off('your_application_status_updated');
      }
      hasJoinedRef.current = false;
    };
  }, [user, toast]);

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Congratulations! Your expert application has been approved.';
      case 'rejected':
        return 'Your expert application requires attention. Please check the feedback.';
      case 'pending':
        return 'Your expert application is under review.';
      default:
        return 'Your application status has been updated.';
    }
  };

  const approveApplication = async (expertId: string, applicationId: string) => {
    try {
      socketService.emit('update_expert_application_status', {
        expertId,
        applicationId,
        status: 'approved',
        adminId: user?.id,
        timestamp: new Date().toISOString()
      });

      // Update local state optimistically
      setApplications(prev => 
        prev.map(app => 
          app.expertId === expertId 
            ? { ...app, status: 'approved' }
            : app
        )
      );

      toast({
        title: '✅ Application Approved',
        description: 'Expert application has been approved successfully.',
      });
    } catch (error) {
      console.error('Error approving application:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve application.',
        variant: 'destructive',
      });
    }
  };

  const rejectApplication = async (expertId: string, applicationId: string, reason?: string) => {
    try {
      socketService.emit('update_expert_application_status', {
        expertId,
        applicationId,
        status: 'rejected',
        reason,
        adminId: user?.id,
        timestamp: new Date().toISOString()
      });

      // Update local state optimistically
      setApplications(prev => 
        prev.map(app => 
          app.expertId === expertId 
            ? { ...app, status: 'rejected' }
            : app
        )
      );

      toast({
        title: '❌ Application Rejected',
        description: 'Expert application has been rejected.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject application.',
        variant: 'destructive',
      });
    }
  };

  const markAsRead = (applicationId: string) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === applicationId 
          ? { ...app, read: true }
          : app
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setUnreadCount(0);
    setApplications(prev => prev.map(app => ({ ...app, read: true })));
  };

  return {
    applications,
    isConnected,
    unreadCount,
    approveApplication,
    rejectApplication,
    markAsRead,
    clearAllNotifications
  };
};