const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Expert = require('../models/Expert');
const Post = require('../models/Post');
const SanctuarySession = require('../models/SanctuarySession');
const auth = require('../middleware/auth');

// AI-powered personalized recommendations
router.post('/recommendations', auth, async (req, res) => {
  try {
    const { userId, includeExperts, includeSanctuarySpaces, includeContent } = req.body;
    
    // Get user's interaction history
    const userPosts = await Post.find({ userId }).sort({ timestamp: -1 }).limit(10);
    const userContent = userPosts.map(post => post.content).join(' ');
    
    // Analyze user's interests and needs
    const userProfile = await analyzeUserProfile(userContent, userPosts);
    
    const recommendations = {
      experts: [],
      sanctuarySpaces: [],
      content: []
    };

    if (includeExperts) {
      recommendations.experts = await getExpertRecommendations(userProfile, userId);
    }

    if (includeSanctuarySpaces) {
      recommendations.sanctuarySpaces = await getSanctuaryRecommendations(userProfile);
    }

    if (includeContent) {
      recommendations.content = await getContentRecommendations(userProfile, userId);
    }

    res.success('Recommendations generated successfully', recommendations);
  } catch (error) {
    console.error('AI Recommendations error:', error);
    res.error('Failed to generate recommendations', 500);
  }
});

// Expert matching based on post content
router.post('/expert-matching', auth, async (req, res) => {
  try {
    const { postContent, userHistory, sentimentAnalysis, urgencyDetection } = req.body;
    
    // Analyze post sentiment and urgency
    const analysis = await analyzePostContent(postContent, sentimentAnalysis, urgencyDetection);
    
    // Get relevant experts
    const experts = await Expert.find({ verified: true }).populate('userId');
    
    const matches = await Promise.all(experts.map(async (expert) => {
      const score = await calculateExpertMatch(expert, analysis, userHistory);
      return {
        expertId: expert.id,
        score: score.score,
        reasons: score.reasons,
        specializations: expert.areasOfExpertise || [expert.specialization]
      };
    }));

    // Sort by score and return top matches
    const sortedMatches = matches
      .filter(match => match.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.success('Expert matching completed', sortedMatches);
  } catch (error) {
    console.error('Expert matching error:', error);
    res.error('Failed to match experts', 500);
  }
});

// Risk assessment for crisis detection
router.post('/risk-assessment', auth, async (req, res) => {
  try {
    const { userId, posts, timeframe } = req.body;
    
    const riskAnalysis = await analyzeUserRisk(posts, timeframe);
    
    res.success('Risk assessment completed', riskAnalysis);
  } catch (error) {
    console.error('Risk assessment error:', error);
    res.error('Failed to assess risk', 500);
  }
});

// Smart response generation for experts
router.post('/smart-response', auth, async (req, res) => {
  try {
    const { content, specializations, responseType } = req.body;
    
    const smartResponse = await generateSmartResponse(content, specializations, responseType);
    
    res.success('Smart response generated', smartResponse);
  } catch (error) {
    console.error('Smart response error:', error);
    res.error('Failed to generate response', 500);
  }
});

// Crisis detection
router.post('/crisis-detection', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    const crisisAnalysis = await detectCrisisSignals(content);
    
    res.success('Crisis detection completed', crisisAnalysis);
  } catch (error) {
    console.error('Crisis detection error:', error);
    res.error('Failed to detect crisis signals', 500);
  }
});

// Track user interactions for ML
router.post('/track-interaction', auth, async (req, res) => {
  try {
    const { userId, interaction } = req.body;
    
    // Store interaction for ML training
    // In production, this would go to a ML pipeline
    console.log(`User ${userId} interaction:`, interaction);
    
    res.success('Interaction tracked');
  } catch (error) {
    console.error('Interaction tracking error:', error);
    res.error('Failed to track interaction', 500);
  }
});

// Helper functions for AI analysis
async function analyzeUserProfile(userContent, userPosts) {
  // Extract keywords and topics from user content
  const keywords = extractKeywords(userContent);
  const topics = extractTopics(userPosts);
  const sentiment = analyzeSentiment(userContent);
  const urgencyLevel = detectUrgency(userContent);
  
  return {
    keywords,
    topics,
    sentiment,
    urgencyLevel,
    postCount: userPosts.length,
    recentActivity: userPosts.length > 0 ? userPosts[0].timestamp : null
  };
}

async function getExpertRecommendations(userProfile, userId) {
  const experts = await Expert.find({ verified: true }).limit(20);
  
  return experts.map(expert => {
    const score = calculateExpertScore(expert, userProfile);
    return {
      expertId: expert.id,
      score: score.score,
      reasons: score.reasons,
      specializations: expert.areasOfExpertise || [expert.specialization]
    };
  }).filter(rec => rec.score > 0.4).sort((a, b) => b.score - a.score);
}

