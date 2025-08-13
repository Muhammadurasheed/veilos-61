const express = require('express');
const router = express.Router();
const SessionNote = require('../models/SessionNote');
const Session = require('../models/Session');
const Expert = require('../models/Expert');
const { authMiddleware } = require('../middleware/auth');

// Create session note
// POST /api/session-notes
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      sessionId,
      title,
      content,
      tags,
      isPrivate,
      attachments
    } = req.body;

    // Validation
    if (!sessionId || !title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Session ID, title, and content are required'
      });
    }

    // Verify session exists and user has permission
    const session = await Session.findOne({ id: sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user is part of session or admin
    const expert = await Expert.findOne({ id: session.expertId });
    
    if (session.userId !== req.user.id && 
        (!expert || expert.userId !== req.user.id) && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Create note
    const note = new SessionNote({
      sessionId,
      expertId: session.expertId,
      userId: session.userId,
      title,
      content,
      tags: tags || [],
      isPrivate: isPrivate || false,
      attachments: attachments || []
    });

    await note.save();

    res.json({
      success: true,
      data: note
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get notes for session
// GET /api/session-notes/session/:sessionId
router.get('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({ id: req.params.sessionId });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check authorization
    const expert = await Expert.findOne({ id: session.expertId });
    
    if (session.userId !== req.user.id && 
        (!expert || expert.userId !== req.user.id) && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    let query = { sessionId: req.params.sessionId };
    
    // If user is not expert, filter out private notes from expert
    if (!expert || expert.userId !== req.user.id) {
      query.isPrivate = false;
    }

    const notes = await SessionNote.find(query)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: notes
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get notes for user
// GET /api/session-notes/user/:userId
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const notes = await SessionNote.find({ 
      userId: req.params.userId,
      isPrivate: false 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: notes
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get notes for expert
// GET /api/session-notes/expert/:expertId
router.get('/expert/:expertId', authMiddleware, async (req, res) => {
  try {
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

    const notes = await SessionNote.find({ expertId: req.params.expertId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: notes
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get specific note
// GET /api/session-notes/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await SessionNote.findOne({ id: req.params.id });
    
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Check authorization
    const expert = await Expert.findOne({ id: note.expertId });
    
    if (note.userId !== req.user.id && 
        (!expert || expert.userId !== req.user.id) && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Check if note is private and user is not expert
    if (note.isPrivate && (!expert || expert.userId !== req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'Note is private'
      });
    }

    res.json({
      success: true,
      data: note
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update note
// PUT /api/session-notes/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await SessionNote.findOne({ id: req.params.id });
    
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Check authorization - only expert who created note can edit
    const expert = await Expert.findOne({ id: note.expertId });
    
    if (!expert || expert.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const {
      title,
      content,
      tags,
      isPrivate,
      attachments
    } = req.body;

    // Update fields
    if (title) note.title = title;
    if (content) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (isPrivate !== undefined) note.isPrivate = isPrivate;
    if (attachments !== undefined) note.attachments = attachments;

    await note.save();

    res.json({
      success: true,
      data: note
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Delete note
// DELETE /api/session-notes/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await SessionNote.findOne({ id: req.params.id });
    
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Check authorization - only expert who created note can delete
    const expert = await Expert.findOne({ id: note.expertId });
    
    if (!expert || expert.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    await SessionNote.deleteOne({ id: req.params.id });

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;