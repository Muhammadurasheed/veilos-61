import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SanctuaryInfo {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  mode: 'anon-inbox' | 'live-audio';
  hostToken: string;
  createdAt: string;
  expiresAt: string;
}

const SANCTUARY_LIST_KEY = 'veilo-my-sanctuaries';

export const useSanctuaryManager = () => {
  const { toast } = useToast();
  
  // Store sanctuary info in a centralized list
  const addSanctuaryToList = useCallback((sanctuaryInfo: SanctuaryInfo) => {
    try {
      const existingList = JSON.parse(localStorage.getItem(SANCTUARY_LIST_KEY) || '[]');
      
      // Check if sanctuary already exists
      const existingIndex = existingList.findIndex((s: SanctuaryInfo) => s.id === sanctuaryInfo.id);
      
      if (existingIndex >= 0) {
        // Update existing sanctuary
        existingList[existingIndex] = sanctuaryInfo;
      } else {
        // Add new sanctuary to the beginning of the list
        existingList.unshift(sanctuaryInfo);
      }
      
      // Keep only the most recent 50 sanctuaries to prevent storage bloat
      const trimmedList = existingList.slice(0, 50);
      
      localStorage.setItem(SANCTUARY_LIST_KEY, JSON.stringify(trimmedList));
      
      return true;
    } catch (error) {
      console.error('Failed to add sanctuary to list:', error);
      return false;
    }
  }, []);
  
  // Get all sanctuaries from the list
  const getSanctuaryList = useCallback((): SanctuaryInfo[] => {
    try {
      const list = JSON.parse(localStorage.getItem(SANCTUARY_LIST_KEY) || '[]');
      return list.filter((sanctuary: SanctuaryInfo) => {
        // Verify the host token still exists in localStorage
        const hostToken = localStorage.getItem(`sanctuary-host-${sanctuary.id}`);
        const expiryTime = localStorage.getItem(`sanctuary-host-${sanctuary.id}-expires`);
        
        if (!hostToken || !expiryTime) {
          return false;
        }
        
        // Check if token is expired
        const expiryDate = new Date(expiryTime);
        const now = new Date();
        
        if (now > expiryDate) {
          // Clean up expired token
          localStorage.removeItem(`sanctuary-host-${sanctuary.id}`);
          localStorage.removeItem(`sanctuary-host-${sanctuary.id}-expires`);
          return false;
        }
        
        return true;
      });
    } catch (error) {
      console.error('Failed to get sanctuary list:', error);
      return [];
    }
  }, []);
  
  // Remove sanctuary from list
  const removeSanctuaryFromList = useCallback((sanctuaryId: string) => {
    try {
      const existingList = JSON.parse(localStorage.getItem(SANCTUARY_LIST_KEY) || '[]');
      const filteredList = existingList.filter((s: SanctuaryInfo) => s.id !== sanctuaryId);
      
      localStorage.setItem(SANCTUARY_LIST_KEY, JSON.stringify(filteredList));
      
      // Also clean up the host token and related data
      localStorage.removeItem(`sanctuary-host-${sanctuaryId}`);
      localStorage.removeItem(`sanctuary-host-${sanctuaryId}-expires`);
      localStorage.removeItem(`sanctuary-last-accessed-${sanctuaryId}`);
      
      return true;
    } catch (error) {
      console.error('Failed to remove sanctuary from list:', error);
      return false;
    }
  }, []);
  
  // Clean up expired sanctuaries from the list
  const cleanupExpiredSanctuaries = useCallback(() => {
    try {
      const list = getSanctuaryList(); // This already filters out expired ones
      localStorage.setItem(SANCTUARY_LIST_KEY, JSON.stringify(list));
      
      toast({
        title: "Cleanup Complete",
        description: "Expired sanctuaries have been removed from your list.",
      });
      
      return list.length;
    } catch (error) {
      console.error('Failed to cleanup expired sanctuaries:', error);
      return 0;
    }
  }, [getSanctuaryList, toast]);
  
  // Update last accessed time
  const updateLastAccessed = useCallback((sanctuaryId: string) => {
    localStorage.setItem(`sanctuary-last-accessed-${sanctuaryId}`, new Date().toISOString());
  }, []);
  
  return {
    addSanctuaryToList,
    getSanctuaryList,
    removeSanctuaryFromList,
    cleanupExpiredSanctuaries,
    updateLastAccessed
  };
};
