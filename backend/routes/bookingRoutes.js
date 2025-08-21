
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Expert = require('../models/Expert');
const ChatSession = require('../models/ChatSession');
const { nanoid } = require('nanoid');

// Create a new booking
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const {
      expertId,
      sessionType,
      scheduledDateTime,
      duration,
      topic,
      description,
      urgency = 'normal'
    } = req.body;

    // Validate required fields
    if (!expertId || !sessionType || !scheduledDateTime || !duration) {
      return res.status(400).json({
        success: false,
        error: 'Missing required booking information'
      });
    }

    // Check if expert exists and is approved
    const expert = await Expert.findOne({ 
      id: expertId, 
      accountStatus: 'approved',
      verified: true 
    });
    
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found or not available for booking'
      });
    }

    // Calculate end time
    const startTime = new Date(scheduledDateTime);
    const endTime = new Date(startTime.getTime() + (duration * 60 * 1000));

    // Check for conflicts
    const conflicts = await Booking.findConflictingBookings(expertId, startTime, endTime);
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Time slot is already booked',
        conflicts: conflicts.map(c => ({
          id: c.id,
          scheduledDateTime: c.scheduledDateTime,
          duration: c.duration
        }))
      });
    }

    // Check expert availability (if availability is configured)
    const dayOfWeek = startTime.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const timeSlot = startTime.toTimeString().substring(0, 5);
    
    if (expert.availability?.length > 0 && !expert.isAvailable(dayOfWeek, timeSlot)) {
      return res.status(400).json({
        success: false,
        error: 'Expert is not available at the requested time'
      });
    }

    // Create booking
    const booking = new Booking({
      id: `booking-${nanoid(8)}`,
      expertId,
      userId: req.user.id,
      sessionType,
      scheduledDateTime: startTime,
      duration,
      topic,
      description,
      urgency,
      userDetails: {
        name: req.user.name || req.user.alias,
        alias: req.user.alias,
        email: req.user.email
      },
      status: expert.sessionPreferences?.autoAcceptBookings ? 'confirmed' : 'pending'
    });

    await booking.save();

    // Create chat session immediately for confirmed bookings
    if (booking.status === 'confirmed') {
      const chatSession = new ChatSession({
        id: `session-${nanoid(8)}`,
        expertId,
        userId: req.user.id,
        type: 'consultation',
        topic: topic || 'Consultation Session',
        participants: [
          {
            userId: req.user.id,
            role: 'user',
            alias: req.user.alias,
            avatarIndex: req.user.avatarIndex
          },
          {
            userId: expert.userId,
            role: 'expert',
            alias: expert.name,
            avatarUrl: expert.avatarUrl
          }
        ],
        scheduledAt: startTime
      });

      await chatSession.save();
      booking.sessionAccess.chatSessionId = chatSession.id;
      await booking.save();
    }

    // Set up reminder notifications
    const reminderTimes = [
      { type: 'email', time: 24 * 60 * 60 * 1000 }, // 24 hours before
      { type: 'push', time: 60 * 60 * 1000 }, // 1 hour before
      { type: 'in_app', time: 15 * 60 * 1000 } // 15 minutes before
    ];

    reminderTimes.forEach(reminder => {
      const reminderTime = new Date(startTime.getTime() - reminder.time);
      if (reminderTime > new Date()) {
        booking.addReminder(reminder.type, reminderTime);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking,
        chatSessionId: booking.sessionAccess.chatSessionId
      }
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
});

// Get user's bookings
router.get('/my-bookings', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { userId: req.user.id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .sort({ scheduledDateTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Enhance with expert information
    const bookingsWithExpertInfo = await Promise.all(
      bookings.map(async (booking) => {
        const expert = await Expert.findOne({ id: booking.expertId })
          .select('name avatarUrl specialization rating totalSessions responseTime')
          .lean();
        
        return {
          ...booking,
          expert
        };
      })
    );

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bookings: bookingsWithExpertInfo,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
});

// Get expert's bookings (for experts)
router.get('/expert-bookings', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Find expert record for this user
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert profile not found'
      });
    }

    const filter = { expertId: expert.id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .sort({ scheduledDateTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get expert bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expert bookings'
    });
  }
});

// Confirm booking (expert action)
router.patch('/:bookingId/confirm', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { notes } = req.body;

    const booking = await Booking.findOne({ id: bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Verify expert authorization
    const expert = await Expert.findOne({ 
      userId: req.user.id, 
      id: booking.expertId 
    });
    
    if (!expert) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to confirm this booking'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending bookings can be confirmed'
      });
    }

    // Confirm booking
    await booking.confirmBooking(req.user.id, notes);

    // Create chat session
    const chatSession = new ChatSession({
      id: `session-${nanoid(8)}`,
      expertId: booking.expertId,
      userId: booking.userId,
      type: 'consultation',
      topic: booking.topic || 'Consultation Session',
      participants: [
        {
          userId: booking.userId,
          role: 'user',
          alias: booking.userDetails.alias || 'User'
        },
        {
          userId: expert.userId,
          role: 'expert',
          alias: expert.name,
          avatarUrl: expert.avatarUrl
        }
      ],
      scheduledAt: booking.scheduledDateTime
    });

    await chatSession.save();
    
    booking.sessionAccess.chatSessionId = chatSession.id;
    await booking.save();

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      data: {
        booking,
        chatSessionId: chatSession.id
      }
    });

  } catch (error) {
    console.error('Booking confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm booking'
    });
  }
});

