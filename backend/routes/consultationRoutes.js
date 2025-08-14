const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');
const Consultation = require('../models/Consultation');
const Expert = require('../models/Expert');
const ExpertEarnings = require('../models/ExpertEarnings');
const User = require('../models/User');

const router = express.Router();

// Create consultation session (initiate payment)
router.post('/create',
  authMiddleware,
  generalLimiter,
  validate([
    body('expertId').notEmpty().withMessage('Expert ID is required'),
    body('type').isIn(['chat', 'voice', 'video', 'emergency']).withMessage('Invalid consultation type'),
    body('duration').isInt({ min: 15, max: 120 }).withMessage('Duration must be between 15-120 minutes'),
    body('scheduledAt').isISO8601().withMessage('Valid scheduled date is required'),
    body('topic').optional().isLength({ max: 500 }).withMessage('Topic too long'),
    body('urgencyLevel').optional().isIn(['low', 'medium', 'high', 'emergency'])
  ]),
  async (req, res) => {
    try {
      const { expertId, type, duration, scheduledAt, topic, urgencyLevel } = req.body;
      
      // Verify expert exists and is available
      const expert = await Expert.findOne({ id: expertId });
      if (!expert) {
        return res.error('Expert not found', 404);
      }
      
      if (expert.accountStatus !== 'active') {
        return res.error('Expert is not available', 400);
      }
      
      // Calculate pricing based on expert's rates and consultation type
      let baseRate = expert.pricing?.rate || 50; // cents per minute
      
      // Apply multipliers for different types
      const multipliers = {
        chat: 1,
        voice: 1.2,
        video: 1.5,
        emergency: 2.5
      };
      
      const finalRate = Math.floor(baseRate * multipliers[type]);
      const totalAmount = finalRate * duration;
      
      // Create consultation record
      const consultation = new Consultation({
        clientId: req.user.id,
        expertId,
        type,
        duration,
        pricing: {
          baseRate: finalRate,
          totalAmount,
          currency: 'usd'
        },
        session: {
          scheduledAt: new Date(scheduledAt)
        },
        content: {
          topic,
          urgencyLevel: urgencyLevel || 'medium'
        }
      });
      
      await consultation.save();
      
      return res.success({
        consultation: {
          id: consultation.id,
          expertId,
          type,
          duration,
          totalAmount,
          scheduledAt,
          status: consultation.session.status
        }
      }, 'Consultation created successfully');
      
    } catch (error) {
      console.error('Consultation creation error:', error);
      return res.error('Failed to create consultation', 500);
    }
  }
);

// Get consultation details
router.get('/:consultationId',
  authMiddleware,
  async (req, res) => {
    try {
      const consultation = await Consultation.findOne({ id: req.params.consultationId });
      
      if (!consultation) {
        return res.error('Consultation not found', 404);
      }
      
      // Check if user is client or expert
      if (consultation.clientId !== req.user.id && consultation.expertId !== req.user.id) {
        return res.error('Access denied', 403);
      }
      
      // Get expert and client details
      const expert = await Expert.findOne({ id: consultation.expertId });
      const client = await User.findOne({ id: consultation.clientId });
      
      return res.success({
        consultation: {
          ...consultation.toObject(),
          expert: expert ? {
            id: expert.id,
            name: expert.name,
            specialization: expert.specialization,
            avatar: expert.avatar,
            rating: expert.rating
          } : null,
          client: client ? {
            id: client.id,
            alias: client.alias,
            avatarIndex: client.avatarIndex
          } : null
        }
      });
      
    } catch (error) {
      console.error('Get consultation error:', error);
      return res.error('Failed to get consultation', 500);
    }
  }
);

