const axios = require('axios');
const AIModerationLog = require('../models/AIModerationLog');

class AIModerationService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.enabled = process.env.AI_MODERATION_ENABLED === 'true';
    this.threshold = parseFloat(process.env.AI_MODERATION_THRESHOLD) || 0.7;
    this.emergencyEmail = process.env.EMERGENCY_CONTACT_EMAIL;
    this.emergencyWebhook = process.env.EMERGENCY_WEBHOOK_URL;
    
    // Crisis keywords and patterns
    this.crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'not worth living', 'want to die',
      'self-harm', 'cutting', 'overdose', 'hurt myself', 'no point in living',
      'better off dead', 'goodbye world', 'final message', 'can\'t go on',
      'abuse', 'violence', 'threat', 'emergency', 'help me', 'danger'
    ];
    
    this.toxicityPatterns = [
      /\b(hate|kill|murder|violence)\b/gi,
      /\b(racist|sexist|homophobic)\b/gi,
      /\b(abuse|harass|bully)\b/gi,
      /\b(threat|threaten|intimidate)\b/gi
    ];
  }

  // Main content moderation function
  async moderateContent(content, sessionId, participantId, contentType = 'text') {
    if (!this.enabled) {
      return { approved: true, severity: 'none', action: 'none' };
    }

    try {
      console.log(`🔍 Moderating ${contentType} content for participant ${participantId}`);

      // Quick crisis detection
      const crisisCheck = this.detectCrisisContent(content);
      if (crisisCheck.isCrisis) {
        await this.handleCrisisAlert(sessionId, participantId, content, crisisCheck);
        return {
          approved: false,
          severity: 'critical',
          action: 'emergency_alert',
          reason: 'Crisis content detected',
          crisisType: crisisCheck.type
        };
      }

      // Pattern-based toxicity check
      const toxicityCheck = this.detectToxicity(content);
      if (toxicityCheck.isToxic) {
        return {
          approved: false,
          severity: toxicityCheck.severity,
          action: toxicityCheck.action,
          reason: 'Toxic content detected'
        };
      }

      // AI-powered content analysis using Gemini
      const aiAnalysis = await this.analyzeWithGemini(content);
      
      // Log moderation result
      await this.logModerationEvent(sessionId, participantId, content, aiAnalysis, contentType);

      return aiAnalysis;

    } catch (error) {
      console.error('❌ Content moderation failed:', error.message);
      
      // Fail-safe: allow content but log the error
      await this.logModerationEvent(sessionId, participantId, content, { 
        approved: true, 
        severity: 'unknown', 
        action: 'none',
        error: error.message 
      }, contentType);
      
      return { approved: true, severity: 'unknown', action: 'none', error: error.message };
    }
  }

  // Crisis content detection using keyword matching
  detectCrisisContent(content) {
    const lowerContent = content.toLowerCase();
    
    for (const keyword of this.crisisKeywords) {
      if (lowerContent.includes(keyword)) {
        let type = 'general';
        
        if (['suicide', 'kill myself', 'end it all', 'want to die'].some(k => lowerContent.includes(k))) {
          type = 'suicide';
        } else if (['self-harm', 'cutting', 'hurt myself'].some(k => lowerContent.includes(k))) {
          type = 'self_harm';
        } else if (['abuse', 'violence', 'threat'].some(k => lowerContent.includes(k))) {
          type = 'violence';
        }
        
        return { isCrisis: true, type, keyword };
      }
    }
    
    return { isCrisis: false };
  }

  // Toxicity detection using pattern matching
  detectToxicity(content) {
    for (const pattern of this.toxicityPatterns) {
      if (pattern.test(content)) {
        return {
          isToxic: true,
          severity: 'high',
          action: 'warning',
          pattern: pattern.source
        };
      }
    }
    
    return { isToxic: false };
  }

  // AI analysis using Gemini API
  async analyzeWithGemini(content) {
    try {
      const prompt = `
        Analyze the following content for safety and appropriateness in an anonymous support group setting:
        
        Content: "${content}"
        
        Please provide a JSON response with:
        - approved: boolean (true if content is safe)
        - severity: string ("low", "medium", "high", "critical")
        - action: string ("none", "warning", "mute", "kick", "emergency_alert")
        - reason: string (brief explanation)
        - topics: array of detected topics
        - sentiment: string ("positive", "neutral", "negative", "crisis")
        
        Consider:
        1. Suicide ideation or self-harm content (critical severity)
        2. Threats or violence (high severity)
        3. Harassment or bullying (medium severity)
        4. Spam or inappropriate content (low severity)
        5. Supportive and helpful content (approved)
      `;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      
      // Try to parse JSON response
      try {
        const analysisResult = JSON.parse(aiResponse.replace(/```json|```/g, '').trim());
        
        console.log(`🤖 AI Analysis result:`, analysisResult);
        return analysisResult;
      } catch (parseError) {
        console.warn('⚠️ Failed to parse AI response, using fallback analysis');
        return this.fallbackAnalysis(content);
      }

    } catch (error) {
      console.error('❌ Gemini API analysis failed:', error.message);
      return this.fallbackAnalysis(content);
    }
  }

  // Fallback analysis when AI is unavailable
  fallbackAnalysis(content) {
    const crisisCheck = this.detectCrisisContent(content);
    const toxicityCheck = this.detectToxicity(content);
    
    if (crisisCheck.isCrisis) {
      return {
        approved: false,
        severity: 'critical',
        action: 'emergency_alert',
        reason: 'Crisis content detected (fallback)',
        sentiment: 'crisis'
      };
    }
    
    if (toxicityCheck.isToxic) {
      return {
        approved: false,
        severity: toxicityCheck.severity,
        action: toxicityCheck.action,
        reason: 'Toxic content detected (fallback)'
      };
    }
    
    return {
      approved: true,
      severity: 'low',
      action: 'none',
      reason: 'Content appears safe (fallback analysis)',
      sentiment: 'neutral'
    };
  }

  // Handle crisis alerts
  async handleCrisisAlert(sessionId, participantId, content, crisisData) {
    console.log(`🚨 CRISIS ALERT: ${crisisData.type} detected in session ${sessionId}`);
    
    try {
      // Send emergency webhook
      if (this.emergencyWebhook) {
        await axios.post(this.emergencyWebhook, {
          type: 'crisis_alert',
          sessionId,
          participantId,
          crisisType: crisisData.type,
          content: content.substring(0, 200), // Truncate for privacy
          timestamp: new Date().toISOString(),
          severity: 'critical'
        });
      }

      // Send emergency email (placeholder - implement with your email service)
      if (this.emergencyEmail) {
        console.log(`📧 Emergency alert would be sent to: ${this.emergencyEmail}`);
        // TODO: Implement email notification
      }

      // Log critical event
      await this.logModerationEvent(sessionId, participantId, content, {
        approved: false,
        severity: 'critical',
        action: 'emergency_alert',
        reason: `Crisis content: ${crisisData.type}`,
        crisisType: crisisData.type
      }, 'crisis_alert');

    } catch (error) {
      console.error('❌ Crisis alert handling failed:', error.message);
    }
  }

  // Log moderation events
  async logModerationEvent(sessionId, participantId, content, result, contentType = 'text') {
    try {
      const moderationLog = new AIModerationLog({
        sessionId,
        participantId,
        content: content.substring(0, 500), // Truncate for storage
        contentType,
        severity: result.severity || 'unknown',
        action: result.action || 'none',
        approved: result.approved || false,
        reason: result.reason || 'No reason provided',
        aiModel: 'gemini-pro',
        confidence: result.confidence || 0.5,
        topics: result.topics || [],
        sentiment: result.sentiment || 'neutral',
        crisisType: result.crisisType,
        timestamp: new Date(),
        processed: true
      });

      await moderationLog.save();
      console.log(`📝 Moderation event logged for session ${sessionId}`);

    } catch (error) {
      console.error('❌ Failed to log moderation event:', error.message);
    }
  }

  // Get moderation analytics for a session
  async getSessionModerationAnalytics(sessionId) {
    try {
      const logs = await AIModerationLog.find({ sessionId }).sort({ timestamp: -1 });
      
      const analytics = {
        totalEvents: logs.length,
        severityBreakdown: {},
        actionBreakdown: {},
        sentimentBreakdown: {},
        crisisAlerts: logs.filter(log => log.severity === 'critical').length,
        approvedContent: logs.filter(log => log.approved).length,
        rejectedContent: logs.filter(log => !log.approved).length,
        recentEvents: logs.slice(0, 10)
      };

      // Calculate breakdowns
      logs.forEach(log => {
        analytics.severityBreakdown[log.severity] = (analytics.severityBreakdown[log.severity] || 0) + 1;
        analytics.actionBreakdown[log.action] = (analytics.actionBreakdown[log.action] || 0) + 1;
        analytics.sentimentBreakdown[log.sentiment] = (analytics.sentimentBreakdown[log.sentiment] || 0) + 1;
      });

      return { success: true, analytics };

    } catch (error) {
      console.error('❌ Failed to get moderation analytics:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Update moderation settings
  updateModerationSettings(settings) {
    if (settings.enabled !== undefined) this.enabled = settings.enabled;
    if (settings.threshold !== undefined) this.threshold = settings.threshold;
    
    console.log(`⚙️ Moderation settings updated:`, { enabled: this.enabled, threshold: this.threshold });
  }

  // Get moderation status
  getModerationStatus() {
    return {
      enabled: this.enabled,
      threshold: this.threshold,
      hasGeminiKey: !!this.geminiApiKey,
      emergencyContactConfigured: !!(this.emergencyEmail || this.emergencyWebhook),
      crisisKeywordsCount: this.crisisKeywords.length,
      toxicityPatternsCount: this.toxicityPatterns.length
    };
  }
}

// Create singleton instance
const aiModerationService = new AIModerationService();

module.exports = aiModerationService;