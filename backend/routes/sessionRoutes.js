
const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const Expert = require('../models/Expert');
const { authMiddleware } = require('../middleware/auth');
const { nanoid } = require('nanoid');

// Create session request
// POST /api/sessions
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      expertId,
      initialMessage,
      sessionType,
      scheduledTime
    } = req.body;
    
    // Validation
    if (!expertId || !sessionType) {
      return res.status(400).json({
        success: false,
        error: 'Expert ID and session type are required'
      });
    }
    
    // Check if expert exists and is approved
    const expert = await Expert.findOne({ 
      id: expertId,
      accountStatus: 'approved' 
    });
    
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found or not approved'
      });
    }
    
    // Create session
    const session = new Session({
      expertId,
      userId: req.user.id,
      userAlias: req.user.alias,
      scheduledTime: scheduledTime || null,
      sessionType,
      notes: initialMessage || '',
      status: 'requested'
    });
    
    await session.save();
    
    res.json({
      success: true,
      data: session
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get user sessions
// GET /api/sessions/user/:userId
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    // Ensure user can only access their own sessions
    if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }
    
    const sessions = await Session.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: sessions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get expert sessions
// GET /api/sessions/expert/:expertId
router.get('/expert/:expertId', authMiddleware, async (req, res) => {
  try {
    // Check if user is expert or admin
    const expert = await Expert.findOne({ id: req.params.expertId });
    
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found'
      });
    }
    
    if (expert.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }
    
    const sessions = await Session.find({ expertId: req.params.expertId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: sessions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get session details
// GET /api/sessions/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({ id: req.params.id });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Check if user is part of session or admin
    if (session.userId !== req.user.id && !await isExpertForSession(req.user.id, session.expertId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }
    
    res.json({
      success: true,
      data: session
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update session status
// POST /api/sessions/:id/status
router.post('/:id/status', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({ id: req.params.id });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    const { status } = req.body;
    
    if (!status || !['requested', 'scheduled', 'completed', 'canceled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required'
      });
    }
    
    // Check if user is part of session or admin
    if (session.userId !== req.user.id && !await isExpertForSession(req.user.id, session.expertId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }
    
    // Update status
    session.status = status;
    await session.save();
    
    res.json({
      success: true,
      data: session
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Create video room - Mock implementation
// POST /api/sessions/:id/video
router.post('/:id/video', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({ id: req.params.id });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Check if session type is video or voice
    if (!['video', 'voice'].includes(session.sessionType)) {
      return res.status(400).json({
        success: false,
        error: 'Session type must be video or voice'
      });
    }
    
    // Check if user is part of session or admin
    if (session.userId !== req.user.id && !await isExpertForSession(req.user.id, session.expertId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }
    
    // Mock video room creation (in real app, would use a video API)
    const meetingId = `veilo-meeting-${nanoid(10)}`;
    const meetingUrl = `https://meet.veilo.app/${meetingId}`;
    
    // Update session with meeting URL
    session.meetingUrl = meetingUrl;
    await session.save();
    
    res.json({
      success: true,
      data: {
        meetingUrl
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Helper function to check if user is expert for session
async function isExpertForSession(userId, expertId) {
  const expert = await Expert.findOne({ id: expertId });
  return expert && expert.userId === userId;
}

module.exports = router;