// Update consultation session status
router.patch('/:consultationId/status',
  authMiddleware,
  validate([
    body('status').isIn(['active', 'completed', 'cancelled', 'missed']).withMessage('Invalid status'),
    body('actualDuration').optional().isInt({ min: 1 }).withMessage('Invalid duration')
  ]),
  async (req, res) => {
    try {
      const { status, actualDuration } = req.body;
      
      const consultation = await Consultation.findOne({ id: req.params.consultationId });
      if (!consultation) {
        return res.error('Consultation not found', 404);
      }
      
      // Only expert can update session status
      if (consultation.expertId !== req.user.id) {
        return res.error('Access denied', 403);
      }
      
      consultation.session.status = status;
      
      if (status === 'active' && !consultation.session.startedAt) {
        consultation.session.startedAt = new Date();
      }
      
      if (status === 'completed') {
        consultation.session.endedAt = new Date();
        if (actualDuration) {
          consultation.session.actualDuration = actualDuration;
          // Recalculate earnings based on actual duration
          consultation.pricing.totalAmount = consultation.pricing.baseRate * actualDuration;
        }
        
        // Update expert earnings
        const earnings = await ExpertEarnings.findOne({ expertId: consultation.expertId });
        if (earnings) {
          earnings.balance.pending += consultation.earnings.expertEarnings;
          earnings.balance.lifetime += consultation.earnings.expertEarnings;
          await earnings.updateStats(consultation);
        }
      }
      
      await consultation.save();
      
      return res.success({
        consultation: {
          id: consultation.id,
          status: consultation.session.status,
          actualDuration: consultation.session.actualDuration
        }
      }, 'Consultation status updated');
      
    } catch (error) {
      console.error('Update consultation error:', error);
      return res.error('Failed to update consultation', 500);
    }
  }
);

// Rate consultation
router.post('/:consultationId/rate',
  authMiddleware,
  validate([
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1-5'),
    body('feedback').optional().isLength({ max: 1000 }).withMessage('Feedback too long')
  ]),
  async (req, res) => {
    try {
      const { rating, feedback } = req.body;
      
      const consultation = await Consultation.findOne({ id: req.params.consultationId });
      if (!consultation) {
        return res.error('Consultation not found', 404);
      }
      
      // Check if user is client or expert
      if (consultation.clientId === req.user.id) {
        consultation.rating.clientRating = rating;
        consultation.rating.clientFeedback = feedback;
      } else if (consultation.expertId === req.user.id) {
        consultation.rating.expertRating = rating;
        consultation.rating.expertFeedback = feedback;
      } else {
        return res.error('Access denied', 403);
      }
      
      await consultation.save();
      
      // Update expert's average rating if client rated
      if (consultation.clientId === req.user.id) {
        const expert = await Expert.findOne({ id: consultation.expertId });
        if (expert) {
          const allRatings = await Consultation.find({
            expertId: consultation.expertId,
            'rating.clientRating': { $exists: true }
          }).select('rating.clientRating');
          
          const avgRating = allRatings.reduce((sum, c) => sum + c.rating.clientRating, 0) / allRatings.length;
          expert.rating = Number(avgRating.toFixed(1));
          await expert.save();
        }
      }
      
      return res.success({}, 'Rating submitted successfully');
      
    } catch (error) {
      console.error('Rate consultation error:', error);
      return res.error('Failed to rate consultation', 500);
    }
  }
);

// Get user's consultations (client or expert)
router.get('/',
  authMiddleware,
  async (req, res) => {
    try {
      const { status, limit = 20, offset = 0 } = req.query;
      
      const query = {
        $or: [
          { clientId: req.user.id },
          { expertId: req.user.id }
        ]
      };
      
      if (status) {
        query['session.status'] = status;
      }
      
      const consultations = await Consultation.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));
      
      // Get expert and client details for each consultation
      const enrichedConsultations = await Promise.all(
        consultations.map(async (consultation) => {
          const expert = await Expert.findOne({ id: consultation.expertId });
          const client = await User.findOne({ id: consultation.clientId });
          
          return {
            ...consultation.toObject(),
            expert: expert ? {
              id: expert.id,
              name: expert.name,
              specialization: expert.specialization,
              avatar: expert.avatar,
              rating: expert.rating
            } : null,
            client: client ? {
              id: client.id,
              alias: client.alias,
              avatarIndex: client.avatarIndex
            } : null
          };
        })
      );
      
      return res.success({
        consultations: enrichedConsultations,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: await Consultation.countDocuments(query)
        }
      });
      
    } catch (error) {
      console.error('Get consultations error:', error);
      return res.error('Failed to get consultations', 500);
    }
  }
);

module.exports = router;