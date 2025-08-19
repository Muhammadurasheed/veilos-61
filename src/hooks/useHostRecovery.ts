import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SanctuaryInfo {
  sanctuaryId: string;
  topic: string;
  description: string;
  emoji: string;
  mode: string;
  createdAt: string;
  expiresAt: string;
  submissionsCount: number;
  participantsCount: number;
  hostToken: string;
}

interface HostRecoveryData {
  sanctuaries: SanctuaryInfo[];
  count: number;
}

export const useHostRecovery = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [sanctuaryInfo, setSanctuaryInfo] = useState<SanctuaryInfo | null>(null);
  const [mySanctuaries, setMySanctuaries] = useState<HostRecoveryData | null>(null);
  const { toast } = useToast();

  const verifyHostToken = useCallback(async (hostToken: string) => {
    if (!hostToken) {
      toast({
        title: "Error",
        description: "Host token is required",
        variant: "destructive"
      });
      return false;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/host-recovery/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hostToken }),
      });

      const data = await response.json();

      if (data.success) {
        setSanctuaryInfo(data.data);
        toast({
          title: "Success",
          description: "Host session recovered successfully",
        });
        return true;
      } else {
        toast({
          title: "Recovery Failed",
          description: data.error || "Invalid or expired host token",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Host recovery error:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to server",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const generateRecoveryLink = useCallback(async (sanctuaryId: string, hostToken: string, recoveryEmail?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/host-recovery/generate-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sanctuaryId, hostToken, recoveryEmail }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Recovery Link Generated",
          description: "Save this link to recover your sanctuary access",
        });
        return data.data.recoveryUrl;
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate recovery link",
          variant: "destructive"
        });
        return null;
      }
    } catch (error) {
      console.error('Recovery link generation error:', error);
      toast({
        title: "Network Error",
        description: "Unable to generate recovery link",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getMySanctuaries = useCallback(async (hostToken: string) => {
    if (!hostToken) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/host-recovery/my-sanctuaries?hostToken=${encodeURIComponent(hostToken)}`);
      const data = await response.json();

      if (data.success) {
        setMySanctuaries(data.data);
        return data.data;
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to retrieve sanctuaries",
          variant: "destructive"
        });
        return null;
      }
    } catch (error) {
      console.error('Get sanctuaries error:', error);
      toast({
        title: "Network Error", 
        description: "Unable to retrieve sanctuaries",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    sanctuaryInfo,
    mySanctuaries,
    verifyHostToken,
    generateRecoveryLink,
    getMySanctuaries,
    clearData: () => {
      setSanctuaryInfo(null);
      setMySanctuaries(null);
    }
  };
};