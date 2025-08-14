const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');
const Consultation = require('../models/Consultation');
const Expert = require('../models/Expert');
const ExpertEarnings = require('../models/ExpertEarnings');

const router = express.Router();

// Create Stripe checkout session for consultation payment
router.post('/create-consultation-payment',
  authMiddleware,
  generalLimiter,
  validate([
    body('consultationId').notEmpty().withMessage('Consultation ID is required')
  ]),
  async (req, res) => {
    try {
      const { consultationId } = req.body;
      
      const consultation = await Consultation.findOne({ id: consultationId });
      if (!consultation) {
        return res.error('Consultation not found', 404);
      }
      
      // Verify user is the client
      if (consultation.clientId !== req.user.id) {
        return res.error('Access denied', 403);
      }
      
      // Check if already paid
      if (consultation.payment.status === 'paid') {
        return res.error('Consultation already paid', 400);
      }
      
      const expert = await Expert.findOne({ id: consultation.expertId });
      
      // Mock Stripe session creation (replace with actual Stripe integration)
      const mockStripeSessionId = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update consultation with stripe session
      consultation.payment.stripeSessionId = mockStripeSessionId;
      await consultation.save();
      
      return res.success({
        sessionId: mockStripeSessionId,
        url: `https://checkout.stripe.com/pay/${mockStripeSessionId}`, // Mock URL
        consultation: {
          id: consultation.id,
          type: consultation.type,
          duration: consultation.duration,
          totalAmount: consultation.pricing.totalAmount,
          expert: {
            name: expert?.name,
            specialization: expert?.specialization
          }
        }
      }, 'Payment session created');
      
    } catch (error) {
      console.error('Create payment session error:', error);
      return res.error('Failed to create payment session', 500);
    }
  }
);

// Handle Stripe payment success webhook (mock implementation)
router.post('/payment-success',
  validate([
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    body('paymentIntentId').notEmpty().withMessage('Payment Intent ID is required')
  ]),
  async (req, res) => {
    try {
      const { sessionId, paymentIntentId } = req.body;
      
      const consultation = await Consultation.findOne({
        'payment.stripeSessionId': sessionId
      });
      
      if (!consultation) {
        return res.error('Consultation not found', 404);
      }
      
      // Update payment status
      consultation.payment.status = 'paid';
      consultation.payment.stripePaymentIntentId = paymentIntentId;
      consultation.payment.paidAt = new Date();
      await consultation.save();
      
      // Initialize or update expert earnings
      let earnings = await ExpertEarnings.findOne({ expertId: consultation.expertId });
      if (!earnings) {
        earnings = new ExpertEarnings({
          expertId: consultation.expertId
        });
      }
      
      earnings.balance.pending += consultation.earnings.expertEarnings;
      earnings.balance.lifetime += consultation.earnings.expertEarnings;
      await earnings.updateStats(consultation);
      
      return res.success({}, 'Payment processed successfully');
      
    } catch (error) {
      console.error('Payment success error:', error);
      return res.error('Failed to process payment', 500);
    }
  }
);

// Create Stripe Connect account for expert payouts
router.post('/create-expert-account',
  authMiddleware,
  async (req, res) => {
    try {
      // Verify user is an expert
      const expert = await Expert.findOne({ userId: req.user.id });
      if (!expert) {
        return res.error('Expert profile not found', 404);
      }
      
      // Mock Stripe Connect account creation
      const mockAccountId = `acct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Initialize earnings record
      let earnings = await ExpertEarnings.findOne({ expertId: expert.id });
      if (!earnings) {
        earnings = new ExpertEarnings({
          expertId: expert.id
        });
      }
      
      earnings.payout.stripeAccountId = mockAccountId;
      await earnings.save();
      
      return res.success({
        accountId: mockAccountId,
        onboardingUrl: `https://connect.stripe.com/setup/e/${mockAccountId}` // Mock URL
      }, 'Stripe account created successfully');
      
    } catch (error) {
      console.error('Create expert account error:', error);
      return res.error('Failed to create Stripe account', 500);
    }
  }
);

// Get expert earnings summary
router.get('/earnings',
  authMiddleware,
  async (req, res) => {
    try {
      const expert = await Expert.findOne({ userId: req.user.id });
      if (!expert) {
        return res.error('Expert profile not found', 404);
      }
      
      const earnings = await ExpertEarnings.findOne({ expertId: expert.id });
      if (!earnings) {
        return res.success({
          balance: { available: 0, pending: 0, lifetime: 0 },
          statistics: {
            totalConsultations: 0,
            averageRating: 0,
            totalMinutes: 0,
            responseTime: 0,
            completionRate: 100
          },
          monthlyStats: []
        });
      }
      
      return res.success({
        balance: earnings.balance,
        statistics: earnings.statistics,
        monthlyStats: earnings.monthlyStats,
        payout: {
          method: earnings.payout.method,
          schedule: earnings.payout.schedule,
          minimumAmount: earnings.payout.minimumAmount,
          hasStripeAccount: !!earnings.payout.stripeAccountId
        }
      });
      
    } catch (error) {
      console.error('Get earnings error:', error);
      return res.error('Failed to get earnings', 500);
    }
  }
);

// Request payout
router.post('/request-payout',
  authMiddleware,
  validate([
    body('amount').isInt({ min: 2000 }).withMessage('Minimum payout is $20.00')
  ]),
  async (req, res) => {
    try {
      const { amount } = req.body;
      
      const expert = await Expert.findOne({ userId: req.user.id });
      if (!expert) {
        return res.error('Expert profile not found', 404);
      }
      
      const earnings = await ExpertEarnings.findOne({ expertId: expert.id });
      if (!earnings || !earnings.payout.stripeAccountId) {
        return res.error('Stripe account not configured', 400);
      }
      
      if (earnings.balance.available < amount) {
        return res.error('Insufficient available balance', 400);
      }
      
      // Mock payout creation
      const mockTransferId = `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update balances
      earnings.balance.available -= amount;
      await earnings.save();
      
      return res.success({
        transferId: mockTransferId,
        amount,
        expectedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
      }, 'Payout requested successfully');
      
    } catch (error) {
      console.error('Request payout error:', error);
      return res.error('Failed to request payout', 500);
    }
  }
);

module.exports = router;