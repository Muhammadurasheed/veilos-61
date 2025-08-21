import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/services/api';

interface FollowState {
  isFollowing: boolean;
  isLoading: boolean;
}

export const useExpertFollow = (expertId: string, initialFollowState: boolean = false) => {
  const [followState, setFollowState] = useState<FollowState>({
    isFollowing: initialFollowState,
    isLoading: false,
  });
  const { toast } = useToast();

  // Load follow status on mount
  useEffect(() => {
    const loadFollowStatus = async () => {
      if (!expertId) return;
      
      try {
        const response = await apiRequest('GET', `/api/experts/${expertId}/following-status`);
        if (response.success && response.data) {
          setFollowState(prev => ({
            ...prev,
            isFollowing: response.data.isFollowing
          }));
        }
      } catch (error) {
        console.error('Error loading follow status:', error);
      }
    };

    loadFollowStatus();
  }, [expertId]);

  const toggleFollow = useCallback(async () => {
    setFollowState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const endpoint = followState.isFollowing 
        ? `/api/experts/${expertId}/unfollow` 
        : `/api/experts/${expertId}/follow`;
      
      const response = await apiRequest('POST', endpoint);
      
      if (response.success) {
        setFollowState(prev => ({
          isFollowing: !prev.isFollowing,
          isLoading: false,
        }));
        
        toast({
          title: followState.isFollowing ? 'Unfollowed Expert' : 'Following Expert',
          description: followState.isFollowing 
            ? 'You will no longer receive updates from this expert' 
            : 'You will now receive updates when this expert posts or schedules sessions',
        });
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      setFollowState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update follow status. Please try again.',
      });
    }
  }, [expertId, followState.isFollowing, toast]);

  return {
    ...followState,
    toggleFollow,
  };
};