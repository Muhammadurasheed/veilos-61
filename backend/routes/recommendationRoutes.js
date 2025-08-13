const express = require('express');
const router = express.Router();
const Recommendation = require('../models/Recommendation');
const Post = require('../models/Post');
const Expert = require('../models/Expert');
const { authMiddleware } = require('../middleware/auth');
const axios = require('axios');

// Get personalized recommendations for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, limit = 10 } = req.query;
    
    let query = { 
      userId, 
      shown: false, 
      dismissed: false,
      expiresAt: { $gt: new Date() }
    };
    
    if (type) {
      query.type = type;
    }
    
    const recommendations = await Recommendation.find(query)
      .sort({ priority: -1, relevanceScore: -1, timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (err) {
    console.error('Get recommendations error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations'
    });
  }
});

// Generate AI-powered recommendations based on user activity
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { postContent, feeling, topic, recentActivity } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'AI recommendation service not available'
      });
    }
    
    // Get user's recent posts and activity to build context
    const recentPosts = await Post.find({ userId })
      .sort({ timestamp: -1 })
      .limit(5)
      .select('content feeling topic timestamp');
    
    // Get available experts
    const experts = await Expert.find({ verified: true })
      .select('alias specialties bio languages');
    
    const prompt = `
    You are an AI recommendation engine for Veilo, a mental health platform.
    Generate personalized recommendations for this user based on their activity.
    
    User Context:
    - Current post: "${postContent}"
    - Current feeling: "${feeling}"
    - Current topic: "${topic}"
    - Recent posts: ${JSON.stringify(recentPosts)}
    - Recent activity: ${recentActivity || 'No recent activity'}
    
    Available experts: ${JSON.stringify(experts.slice(0, 5))}
    
    Generate 3-5 recommendations in JSON format:
    {
      "recommendations": [
        {
          "type": "expert|resource|topic",
          "title": "recommendation title",
          "description": "why this is relevant",
          "priority": "low|medium|high|urgent",
          "category": "mood|topic|behavior|emergency|wellness",
          "relevanceScore": 0.0-1.0,
          "basedOn": "what triggered this recommendation",
          "expertId": "if expert recommendation",
          "resourceTitle": "if resource recommendation",
          "resourceUrl": "if resource recommendation",
          "topicName": "if topic recommendation"
        }
      ]
    }
    
    Guidelines:
    - Prioritize expert matching based on specialties and user needs
    - Suggest relevant coping resources and techniques
    - Recommend related topics for exploration
    - Consider urgency if user shows distress signals
    - Keep recommendations supportive and actionable
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
          temperature: 0.3,
          topP: 0.8,
          topK: 40
        }
      }
    );
    
    let recommendations = [];
    try {
      const text = response.data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        recommendations = result.recommendations || [];
      }
    } catch (error) {
      console.error('Error parsing AI recommendations:', error);
    }
    
    // Save recommendations to database
    const savedRecommendations = [];
    for (const rec of recommendations) {
      try {
        const recommendation = new Recommendation({
          userId,
          type: rec.type,
          title: rec.title,
          description: rec.description,
          priority: rec.priority || 'medium',
          category: rec.category || 'wellness',
          relevanceScore: rec.relevanceScore || 0.5,
          basedOn: rec.basedOn || 'AI analysis',
          expertId: rec.expertId,
          resourceTitle: rec.resourceTitle,
          resourceUrl: rec.resourceUrl,
          topicName: rec.topicName
        });
        
        const saved = await recommendation.save();
        savedRecommendations.push(saved);
      } catch (saveError) {
        console.error('Error saving recommendation:', saveError);
      }
    }
    
    res.json({
      success: true,
      data: savedRecommendations
    });
  } catch (err) {
    console.error('Generate recommendations error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations'
    });
  }
});

// Mark recommendation as shown
router.put('/:id/shown', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const recommendation = await Recommendation.findOneAndUpdate(
      { id, userId },
      { shown: true },
      { new: true }
    );
    
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: 'Recommendation not found'
      });
    }
    
    res.json({
      success: true,
      data: recommendation
    });
  } catch (err) {
    console.error('Mark recommendation shown error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update recommendation'
    });
  }
});

// Mark recommendation as clicked
router.put('/:id/clicked', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const recommendation = await Recommendation.findOneAndUpdate(
      { id, userId },
      { clicked: true, shown: true },
      { new: true }
    );
    
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: 'Recommendation not found'
      });
    }
    
    res.json({
      success: true,
      data: recommendation
    });
  } catch (err) {
    console.error('Mark recommendation clicked error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update recommendation'
    });
  }
});

// Dismiss recommendation
router.put('/:id/dismiss', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const recommendation = await Recommendation.findOneAndUpdate(
      { id, userId },
      { dismissed: true, shown: true },
      { new: true }
    );
    
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: 'Recommendation not found'
      });
    }
    
    res.json({
      success: true,
      data: recommendation
    });
  } catch (err) {
    console.error('Dismiss recommendation error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to dismiss recommendation'
    });
  }
});

// Get expert matching recommendations
router.post('/expert-match', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { feeling, topic, urgency = 'medium' } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'AI matching service not available'
      });
    }
    
    // Get available experts
    const experts = await Expert.find({ verified: true })
      .select('id alias specialties bio languages availability');
    
    const prompt = `
    You are an expert matching AI for Veilo mental health platform.
    Match the user's needs with the most suitable experts.
    
    User needs:
    - Feeling: "${feeling}"
    - Topic: "${topic}"
    - Urgency: "${urgency}"
    
    Available experts:
    ${JSON.stringify(experts)}
    
    Return top 3 expert matches in JSON:
    {
      "matches": [
        {
          "expertId": "expert_id",
          "matchScore": 0.0-1.0,
          "reason": "why this expert is a good match",
          "specialtyAlignment": "how their specialties align"
        }
      ]
    }
    
    Consider:
    - Specialty relevance to user's topic/feeling
    - Availability status
    - Language compatibility
    - Experience level indicated in bio
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
          temperature: 0.2,
          topP: 0.8,
          topK: 40
        }
      }
    );
    
    let matches = [];
    try {
      const text = response.data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        matches = result.matches || [];
      }
    } catch (error) {
      console.error('Error parsing expert matches:', error);
    }
    
    // Enrich matches with expert details
    const enrichedMatches = [];
    for (const match of matches) {
      const expert = experts.find(e => e.id === match.expertId);
      if (expert) {
        enrichedMatches.push({
          ...match,
          expert: {
            id: expert.id,
            alias: expert.alias,
            specialties: expert.specialties,
            bio: expert.bio
          }
        });
      }
    }
    
    res.json({
      success: true,
      data: enrichedMatches
    });
  } catch (err) {
    console.error('Expert matching error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to match experts'
    });
  }
});

module.exports = router;