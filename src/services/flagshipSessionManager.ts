// Flagship Session Manager - Handles scheduled session conversions
import { FlagshipSanctuaryApi } from './flagshipSanctuaryApi';
import type { FlagshipSanctuarySession } from '@/types/flagship-sanctuary';

export class FlagshipSessionManager {
  private static conversionInProgress = new Set<string>();

  /**
   * Handles the conversion of scheduled sessions to live sessions
   */
  static async convertScheduledSession(scheduledSessionId: string): Promise<{
    success: boolean;
    liveSessionId?: string;
    redirectUrl?: string;
    error?: string;
  }> {
    // Prevent multiple simultaneous conversions of the same session
    if (this.conversionInProgress.has(scheduledSessionId)) {
      // Wait a bit and try to get existing conversion result
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.conversionInProgress.delete(scheduledSessionId); // Clear to retry
    }

    try {
      this.conversionInProgress.add(scheduledSessionId);
      
      // Call the session start endpoint
      const response = await fetch(`/api/flagship-sanctuary/${scheduledSessionId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('veilo-auth-token') || ''
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const result = {
          success: true,
          liveSessionId: data.data.liveSessionId,
          redirectUrl: data.data.redirectTo
        };
        
        // Clear conversion tracker
        this.conversionInProgress.delete(scheduledSessionId);
        
        return result;
      } else {
        return {
          success: false,
          error: data.message || 'Failed to convert session'
        };
      }
      
    } catch (error) {
      console.error('❌ Session conversion failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Conversion failed'
      };
    } finally {
      this.conversionInProgress.delete(scheduledSessionId);
    }
  }

  /**
   * Joins a flagship session, handling scheduled session conversion if needed
   */
  static async joinSessionSmart(sessionId: string, joinData: any): Promise<{
      success: boolean;
      data?: any;
      error?: string;
      needsRedirect?: boolean;
      redirectUrl?: string;
    }> {
      const tryJoin = async (id: string, attempts = 5, delayMs = 500): Promise<any> => {
        let lastError: any = null;
        for (let i = 0; i < attempts; i++) {
          const res = await FlagshipSanctuaryApi.joinSession(id, joinData);
          if (res.success) return res;
          const msg = (res.message || res.error || '').toLowerCase();
          // Retry on eventual consistency conditions
          if (res && (res.error === 'Session not found' || msg.includes('not found') || msg.includes('not active'))) {
            await new Promise(r => setTimeout(r, delayMs + i * 200));
            lastError = res;
            continue;
          }
          // Redirect case from backend
          if ((res as any).data?.liveSessionId) {
            const liveId = (res as any).data.liveSessionId as string;
            return await tryJoin(liveId, attempts, delayMs);
          }
          lastError = res;
        }
        return lastError;
      };

    try {
      // First attempt join
      const joinResponse = await FlagshipSanctuaryApi.joinSession(sessionId, joinData);
      
      // Check if it's a success with redirect info
      if (joinResponse.success) {
        if ((joinResponse as any).data?.liveSessionId) {
          const liveId = (joinResponse as any).data.liveSessionId as string;
          return {
            success: true,
            data: joinResponse.data,
            needsRedirect: true,
            redirectUrl: `/flagship-sanctuary/${liveId}`
          };
        }
        return { success: true, data: joinResponse.data };
      }

      // If backend indicates moved to live, follow it
      if ((joinResponse as any).data?.liveSessionId) {
        const liveId = (joinResponse as any).data.liveSessionId as string;
        const liveJoin = await tryJoin(liveId);
        if (liveJoin?.success) {
          return {
            success: true,
            data: liveJoin.data,
            needsRedirect: true,
            redirectUrl: `/flagship-sanctuary/${liveId}`
          };
        }
        return { success: false, error: 'Failed to join converted session: ' + (liveJoin?.error || liveJoin?.message) };
      }

        // If conversion required, start it then retry join on new live id
        const needsConversion = joinResponse.error === 'Session conversion required' ||
          joinResponse.message === 'Session conversion required' ||
          (joinResponse as any).data?.needsConversion;

        if (needsConversion) {
          console.log('🔄 Converting scheduled session to live:', sessionId);
          const conversionResult = await this.convertScheduledSession(sessionId);
          if (conversionResult.success && conversionResult.liveSessionId) {
            const liveId = conversionResult.liveSessionId;
            const liveJoin = await tryJoin(liveId);
            if (liveJoin?.success) {
              return {
                success: true,
                data: liveJoin.data,
                needsRedirect: true,
                redirectUrl: `/flagship-sanctuary/${liveId}`
              };
            }
            return { success: false, error: 'Failed to join converted session: ' + (liveJoin?.error || liveJoin?.message) };
          }
          return { success: false, error: 'Failed to convert scheduled session: ' + (conversionResult.error || 'unknown error') };
        }

        // Fallback: return original error
        return { success: false, error: joinResponse.error || 'Failed to join session' };
      } catch (error) {
        console.error('❌ Smart join failed:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Join failed' };
      }
    }
}