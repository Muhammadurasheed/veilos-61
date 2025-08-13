const axios = require('axios');

// Enhanced AI-powered content moderation middleware
exports.aiModerateContent = async (req, res, next) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return next();
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    // If no API key, fall back to basic moderation
    if (!apiKey) {
      console.warn('Gemini API key not configured, falling back to basic moderation');
      return next();
    }
    
    const prompt = `
    You are an advanced AI content moderator for Veilo, a mental health and support platform.
    Your job is to analyze content for potential violations while being sensitive to mental health discussions.
    
    Guidelines:
    1. ALLOW: Genuine expressions of emotional distress, seeking help, sharing experiences
    2. FLAG: Direct threats, self-harm plans, harmful advice, harassment, spam
    3. CONTEXT MATTERS: Consider the therapeutic context and intent behind the message
    4. URGENCY: Identify if immediate intervention may be needed
    
    Analyze this content:
    "${content}"
    
    Respond with JSON only:
    {
      "flagged": true/false,
      "flagReason": "specific_reason_if_flagged",
      "severity": "low|medium|high|urgent",
      "supportNeeded": true/false,
      "recommendedAction": "allow|flag|urgent_review",
      "confidence": 0.0-1.0,
      "explanation": "brief explanation of decision"
    }
    `;
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          topK: 40
        }
      },
      {
        timeout: 10000 // 10 second timeout
      }
    );
    
    let moderationResult;
    try {
      const text = response.data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        moderationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error parsing Gemini moderation response:', error);
      // Default to safe values
      moderationResult = {
        flagged: false,
        flagReason: "",
        severity: "low",
        supportNeeded: false,
        recommendedAction: "allow",
        confidence: 0.5,
        explanation: "Unable to process moderation, allowing by default"
      };
    }
    
    // Add moderation result to request for use in route handlers
    req.aiModeration = moderationResult;
    
    // If urgent, add special flag
    if (moderationResult.severity === 'urgent') {
      req.urgentFlag = true;
    }
    
    next();
  } catch (err) {
    console.error('AI Content moderation error:', err);
    // Continue without moderation on error
    req.aiModeration = {
      flagged: false,
      flagReason: "",
      severity: "low",
      supportNeeded: false,
      recommendedAction: "allow",
      confidence: 0.0,
      explanation: "Moderation service unavailable"
    };
    next();
  }
};