async function getSanctuaryRecommendations(userProfile) {
  const sanctuarySpaces = await SanctuarySession.find({ isActive: true }).limit(10);
  
  return sanctuarySpaces.map(space => {
    const relevanceScore = calculateSanctuaryRelevance(space, userProfile);
    return {
      id: space.id,
      topic: space.topic,
      relevanceScore: relevanceScore.score,
      reasons: relevanceScore.reasons
    };
  }).filter(rec => rec.relevanceScore > 0.3).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

async function getContentRecommendations(userProfile, userId) {
  const posts = await Post.find({ 
    userId: { $ne: userId },
    flagged: { $ne: true }
  }).sort({ timestamp: -1 }).limit(50);
  
  return posts.map(post => {
    const relevanceScore = calculateContentRelevance(post, userProfile);
    return {
      postId: post.id,
      relevanceScore: relevanceScore.score,
      categories: relevanceScore.categories
    };
  }).filter(rec => rec.relevanceScore > 0.5).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

async function analyzePostContent(content, sentimentAnalysis, urgencyDetection) {
  const keywords = extractKeywords(content);
  const sentiment = sentimentAnalysis ? analyzeSentiment(content) : null;
  const urgency = urgencyDetection ? detectUrgency(content) : null;
  
  return {
    keywords,
    sentiment,
    urgency,
    length: content.length,
    emotionalTone: detectEmotionalTone(content)
  };
}

async function calculateExpertMatch(expert, analysis, userHistory) {
  let score = 0;
  const reasons = [];
  
  // Match based on specialization
  const specializations = expert.areasOfExpertise || [expert.specialization];
  specializations.forEach(spec => {
    if (analysis.keywords.some(keyword => 
      spec.toLowerCase().includes(keyword.toLowerCase()) || 
      keyword.toLowerCase().includes(spec.toLowerCase())
    )) {
      score += 0.3;
      reasons.push(`Specializes in ${spec}`);
    }
  });
  
  // Urgency matching
  if (analysis.urgency === 'high' && expert.verificationLevel === 'platinum') {
    score += 0.2;
    reasons.push('Available for urgent consultations');
  }
  
  // Rating boost
  if (expert.rating > 4.5) {
    score += 0.1;
    reasons.push('Highly rated professional');
  }
  
  // Emotional tone matching
  if (analysis.emotionalTone === 'distressed' && specializations.includes('Crisis Intervention')) {
    score += 0.4;
    reasons.push('Crisis intervention specialist');
  }
  
  return { score: Math.min(score, 1), reasons };
}

async function analyzeUserRisk(posts, timeframe) {
  let riskScore = 0;
  const triggers = [];
  const recommendations = [];
  
  posts.forEach(post => {
    const content = post.content.toLowerCase();
    
    // Crisis keywords
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'not worth living', 'give up'];
    crisisKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        riskScore += 0.3;
        triggers.push(`Crisis language detected: "${keyword}"`);
      }
    });
    
    // Depression indicators
    const depressionKeywords = ['hopeless', 'worthless', 'empty', 'numb', 'can\'t sleep'];
    depressionKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        riskScore += 0.1;
        triggers.push(`Depression indicator: "${keyword}"`);
      }
    });
  });
  
  let riskLevel = 'low';
  if (riskScore > 0.7) riskLevel = 'critical';
  else if (riskScore > 0.4) riskLevel = 'high';
  else if (riskScore > 0.2) riskLevel = 'medium';
  
  if (riskLevel === 'critical') {
    recommendations.push('Immediate professional intervention recommended');
    recommendations.push('Contact crisis hotline: 988');
  } else if (riskLevel === 'high') {
    recommendations.push('Schedule session with verified expert');
    recommendations.push('Join supportive sanctuary space');
  }
  
  return {
    riskLevel,
    confidence: Math.min(riskScore, 1),
    triggers,
    recommendations
  };
}

async function generateSmartResponse(content, specializations, responseType) {
  const analysis = await analyzePostContent(content, true, true);
  
  let tone = 'supportive';
  if (analysis.urgency === 'high') tone = 'urgent';
  else if (analysis.sentiment === 'negative') tone = 'empathetic';
  else if (responseType === 'expert_guidance') tone = 'professional';
  
  const keyPoints = [];
  const resources = [];
  
  // Generate key points based on content analysis
  if (analysis.keywords.includes('anxiety')) {
    keyPoints.push('Acknowledge anxiety symptoms');
    keyPoints.push('Validate their experience');
    resources.push('Breathing exercises');
  }
  
  if (analysis.keywords.includes('depression')) {
    keyPoints.push('Recognize depression signs');
    keyPoints.push('Encourage professional help');
    resources.push('Mental health resources');
  }
  
  const suggestedResponse = generateResponseTemplate(analysis, tone, keyPoints);
  
  return {
    suggestedResponse,
    tone,
    keyPoints,
    resources
  };
}

