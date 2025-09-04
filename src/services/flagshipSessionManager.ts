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
    try {
      console.log('🚪 Smart join attempt for session:', sessionId);
      
      // First attempt join
      const joinResponse = await FlagshipSanctuaryApi.joinSession(sessionId, joinData);
      
      // Check if response indicates redirect needed (backend converted session)
      if (joinResponse.success && (joinResponse as any).data?.needsRedirect) {
        console.log('✅ Backend converted session, redirecting to:', (joinResponse as any).data.liveSessionId);
        return {
          success: true,
          data: joinResponse.data,
          needsRedirect: true,
          redirectUrl: (joinResponse as any).data.redirectTo || `/flagship-sanctuary/${(joinResponse as any).data.liveSessionId}`
        };
      }

      // Check for other redirect indicators
      if ((joinResponse as any).data?.liveSessionId && (joinResponse as any).data?.redirectTo) {
        console.log('🔄 Session redirect detected:', (joinResponse as any).data.liveSessionId);
        return {
          success: true,
          data: joinResponse.data,
          needsRedirect: true,
          redirectUrl: (joinResponse as any).data.redirectTo
        };
      }
      
      // Normal successful join
      if (joinResponse.success) {
        console.log('✅ Direct join successful');
        return { success: true, data: joinResponse.data };
      }

      // Handle conversion cases
      const needsConversion = joinResponse.error === 'Session conversion required' ||
        joinResponse.message === 'Session conversion required' ||
        joinResponse.message === 'Session not yet ready' ||
        (joinResponse as any).data?.needsConversion;

      if (needsConversion) {
        console.log('🔄 Converting scheduled session to live:', sessionId);
        const conversionResult = await this.convertScheduledSession(sessionId);
        
        if (conversionResult.success && conversionResult.liveSessionId) {
          console.log('✅ Session converted, redirecting to:', conversionResult.liveSessionId);
          return {
            success: true,
            needsRedirect: true,
            redirectUrl: conversionResult.redirectUrl || `/flagship-sanctuary/${conversionResult.liveSessionId}`
          };
        } else {
          return { 
            success: false, 
            error: 'Failed to convert scheduled session: ' + (conversionResult.error || 'unknown error') 
          };
        }
      }

      // Fallback: return original error
      console.log('❌ Join failed:', joinResponse.error || joinResponse.message);
      return { success: false, error: joinResponse.error || joinResponse.message || 'Failed to join session' };
      
    } catch (error) {
      console.error('❌ Smart join failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Join failed' };
    }
  }
}