// Cancel booking
router.patch('/:bookingId/cancel', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findOne({ id: bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check authorization
    const isUser = booking.userId === req.user.id;
    const expert = await Expert.findOne({ 
      userId: req.user.id, 
      id: booking.expertId 
    });
    const isExpert = !!expert;

    if (!isUser && !isExpert) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this booking'
      });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel booking in current status'
      });
    }

    // Calculate refund amount (if applicable)
    let refundAmount = 0;
    if (booking.payment.status === 'paid') {
      const hoursUntilSession = (booking.scheduledDateTime - new Date()) / (1000 * 60 * 60);
      
      // Full refund if cancelled more than 24 hours in advance
      if (hoursUntilSession > 24) {
        refundAmount = booking.payment.amount;
      }
      // 50% refund if cancelled 2-24 hours in advance
      else if (hoursUntilSession > 2) {
        refundAmount = booking.payment.amount * 0.5;
      }
      // No refund if cancelled less than 2 hours in advance
    }

    await booking.cancelBooking(req.user.id, reason, refundAmount);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking,
        refundAmount
      }
    });

  } catch (error) {
    console.error('Booking cancellation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking'
    });
  }
});

// Start session (when it's time for the booking)
router.post('/:bookingId/start-session', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ id: bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check authorization
    const isUser = booking.userId === req.user.id;
    const expert = await Expert.findOne({ 
      userId: req.user.id, 
      id: booking.expertId 
    });
    const isExpert = !!expert;

    if (!isUser && !isExpert) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to start this session'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: 'Can only start confirmed bookings'
      });
    }

    // Check if it's time to start (within 15 minutes of scheduled time)
    const now = new Date();
    const scheduledTime = new Date(booking.scheduledDateTime);
    const timeDiff = scheduledTime - now;
    const minutesUntilStart = timeDiff / (1000 * 60);

    if (minutesUntilStart > 15) {
      return res.status(400).json({
        success: false,
        error: `Session can only be started 15 minutes before scheduled time. Please wait ${Math.ceil(minutesUntilStart)} more minutes.`
      });
    }

    if (minutesUntilStart < -30) {
      return res.status(400).json({
        success: false,
        error: 'Session has expired. Please book a new session.'
      });
    }

    // Get or create chat session
    let chatSession;
    if (booking.sessionAccess.chatSessionId) {
      chatSession = await ChatSession.findOne({ 
        id: booking.sessionAccess.chatSessionId 
      });
    }

    if (!chatSession) {
      chatSession = new ChatSession({
        id: `session-${nanoid(8)}`,
        expertId: booking.expertId,
        userId: booking.userId,
        type: 'consultation',
        topic: booking.topic || 'Consultation Session',
        participants: [
          {
            userId: booking.userId,
            role: 'user',
            alias: booking.userDetails.alias || 'User'
          },
          {
            userId: expert?.userId || booking.expertId,
            role: 'expert',
            alias: expert?.name || 'Expert',
            avatarUrl: expert?.avatarUrl
          }
        ]
      });

      await chatSession.save();
    }

    // Update booking status
    await booking.startSession(chatSession.id);

    res.json({
      success: true,
      message: 'Session started successfully',
      data: {
        booking,
        chatSessionId: chatSession.id,
        sessionUrl: `/chat/${chatSession.id}`
      }
    });

  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start session'
    });
  }
});

// Get expert availability
router.get('/expert/:expertId/availability', async (req, res) => {
  try {
    const { expertId } = req.params;
    const { date } = req.query;

    const expert = await Expert.findOne({ id: expertId })
      .select('availability sessionPreferences')
      .lean();

    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found'
      });
    }

    // Get existing bookings for the requested date
    const requestedDate = new Date(date);
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await Booking.find({
      expertId,
      scheduledDateTime: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['confirmed', 'in_progress'] }
    }).select('scheduledDateTime duration').lean();

    // Calculate available time slots
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const dayAvailability = expert.availability?.find(avail => avail.day === dayOfWeek);

    let availableSlots = [];
    if (dayAvailability) {
      dayAvailability.timeSlots.forEach(slot => {
        if (slot.available) {
          // Generate 30-minute slots within this time range
          const slotStart = new Date(`${date} ${slot.start}`);
          const slotEnd = new Date(`${date} ${slot.end}`);
          
          let currentSlot = new Date(slotStart);
          while (currentSlot < slotEnd) {
            const slotEndTime = new Date(currentSlot.getTime() + (30 * 60 * 1000));
            
            // Check if this slot conflicts with existing bookings
            const hasConflict = existingBookings.some(booking => {
              const bookingStart = new Date(booking.scheduledDateTime);
              const bookingEnd = new Date(bookingStart.getTime() + (booking.duration * 60 * 1000));
              
              return (currentSlot < bookingEnd && slotEndTime > bookingStart);
            });

            if (!hasConflict && slotEndTime <= slotEnd) {
              availableSlots.push({
                start: currentSlot.toISOString(),
                end: slotEndTime.toISOString(),
                duration: 30
              });
            }

            currentSlot = new Date(currentSlot.getTime() + (30 * 60 * 1000));
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        date,
        dayOfWeek,
        availableSlots,
        sessionPreferences: expert.sessionPreferences,
        totalSlots: availableSlots.length
      }
    });

  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability'
    });
  }
});

module.exports = router;
