
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
      role: 'shadow'
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
              role: user.role
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
          role: user.role
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
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          alias: req.user.alias,
          avatarIndex: req.user.avatarIndex,
          role: req.user.role
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
          role: user.role
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

module.exports = router;
