const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const { authMiddleware } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Expert = require('../models/Expert');
const User = require('../models/User');

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
      urgency
    } = req.body;

    // Validate required fields
    if (!expertId || !sessionType || !scheduledDateTime || !duration || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Find the expert
    const expert = await Expert.findOne({ id: expertId });
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found'
      });
    }

    // Check if expert is available (comprehensive check)
    if (expert.accountStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Expert is not available for bookings'
      });
    }

    if (!expert.verified) {
      return res.status(400).json({
        success: false,
        error: 'Expert is not yet verified'
      });
    }

    // Validate session time is in the future
    const scheduledTime = new Date(scheduledDateTime);
    if (scheduledTime <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Session must be scheduled for a future time'
      });
    }

    // Create booking
    const booking = new Booking({
      id: `booking-${nanoid(8)}`,
      userId: req.user.id,
      expertId: expertId,
      sessionType,
      scheduledDateTime: new Date(scheduledDateTime),
      duration: parseInt(duration),
      topic,
      description: description || '',
      urgency: urgency || 'normal',
      status: 'confirmed', // Auto-confirm for now
      createdAt: new Date()
    });

    await booking.save();

    // Create a chat session ID for immediate connection
    const chatSessionId = `chat-${nanoid(8)}`;

    res.json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: {
          id: booking.id,
          expertId: booking.expertId,
          sessionType: booking.sessionType,
          scheduledDateTime: booking.scheduledDateTime,
          duration: booking.duration,
          topic: booking.topic,
          status: booking.status
        },
        chatSessionId,
        expert: {
          id: expert.id,
          name: expert.name,
          specialization: expert.specialization,
          avatarUrl: expert.avatarUrl
        }
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
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // Enhance bookings with expert details
    const enhancedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const expert = await Expert.findOne({ id: booking.expertId }).lean();
        return {
          ...booking,
          expert: expert ? {
            id: expert.id,
            name: expert.name,
            specialization: expert.specialization,
            avatarUrl: expert.avatarUrl
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: enhancedBookings
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
});

// Get booking by ID
router.get('/:bookingId', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findOne({ 
      id: bookingId,
      $or: [
        { userId: req.user.id },
        { expertId: req.user.id }
      ]
    }).lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Get expert and user details
    const [expert, user] = await Promise.all([
      Expert.findOne({ id: booking.expertId }).lean(),
      User.findOne({ id: booking.userId }).lean()
    ]);

    res.json({
      success: true,
      data: {
        ...booking,
        expert: expert ? {
          id: expert.id,
          name: expert.name,
          specialization: expert.specialization,
          avatarUrl: expert.avatarUrl
        } : null,
        user: user ? {
          id: user.id,
          alias: user.alias,
          avatarIndex: user.avatarIndex,
          avatarUrl: user.avatarUrl
        } : null
      }
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking'
    });
  }
});

// Update booking status
router.patch('/:bookingId/status', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, notes } = req.body;

    const booking = await Booking.findOne({ 
      id: bookingId,
      expertId: req.user.id  // Only expert can update status
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or access denied'
      });
    }

    booking.status = status;
    if (notes) {
      booking.notes = notes;
    }
    booking.updatedAt = new Date();

    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status'
    });
  }
});

module.exports = router;