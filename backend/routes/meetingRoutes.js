const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const Session = require('../models/Session');
const Expert = require('../models/Expert');
const { authMiddleware } = require('../middleware/auth');
const { nanoid } = require('nanoid');

// Schedule a meeting
// POST /api/meetings
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      sessionId,
      expertId,
      title,
      description,
      scheduledTime,
      duration,
      timezone,
      meetingType
    } = req.body;

    // Validation
    if (!sessionId || !expertId || !title || !scheduledTime || !timezone || !meetingType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
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

    if (session.userId !== req.user.id && req.user.role !== 'admin') {
      // Check if user is the expert
      const expert = await Expert.findOne({ id: expertId });
      if (!expert || expert.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized'
        });
      }
    }

    // Check for scheduling conflicts
    const conflictingMeeting = await Meeting.findOne({
      expertId,
      scheduledTime: {
        $gte: new Date(new Date(scheduledTime).getTime() - (duration || 60) * 60000),
        $lte: new Date(new Date(scheduledTime).getTime() + (duration || 60) * 60000)
      },
      status: { $in: ['scheduled', 'started'] }
    });

    if (conflictingMeeting) {
      return res.status(409).json({
        success: false,
        error: 'Time slot conflicts with existing meeting'
      });
    }

    // Generate Agora channel name
    const agoraChannelName = `veilo-meeting-${nanoid(12)}`;

    // Create meeting
    const meeting = new Meeting({
      sessionId,
      expertId,
      userId: session.userId,
      title,
      description,
      scheduledTime: new Date(scheduledTime),
      duration: duration || 60,
      timezone,
      meetingType,
      agoraChannelName,
      reminders: [
        {
          type: 'email',
          scheduled: new Date(new Date(scheduledTime).getTime() - 24 * 60 * 60 * 1000) // 24 hours before
        },
        {
          type: 'notification',
          scheduled: new Date(new Date(scheduledTime).getTime() - 15 * 60 * 1000) // 15 minutes before
        }
      ]
    });

    await meeting.save();

    // Update session with scheduled time
    session.scheduledTime = scheduledTime;
    session.status = 'scheduled';
    await session.save();

    res.json({
      success: true,
      data: meeting
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get meetings for user
// GET /api/meetings/user/:userId
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const { status, upcoming } = req.query;
    
    let query = { userId: req.params.userId };
    
    if (status) {
      query.status = status;
    }
    
    if (upcoming === 'true') {
      query.scheduledTime = { $gte: new Date() };
    }

    const meetings = await Meeting.find(query)
      .sort({ scheduledTime: 1 });

    res.json({
      success: true,
      data: meetings
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get meetings for expert
// GET /api/meetings/expert/:expertId
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

    const { status, upcoming } = req.query;
    
    let query = { expertId: req.params.expertId };
    
    if (status) {
      query.status = status;
    }
    
    if (upcoming === 'true') {
      query.scheduledTime = { $gte: new Date() };
    }

    const meetings = await Meeting.find(query)
      .sort({ scheduledTime: 1 });

    res.json({
      success: true,
      data: meetings
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get meeting details
// GET /api/meetings/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ id: req.params.id });
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
    }

    // Check authorization
    const expert = await Expert.findOne({ id: meeting.expertId });
    
    if (meeting.userId !== req.user.id && 
        (!expert || expert.userId !== req.user.id) && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    res.json({
      success: true,
      data: meeting
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update meeting status
// PUT /api/meetings/:id/status
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ id: req.params.id });
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
    }

    const { status } = req.body;
    
    if (!status || !['scheduled', 'started', 'completed', 'cancelled', 'no-show'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required'
      });
    }

    // Check authorization
    const expert = await Expert.findOne({ id: meeting.expertId });
    
    if (meeting.userId !== req.user.id && 
        (!expert || expert.userId !== req.user.id) && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Update status and timestamps
    meeting.status = status;
    
    if (status === 'started' && !meeting.actualStartTime) {
      meeting.actualStartTime = new Date();
    }
    
    if (status === 'completed' && !meeting.actualEndTime) {
      meeting.actualEndTime = new Date();
    }

    await meeting.save();

    res.json({
      success: true,
      data: meeting
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Generate Agora token for meeting
// POST /api/meetings/:id/token
router.post('/:id/token', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ id: req.params.id });
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
    }

    // Check authorization
    const expert = await Expert.findOne({ id: meeting.expertId });
    
    if (meeting.userId !== req.user.id && 
        (!expert || expert.userId !== req.user.id) && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // For now, return mock token - will be replaced with actual Agora token generation
    const mockToken = `agora-token-${nanoid(32)}`;
    
    meeting.agoraToken = mockToken;
    await meeting.save();

    res.json({
      success: true,
      data: {
        token: mockToken,
        channelName: meeting.agoraChannelName,
        uid: req.user.id
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

// Join meeting
// POST /api/meetings/:id/join
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ id: req.params.id });
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
    }

    // Check authorization
    const expert = await Expert.findOne({ id: meeting.expertId });
    
    if (meeting.userId !== req.user.id && 
        (!expert || expert.userId !== req.user.id) && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Add user to attendees if not already present
    const existingAttendee = meeting.attendees.find(a => a.userId === req.user.id);
    
    if (!existingAttendee) {
      meeting.attendees.push({
        userId: req.user.id,
        joinedAt: new Date()
      });
    } else if (!existingAttendee.leftAt) {
      // User already in meeting
      return res.json({
        success: true,
        data: {
          message: 'Already in meeting',
          meeting
        }
      });
    } else {
      // User rejoining
      existingAttendee.joinedAt = new Date();
      existingAttendee.leftAt = undefined;
    }

    // Start meeting if not started
    if (meeting.status === 'scheduled') {
      meeting.status = 'started';
      meeting.actualStartTime = new Date();
    }

    await meeting.save();

    res.json({
      success: true,
      data: meeting
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Leave meeting
// POST /api/meetings/:id/leave
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ id: req.params.id });
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
    }

    // Find and update attendee
    const attendee = meeting.attendees.find(a => a.userId === req.user.id && !a.leftAt);
    
    if (attendee) {
      attendee.leftAt = new Date();
      attendee.duration = Math.round((attendee.leftAt - attendee.joinedAt) / 60000); // duration in minutes
    }

    // Check if all attendees have left
    const activeAttendees = meeting.attendees.filter(a => !a.leftAt);
    
    if (activeAttendees.length === 0 && meeting.status === 'started') {
      meeting.status = 'completed';
      meeting.actualEndTime = new Date();
    }

    await meeting.save();

    res.json({
      success: true,
      data: meeting
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