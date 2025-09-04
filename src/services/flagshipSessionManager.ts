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
        
        console.log('🔄 Converting scheduled session to live:', sessionId);
        
        // Convert the session
        const conversionResult = await this.convertScheduledSession(sessionId);
        
        if (conversionResult.success && conversionResult.liveSessionId) {
          // Now try to join the live session
          const liveJoinResponse = await FlagshipSanctuaryApi.joinSession(
            conversionResult.liveSessionId, 
            joinData
          );
          
          if (liveJoinResponse.success) {
            return {
              success: true,
              data: liveJoinResponse.data,
              needsRedirect: true,
              redirectUrl: `/flagship-sanctuary/${conversionResult.liveSessionId}`
            };
          } else {
            return {
              success: false,
              error: 'Failed to join converted session: ' + liveJoinResponse.error
            };
          }
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