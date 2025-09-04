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
      return {
        success: false,
        error: 'Conversion already in progress'
      };
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
        return {
          success: true,
          liveSessionId: data.data.liveSessionId,
          redirectUrl: data.data.redirectTo
        };
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
    try {
      // First try to join the session normally
      const joinResponse = await FlagshipSanctuaryApi.joinSession(sessionId, joinData);
      
      if (joinResponse.success) {
        return {
          success: true,
          data: joinResponse.data
        };
      }
      
      // Check if the error indicates we need conversion
      if (joinResponse.error === 'Session conversion required' || 
          joinResponse.message === 'Session conversion required' ||
          (joinResponse as any).data?.needsConversion) {
        
        console.log('🔄 Session conversion detected for:', sessionId);
        
        // If we have conversion data with liveSessionId, redirect immediately
        const conversionData = (joinResponse as any).data;
        if (conversionData?.liveSessionId && conversionData?.redirectTo) {
          console.log('✅ Using existing live session:', conversionData.liveSessionId);
          return {
            success: true,
            needsRedirect: true,
            redirectUrl: conversionData.redirectTo
          };
        }
        
        // Otherwise convert the session
        const conversionResult = await this.convertScheduledSession(sessionId);
        
        if (conversionResult.success && conversionResult.liveSessionId) {
          console.log('✅ Session converted, redirecting to:', conversionResult.liveSessionId);
          return {
            success: true,
            needsRedirect: true,
            redirectUrl: `/flagship-sanctuary/${conversionResult.liveSessionId}`
          };
        } else {
          return {
            success: false,
            error: 'Failed to convert scheduled session: ' + conversionResult.error
          };
        }
      }
      
      // Return original error if not a conversion issue
      return {
        success: false,
        error: joinResponse.error || 'Failed to join session'
      };
      
    } catch (error) {
      console.error('❌ Smart join failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Join failed'
      };
    }
  }
}