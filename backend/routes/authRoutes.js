const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const { validate } = require('../middleware/validation');
const { authLimiter } = require('../middleware/security');
const refreshTokenMiddleware = require('../middleware/refreshToken');
const { uploadAvatar } = require('../config/cloudinary');
const { authMiddleware } = require('../middleware/auth');
const { generateAlias } = require('../utils/helpers');

const router = express.Router();

// Primary Admin login route with proper response structure
router.post('/admin/login', 
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ]),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      console.log('🔐 Admin login attempt:', { email, hasPassword: !!password });
      
      // Find admin user
      const user = await User.findOne({ 
        email, 
        role: 'admin' 
      });
      
      if (!user) {
        console.log('❌ Admin user not found for email:', email);
        return res.error('Invalid admin credentials or insufficient permissions', 401);
      }
      
      if (!user.passwordHash) {
        console.log('❌ Admin user has no password hash:', email);
        return res.error('Invalid admin credentials or insufficient permissions', 401);
      }
      
      // Check password
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        console.log('❌ Invalid password for admin:', email);
        return res.error('Invalid admin credentials or insufficient permissions', 401);
      }
      
      console.log('✅ Admin login successful:', { userId: user.id, role: user.role });
      
      // Generate admin token with extended expiry
      const adminToken = jwt.sign(
        { 
          user: {
            id: user.id,
            role: user.role,
            isAdmin: true
          }
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );
      
      // Update last login
      user.lastLoginAt = new Date();
      await user.save();
      
  console.log('✅ Admin login complete - returning structured response');
  
  // Return structure that matches frontend expectations exactly
  res.success('Admin login successful', {
    token: adminToken,
    user: {
      id: user.id,
      alias: user.alias,
      email: user.email,
      role: user.role,
      avatarIndex: user.avatarIndex,
      avatarUrl: user.avatarUrl,
      isAnonymous: false
    },
    admin: {
      id: user.id,
      alias: user.alias,
      email: user.email,
      role: user.role,
      avatarIndex: user.avatarIndex,
      avatarUrl: user.avatarUrl,
      isAnonymous: false
    }
  });
      
    } catch (error) {
      console.error('❌ Admin login error:', error);
      res.error('Admin login failed: ' + error.message, 500);
    }
  }
);

// Register new user (now mandatory with real identity + shadow identity)
router.post('/register', 
  authLimiter,
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('realName').isLength({ min: 2, max: 50 }).trim(),
    body('preferredAlias').optional().isLength({ min: 2, max: 30 }).trim(),
  ]),
  async (req, res) => {
    try {
      const { email, password, realName, preferredAlias } = req.body;
      
      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.error('Email already registered. Try logging in instead.', 400);
      }

      // Generate shadow identity
      const shadowAlias = preferredAlias || generateAlias();
      const avatarIndex = Math.floor(Math.random() * 12) + 1;
      
      // Create user with both real and shadow identities
      const userData = {
        email,
        passwordHash: await bcrypt.hash(password, 12),
        realName,
        alias: shadowAlias,
        avatarIndex,
        role: 'shadow'
      };

      const user = new User(userData);
      await user.save();

      // Generate tokens
      const accessToken = jwt.sign(
        { 
          user: {
            id: user.id,
            shadowId: user.shadowId,
            role: user.role
          }
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      const refreshToken = jwt.sign(
        { user: { id: user.id } },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
      );

      // Save refresh token
      user.refreshToken = refreshToken;
      await user.save();

      console.log('User registration successful:', {
        id: user.id,
        shadowId: user.shadowId,
        alias: user.alias,
        email: user.email,
        role: user.role
      });

      return res.success(`Welcome to Veilo, ${user.alias}! Your secure shadow identity has been created.`, {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          shadowId: user.shadowId,
          alias: user.alias,
          avatarIndex: user.avatarIndex,
          role: user.role,
          isExpert: user.isExpert,
          avatarUrl: user.avatarUrl,
          email: user.email,
          realName: user.realName,
          activities: user.activities,
          preferences: user.preferences
        }
      });

    } catch (error) {
      console.error('Registration error:', error.message, {
        stack: error.stack,
        userId: req.body?.email || 'unknown'
      });
      return res.error('Registration failed: ' + error.message, 500);
    }
  }
);

