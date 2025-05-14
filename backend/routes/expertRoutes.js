
const express = require('express');
const router = express.Router();
const Expert = require('../models/Expert');
const User = require('../models/User');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
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

// Get expert by ID
// GET /api/experts/:id
router.get('/:id', async (req, res) => {
  try {
    const expert = await Expert.findOne({ id: req.params.id })
      .select('-__v -userId -email -phoneNumber');
    
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found'
      });
    }
    
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

module.exports = router;
