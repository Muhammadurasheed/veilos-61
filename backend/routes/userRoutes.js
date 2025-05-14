const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authMiddleware } = require('../middleware/auth');
const { generateAlias } = require('../utils/helpers');

// Register anonymous user
// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    // Generate random alias and avatar
    const alias = generateAlias();
    const avatarIndex = Math.floor(Math.random() * 12) + 1;
    
    const user = new User({
      alias,
      avatarIndex,
      role: 'shadow',
      isAnonymous: true
    });
    
    await user.save();
    
    // Generate token
    const payload = {
      user: {
        id: user.id
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          data: {
            token,
            user: {
              id: user.id,
              alias: user.alias,
              avatarIndex: user.avatarIndex,
              role: user.role,
              isAnonymous: user.isAnonymous
            }
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Register expert account (first step of expert registration)
// POST /api/users/register-expert-account
router.post('/register-expert-account', async (req, res) => {
  try {
    const { name, email, specialization, bio, pricingModel } = req.body;
    
    // Validation
    if (!name || !email || !specialization || !bio || !pricingModel) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }
    
    // Generate random alias and avatar
    const alias = name; // Use name as alias for expert accounts
    const avatarIndex = Math.floor(Math.random() * 12) + 1;
    
    // Create the user first
    const user = new User({
      alias,
      avatarIndex,
      role: 'shadow', // Will be updated to 'beacon' after verification
      email,
      isAnonymous: false
    });
    
    await user.save();
    
    // Generate token
    const payload = {
      user: {
        id: user.id
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          data: {
            token,
            userId: user.id,
            user: {
              id: user.id,
              alias: user.alias,
              avatarIndex: user.avatarIndex,
              role: user.role,
              email: user.email
            }
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Expert onboarding start - No auth required
// POST /api/users/expert-onboarding-start
router.post('/expert-onboarding-start', async (req, res) => {
  try {
    const { name, email, specialization, bio, pricingModel, pricingDetails } = req.body;
    
    // Validation
    if (!name || !email || !specialization || !bio) {
      return res.status(400).json({
        success: false,
        error: 'Required fields missing'
      });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }
    
    // Create user with expert information
    const alias = name; // Use name as alias for expert accounts
    const avatarIndex = Math.floor(Math.random() * 12) + 1;
    
    const user = new User({
      alias,
      name,
      email,
      avatarIndex,
      role: 'shadow', // Will be updated to 'beacon' after verification
      bio,
      isAnonymous: false,
      areasOfExpertise: [specialization],
      isExpert: false // Will be set to true after verification
    });
    
    await user.save();
    
    // Generate token
    const payload = {
      user: {
        id: user.id
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          data: {
            token,
            userId: user.id,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              alias: user.alias,
              avatarIndex: user.avatarIndex,
              role: user.role
            }
          }
        });
      }
    );
  } catch (err) {
    console.error('Expert onboarding error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Authenticate user
// POST /api/users/authenticate
router.post('/authenticate', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ id: decoded.user.id });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          alias: user.alias,
          avatarIndex: user.avatarIndex,
          role: user.role,
          isAnonymous: user.isAnonymous,
          expertId: user.expertId,
          email: user.email
        }
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Get current user
// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          alias: user.alias,
          avatarIndex: user.avatarIndex,
          role: user.role,
          isAnonymous: user.isAnonymous,
          expertId: user.expertId,
          avatarUrl: user.avatarUrl,
          email: user.email
        }
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

// Refresh user identity
// POST /api/users/refresh-identity
router.post('/refresh-identity', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Generate new alias and avatar
    user.alias = generateAlias();
    user.avatarIndex = Math.floor(Math.random() * 12) + 1;
    
    await user.save();
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          alias: user.alias,
          avatarIndex: user.avatarIndex,
          role: user.role,
          isAnonymous: user.isAnonymous
        }
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

// Update user avatar
// POST /api/users/avatar
router.post('/avatar', authMiddleware, async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    
    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        error: 'Avatar URL is required'
      });
    }
    
    const user = await User.findOneAndUpdate(
      { id: req.user.id },
      { avatarUrl },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          alias: user.alias,
          avatarIndex: user.avatarIndex,
          role: user.role,
          avatarUrl: user.avatarUrl
        }
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

// Create anonymous account for joining sessions
// POST /api/users/auth/anonymous
router.post('/auth/anonymous', async (req, res) => {
  try {
    // Generate random alias and avatar
    const alias = generateAlias();
    const avatarIndex = Math.floor(Math.random() * 12) + 1;
    
    const user = new User({
      alias,
      avatarIndex,
      role: 'shadow',
      isAnonymous: true
    });
    
    await user.save();
    
    // Generate token
    const payload = {
      user: {
        id: user.id
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          data: {
            token,
            user: {
              id: user.id,
              alias: user.alias,
              avatarIndex: user.avatarIndex,
              role: user.role,
              isAnonymous: true
            }
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
