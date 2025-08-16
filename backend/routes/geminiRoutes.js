
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const axios = require('axios');

// Moderate content using Gemini API
// POST /api/gemini/moderate
router.post('/moderate', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key is not configured'
      });
    }
    
    const prompt = `
    You are a content moderator for a mental health and support platform called Veilo. 
    Your job is to review content to ensure it follows our guidelines:
    
    1. No harmful, threatening, or violent content
    2. No harassment, hate speech, or discrimination
    3. No sexual content or solicitation
    4. No spam or advertising
    5. No sharing of personal contact info
    6. No impersonation or misleading content
    
    Please review this content:
    
    "${content}"
    
    Respond with JSON only:
    {
      "isAppropriate": true/false,
      "feedback": "explanation if inappropriate"
    }
    `;
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
    
    let result;
    try {
      const text = response.data.candidates[0].content.parts[0].text;
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      result = {
        isAppropriate: true,
        feedback: "Unable to process moderation, allowing content by default."
      };
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Gemini moderation error:', err);
    
    // Handle rate limiting gracefully
    if (err.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again in a moment.',
        retryAfter: 60
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Gemini API error'
    });
  }
});

// Improve content using Gemini API
// POST /api/gemini/improve
router.post('/improve', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key is not configured'
      });
    }
    
    const prompt = `
    You are a helpful writing assistant for a mental health and support platform called Veilo.
    Your job is to improve the writing of users without changing the core meaning.
    
    Guidelines:
    1. Maintain the original sentiment and message
    2. Fix grammar and spelling errors
    3. Improve clarity and flow
    4. Make the tone more supportive and empathetic when appropriate
    5. Never add new information or change the meaning
    
    Original content:
    "${content}"
    
    Improved version:
    `;
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
    
    const improvedContent = response.data.candidates[0].content.parts[0].text.trim();
    
    res.json({
      success: true,
      data: {
        improvedContent
      }
    });
  } catch (err) {
    console.error('Gemini content improvement error:', err);
    
    // Handle rate limiting gracefully
    if (err.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Content refinement is temporarily unavailable. You can post without refinement.',
        retryAfter: 60
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Gemini API error'
    });
  }
});

// NEW: Refine post with Gemini API
// POST /api/gemini/refine-post
router.post('/refine-post', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key is not configured'
      });
    }
    
    // First check if the content violates Veilo ethics or policies
    const moderationPrompt = `
    You are a content moderator for a mental health and support platform called Veilo.
    Your job is to review content to ensure it follows our guidelines:
    
    1. No harmful, threatening, or violent content
    2. No harassment, hate speech, or discrimination
    3. No sexual content or solicitation
    4. No spam or advertising
    5. No sharing of personal contact info
    6. No impersonation or misleading content
    7. No content that could trigger emotional distress or trauma
    8. No content that gives harmful advice or encourages harmful behaviors
    
    Please review this post draft:
    
    "${content}"
    
    Respond with JSON only:
    {
      "violation": true/false,
      "reason": "explanation if violation exists"
    }
    `;
    
    const moderationResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: moderationPrompt
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
    
    let moderationResult;
    try {
      const moderationText = moderationResponse.data.candidates[0].content.parts[0].text;
      const jsonMatch = moderationText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        moderationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid moderation response format');
      }
      
      if (moderationResult.violation) {
        return res.json({
          success: false,
          data: {
            violation: true,
            reason: moderationResult.reason
          }
        });
      }
    } catch (error) {
      console.error('Error parsing Gemini moderation response:', error);
      // Continue with refinement even if moderation parsing fails
    }
    
    // If no violation, proceed with refinement
    const refinementPrompt = `
    You are a helpful writing assistant for a mental health and support platform called Veilo.
    Your job is to refine and polish this post draft to make it more clear, empathetic, and supportive.
    
    Guidelines:
    1. Polish this user post for better clarity, tone, and engagement without changing meaning
    2. Fix any grammar or spelling errors
    3. Make the tone more supportive and empathetic when appropriate
    4. Keep the author's voice and intention
    5. Never add new information or change the core meaning
    
    Original post:
    "${content}"
    
    Refined version:
    `;
    
    const refinementResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: refinementPrompt
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
    
    const refinedText = refinementResponse.data.candidates[0].content.parts[0].text.trim();
    
    res.json({
      success: true,
      data: {
        refinedText
      }
    });
  } catch (err) {
    console.error('Gemini post refinement error:', err);
    
    // Handle rate limiting gracefully
    if (err.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Post refinement is temporarily unavailable. You can post without refinement.',
        retryAfter: 60
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Gemini API error'
    });
  }
});

// Moderate image using Gemini API
// POST /api/gemini/moderate-image
router.post('/moderate-image', authMiddleware, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Image URL is required'
      });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key is not configured'
      });
    }
    
    // Fetch the image and convert to base64
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });
    
    const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
    const mimeType = imageResponse.headers['content-type'];
    
    const prompt = `
    You are an image content moderator for a mental health and support platform called Veilo. 
    Your job is to review images to ensure they follow our guidelines:
    
    1. No harmful, threatening, or violent content
    2. No sexual or explicit content
    3. No graphic medical imagery
    4. No personally identifiable information
    5. No content that could trigger emotional distress or trauma
    
    Please review this image and respond with JSON only:
    {
      "violation": true/false,
      "reason": "explanation if inappropriate"
    }
    `;
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
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
    
    let result;
    try {
      const text = response.data.candidates[0].content.parts[0].text;
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      result = {
        violation: false,
        reason: "Unable to process image moderation, allowing by default."
      };
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Gemini image moderation error:', err);
    res.status(500).json({
      success: false,
      error: 'Gemini API error'
    });
  }
});

module.exports = router;
