
// Simple content moderation middleware
// In a production environment, this would use AI models or services like Azure Content Moderator

// List of patterns to check (very simplified version)
const sensitivePatterns = {
  pornographic: /\b(porn|xxx|naked|nude|sex|explicit)\b/i,
  hateSpeech: /\b(hate|racist|bigot|slur|offensive)\b/i,
  violentContent: /\b(kill|murder|shoot|bomb|attack|rebellion|overthrow)\b/i
};

exports.moderateContent = (req, res, next) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return next();
    }
    
    let hasFlagged = false;
    let flagReason = [];
    
    // Check content against patterns
    Object.entries(sensitivePatterns).forEach(([category, pattern]) => {
      if (pattern.test(content)) {
        hasFlagged = true;
        flagReason.push(category);
      }
    });
    
    // Add flag info to the request
    if (hasFlagged) {
      req.contentModeration = {
        flagged: true,
        flagReason: flagReason.join(', ')
      };
    }
    
    next();
  } catch (err) {
    console.error('Content moderation error:', err);
    next(); // Continue despite errors in moderation
  }
};
