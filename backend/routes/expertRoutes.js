
const express = require('express');
const router = express.Router();
const Expert = require('../models/Expert');
const User = require('../models/User');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const { notifyExpertApplicationSubmitted } = require('../socket/socketHandler');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Register expert
// POST /api/experts/register
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      email,
      specialization,
      bio,
      pricingModel,
      pricingDetails,
      phoneNumber
    } = req.body;
    
    // Validation
    if (!name || !email || !specialization || !bio || !pricingModel) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }
    
    // Check if expert with email already exists
    const existingExpert = await Expert.findOne({ email });
    if (existingExpert) {
      return res.status(400).json({
        success: false,
        error: 'An expert with this email already exists'
      });
    }
    
    // Create expert - use the authenticated user's ID
    const expert = new Expert({
      userId: req.user.id, // This is now guaranteed to be available since we use authMiddleware
      name,
      email,
      specialization,
      bio,
      pricingModel,
      pricingDetails,
      phoneNumber,
      topicsHelped: [],
      testimonials: []
    });
    
    await expert.save();
    
    // Update user role
    await User.findOneAndUpdate(
      { id: req.user.id },
      { 
        role: 'beacon',
        expertId: expert.id
      }
    );

    console.log('🚀 Sending real-time notification for expert application:', expert.email);
    
    // Send immediate notification to admins using the same pattern as sanctuary submissions
    try {
      // Use getIO() method for consistency with sanctuary pattern  
      const { getIO } = require('../socket/socketHandler');
      const io = getIO();
      
      const expertData = {
        id: expert.id,
        name: expert.name,
        email: expert.email,
        specialization: expert.specialization,
        bio: expert.bio,
        pricingModel: expert.pricingModel,
        pricingDetails: expert.pricingDetails,
        phoneNumber: expert.phoneNumber,
        createdAt: expert.createdAt,
        accountStatus: expert.accountStatus,
        verificationLevel: expert.verificationLevel,
        verificationDocuments: expert.verificationDocuments || []
      };
      
      // Get connected admins for debugging
      const adminRoom = io.sockets.adapter.rooms.get('admin_panel');
      const connectedAdmins = adminRoom ? adminRoom.size : 0;
      
      console.log(`📊 Real-time notification status:`, {
        expertId: expert.id,
        expertEmail: expert.email,
        roomName: 'admin_panel',
        connectedAdmins,
        timestamp: new Date().toISOString()
      });
      
      if (connectedAdmins === 0) {
        console.warn('⚠️  No admins connected - expert application notification will not be delivered in real-time');
      }
      
      // Send to admin panel room (matching sanctuary pattern)
      io.to('admin_panel').emit('expert_application_submitted', {
        expert: expertData,
        timestamp: new Date().toISOString(),
        type: 'new_application'
      });
      
      console.log('✅ Real-time expert application notification sent successfully to', connectedAdmins, 'admins');
      
    } catch (notificationError) {
      console.error('❌ Failed to send real-time notification:', notificationError);
      // Continue execution even if notification fails
    }
    
    res.json({
      success: true,
      data: {
        expertId: expert.id,
        userId: req.user.id,
        expert: expert
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

// Upload verification document - IMPROVED WITH ERROR HANDLING
// POST /api/experts/:id/document
router.post('/:id/document', authMiddleware, async (req, res) => {
  // Use multer middleware here, but handle any errors properly
  upload.single('file')(req, res, async (err) => {
    // Handle multer errors
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    
    try {
      const expert = await Expert.findOne({ id: req.params.id });
      
      if (!expert) {
        return res.status(404).json({
          success: false,
          error: 'Expert not found'
        });
      }
      
      // Check if user is the expert or an admin
      if (expert.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Not authorized'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }
      
      const { documentType } = req.body;
      
      if (!documentType) {
        return res.status(400).json({
          success: false,
          error: 'Document type is required'
        });
      }
      
      // Create file URL (relative path)
      const fileUrl = `/uploads/${req.file.filename}`;
      
      // Add document to expert
      expert.verificationDocuments.push({
        type: documentType,
        fileUrl,
        fileName: req.file.originalname,
        status: 'pending'
      });
      
      // If photo type, update avatar URL immediately
      if (documentType === 'photo') {
        expert.avatarUrl = fileUrl;
      }
      
      await expert.save();
      
      res.json({
        success: true,
        data: {
          fileUrl
        }
      });
    } catch (err) {
      console.error('Document upload error:', err.message);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  });
});

// Get all experts
// GET /api/experts
router.get('/', async (req, res) => {
  try {
    const experts = await Expert.find({ accountStatus: 'approved' })
      .select('-__v -userId -email -phoneNumber');
    
    res.json({
      success: true,
      data: experts
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// GET /api/experts/:id
router.get('/:id', async (req, res) => {
  try {
    const expertId = req.params.id;
    console.log(`🔍 GET /api/experts/${expertId} - Looking for expert`);
    
    // First, check all experts (including non-approved) for debugging
    const allExperts = await Expert.find({ id: expertId });
    console.log(`📊 All experts with ID ${expertId}:`, allExperts.map(e => ({
      id: e.id,
      name: e.name,
      accountStatus: e.accountStatus,
      createdAt: e.createdAt
    })));
    
    const expert = await Expert.findOne({ id: expertId, accountStatus: 'approved' })
      .select('-__v -userId -email -phoneNumber');
    
    if (!expert) {
      console.log(`❌ Expert not found or not approved: ${expertId}`);
      return res.status(404).json({
        success: false,
        error: 'Expert not found or not approved',
        debug: {
          searchedId: expertId,
          allExpertsWithId: allExperts.length,
          message: allExperts.length > 0 ? 'Expert exists but not approved' : 'Expert does not exist'
        }
      });
    }
    
    // Calculate followers count
    expert.followersCount = expert.followers ? expert.followers.length : 0;
    
    // Ensure avatarUrl is properly set with full path for uploads
    if (expert.avatarUrl) {
      if (expert.avatarUrl.startsWith('/uploads/')) {
        expert.avatarUrl = `http://localhost:3000${expert.avatarUrl}`;
      } else if (!expert.avatarUrl.startsWith('http')) {
        // Static expert images
        expert.avatarUrl = `http://localhost:3000${expert.avatarUrl}`;
      }
    }
    
    console.log(`✅ Expert found and returned: ${expert.name} (${expert.id}), Avatar: ${expert.avatarUrl}`);
    
    res.json({
      success: true,
      data: expert
    });
  } catch (err) {
    console.error('❌ Error in expert route:', err.message);
    console.error('❌ Stack trace:', err.stack);
    res.status(500).json({
      success: false,
      error: 'Server error',
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get expert documents
// GET /api/experts/:id/documents
router.get('/:id/documents', authMiddleware, async (req, res) => {
  try {
    const expert = await Expert.findOne({ id: req.params.id });
    
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found'
      });
    }
    
    // Only allow expert owner or admin to view documents
    if (expert.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }
    
    res.json({
      success: true,
      data: expert.verificationDocuments
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update expert profile
// PUT /api/experts/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    let expert = await Expert.findOne({ id: req.params.id });
    
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found'
      });
    }
    
    // Check if user is the expert
    if (expert.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }
    
    const {
      name,
      specialization,
      bio,
      pricingModel,
      pricingDetails,
      phoneNumber
    } = req.body;
    
    // Update fields
    if (name) expert.name = name;
    if (specialization) expert.specialization = specialization;
    if (bio) expert.bio = bio;
    if (pricingModel) expert.pricingModel = pricingModel;
    if (pricingDetails) expert.pricingDetails = pricingDetails;
    if (phoneNumber) expert.phoneNumber = phoneNumber;
    
    await expert.save();
    
    res.json({
      success: true,
      data: expert
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Include follow/unfollow routes
router.use('/', require('./expertFollowRoutes'));

module.exports = router;