// Login
router.post('/login',
  authLimiter,
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ]),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user || !user.passwordHash) {
        return res.error('Invalid credentials', 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.error('Invalid credentials', 401);
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { 
          user: {
            id: user.id
          }
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      const refreshToken = jwt.sign(
        { user: { id: user.id } },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
      );

      // Save refresh token
      user.refreshToken = refreshToken;
      user.lastLoginAt = new Date();
      await user.save();

      return res.success('Login successful', {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          shadowId: user.shadowId,
          alias: user.alias,
          avatarIndex: user.avatarIndex,
          role: user.role,
          isExpert: user.isExpert,
          avatarUrl: user.avatarUrl,
          email: user.email,
          realName: user.realName,
          activities: user.activities,
          preferences: user.preferences
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.error('Login failed', 500);
    }
  }
);

// Refresh token
router.post('/refresh-token', refreshTokenMiddleware);

// Logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    return res.success(null, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    return res.error('Logout failed', 500);
  }
});

// Verify admin token specifically
router.get('/admin/verify', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Admin token verification for user:', req.user?.id);
    
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      console.log('❌ Admin verify: User not found');
      return res.error('User not found', 404);
    }

    if (user.role !== 'admin') {
      console.log('❌ Admin verify: User is not admin', { userRole: user.role });
      return res.error('Admin access required', 403);
    }

    console.log('✅ Admin verification successful:', { userId: user.id, role: user.role });

    return res.success('Admin token valid', {
      user: {
        id: user.id,
        alias: user.alias,
        avatarIndex: user.avatarIndex,
        role: user.role,
        isExpert: user.isExpert,
        avatarUrl: user.avatarUrl,
        email: user.email,
        isAnonymous: user.isAnonymous
      }
    });

  } catch (error) {
    console.error('❌ Admin token verification error:', error);
    return res.error('Admin token verification failed', 500);
  }
});

// Verify token
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.error('User not found', 404);
    }

    return res.success('Token valid', {
      user: {
        id: user.id,
        alias: user.alias,
        avatarIndex: user.avatarIndex,
        role: user.role,
        isExpert: user.isExpert,
        avatarUrl: user.avatarUrl,
        email: user.email,
        isAnonymous: user.isAnonymous
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return res.error('Token verification failed', 500);
  }
});

// Update profile
router.put('/profile', 
  authMiddleware,
  validate([
    body('alias').optional().isLength({ min: 2, max: 30 }),
    body('email').optional().isEmail().normalizeEmail(),
  ]),
  async (req, res) => {
    try {
      const user = await User.findOne({ id: req.user.id });
      if (!user) {
        return res.error('User not found', 404);
      }

      const { alias, email } = req.body;

      // Update allowed fields
      if (alias) user.alias = alias;
      if (email && email !== user.email) {
        // Check if email is already taken
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.id !== user.id) {
          return res.error('Email already in use', 400);
        }
        user.email = email;
        user.isAnonymous = false;
      }

      await user.save();

      return res.success('Profile updated successfully', {
        user: {
          id: user.id,
          alias: user.alias,
          avatarIndex: user.avatarIndex,
          role: user.role,
          isExpert: user.isExpert,
          avatarUrl: user.avatarUrl,
          email: user.email,
          isAnonymous: user.isAnonymous
        }
      });

    } catch (error) {
      console.error('Profile update error:', error);
      return res.error('Profile update failed', 500);
    }
  }
);

// Update avatar
router.post('/avatar',
  authMiddleware,
  uploadAvatar.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.error('No file uploaded', 400);
      }

      const user = await User.findOne({ id: req.user.id });
      if (!user) {
        return res.error('User not found', 404);
      }

      // Update user's avatar URL
      user.avatarUrl = req.file.path;
      await user.save();

      return res.success('Avatar updated successfully', {
        user: {
          id: user.id,
          alias: user.alias,
          avatarIndex: user.avatarIndex,
          role: user.role,
          isExpert: user.isExpert,
          avatarUrl: user.avatarUrl,
          email: user.email,
          isAnonymous: user.isAnonymous
        }
      });

    } catch (error) {
      console.error('Avatar update error:', error);
      return res.error('Avatar update failed', 500);
    }
  }
);

module.exports = router;