async function detectCrisisSignals(content) {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'not worth living', 
    'want to die', 'better off dead', 'no point in living'
  ];
  
  const urgencyKeywords = [
    'tonight', 'right now', 'can\'t take it', 'today',
    'immediately', 'urgent', 'emergency'
  ];
  
  let isCrisis = false;
  let confidence = 0;
  let urgencyLevel = 'low';
  const suggestedActions = [];
  const resources = [];
  
  const lowerContent = content.toLowerCase();
  
  crisisKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      isCrisis = true;
      confidence += 0.2;
    }
  });
  
  urgencyKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      urgencyLevel = 'immediate';
      confidence += 0.1;
    }
  });
  
  if (isCrisis) {
    suggestedActions.push('Alert crisis intervention team');
    suggestedActions.push('Provide immediate resources');
    suggestedActions.push('Monitor user closely');
    
    resources.push({
      type: 'hotline',
      contact: '988',
      description: 'National Suicide Prevention Lifeline'
    });
    
    resources.push({
      type: 'emergency',
      contact: '911',
      description: 'Emergency services'
    });
  }
  
  return {
    isCrisis,
    confidence: Math.min(confidence, 1),
    urgencyLevel,
    suggestedActions,
    resources
  };
}

// Simple keyword extraction
function extractKeywords(text) {
  const words = text.toLowerCase().split(/\W+/);
  const mentalHealthKeywords = [
    'anxiety', 'depression', 'stress', 'panic', 'worry', 'fear',
    'sad', 'angry', 'lonely', 'hopeless', 'therapy', 'counseling'
  ];
  
  return words.filter(word => 
    mentalHealthKeywords.includes(word) && word.length > 3
  );
}

// Simple topic extraction
function extractTopics(posts) {
  const topics = {};
  posts.forEach(post => {
    if (post.topic) {
      topics[post.topic] = (topics[post.topic] || 0) + 1;
    }
  });
  return Object.keys(topics).sort((a, b) => topics[b] - topics[a]);
}

// Simple sentiment analysis
function analyzeSentiment(text) {
  const positiveWords = ['good', 'great', 'happy', 'better', 'hope', 'love'];
  const negativeWords = ['bad', 'terrible', 'sad', 'worse', 'hate', 'depressed'];
  
  const words = text.toLowerCase().split(/\W+/);
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Simple urgency detection
function detectUrgency(text) {
  const urgentWords = ['urgent', 'emergency', 'crisis', 'now', 'immediately', 'help'];
  const words = text.toLowerCase().split(/\W+/);
  
  const urgentCount = words.filter(word => urgentWords.includes(word)).length;
  
  if (urgentCount > 2) return 'high';
  if (urgentCount > 0) return 'medium';
  return 'low';
}

function detectEmotionalTone(text) {
  const distressWords = ['crisis', 'emergency', 'desperate', 'can\'t cope'];
  const words = text.toLowerCase().split(/\W+/);
  
  if (words.some(word => distressWords.includes(word))) {
    return 'distressed';
  }
  
  return 'neutral';
}

function calculateExpertScore(expert, userProfile) {
  let score = 0;
  const reasons = [];
  
  // Base score from rating
  score += expert.rating / 5 * 0.2;
  
  // Specialization matching
  const specializations = expert.areasOfExpertise || [expert.specialization];
  userProfile.keywords.forEach(keyword => {
    specializations.forEach(spec => {
      if (spec.toLowerCase().includes(keyword.toLowerCase())) {
        score += 0.3;
        reasons.push(`Matches your interest in ${keyword}`);
      }
    });
  });
  
  return { score: Math.min(score, 1), reasons };
}

function calculateSanctuaryRelevance(space, userProfile) {
  let score = 0;
  const reasons = [];
  
  // Topic matching
  userProfile.keywords.forEach(keyword => {
    if (space.topic.toLowerCase().includes(keyword.toLowerCase())) {
      score += 0.4;
      reasons.push(`Matches your interest in ${keyword}`);
    }
  });
  
  return { score: Math.min(score, 1), reasons };
}

function calculateContentRelevance(post, userProfile) {
  let score = 0;
  const categories = [];
  
  // Keyword matching
  userProfile.keywords.forEach(keyword => {
    if (post.content.toLowerCase().includes(keyword.toLowerCase())) {
      score += 0.3;
      categories.push(keyword);
    }
  });
  
  // Topic matching
  if (post.topic && userProfile.topics.includes(post.topic)) {
    score += 0.3;
    categories.push(post.topic);
  }
  
  return { score: Math.min(score, 1), categories };
}

function generateResponseTemplate(analysis, tone, keyPoints) {
  const templates = {
    supportive: "Thank you for sharing this with us. It takes courage to reach out.",
    professional: "Based on what you've shared, I'd like to offer some professional insight.",
    empathetic: "I hear the pain in your words, and I want you to know you're not alone.",
    urgent: "I'm concerned about what you've shared and want to help you right away."
  };
  
  return templates[tone] + " " + keyPoints.join(". ") + ".";
}

module.exports = router;