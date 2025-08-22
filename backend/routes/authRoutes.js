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

// Admin login route
router.post('/admin/login', 
  authLimiter,
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ]),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find admin user
      const user = await User.findOne({ 
        email, 
        role: 'admin' 
      });
      
      if (!user || !user.passwordHash) {
        return res.error('Invalid admin credentials', 401);
      }
      
      // Check password
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.error('Invalid admin credentials', 401);
      }
      
      // Generate tokens
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );
      
      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
        { expiresIn: '7d' }
      );
      
      // Update user with refresh token and last login
      user.refreshToken = refreshToken;
      user.lastLoginAt = new Date();
      await user.save();
      
      res.success('Admin login successful', {
        user: {
          id: user.id,
          alias: user.alias,
          email: user.email,
          role: user.role,
          avatarIndex: user.avatarIndex,
          avatarUrl: user.avatarUrl
        },
        admin: {
          id: user.id,
          alias: user.alias,
          email: user.email,
          role: user.role,
          avatarIndex: user.avatarIndex,
          avatarUrl: user.avatarUrl
        },
        token,
        refreshToken
      });
      
    } catch (error) {
      console.error('Admin login error:', error);
      res.error('Admin login failed: ' + error.message, 500);
    }
  }
);

// Register new user
router.post('/register', 
  authLimiter,
  validate([
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 6 }),
    body('alias').optional().isLength({ min: 2, max: 30 }),
  ]),
  async (req, res) => {
    try {
      const { email, password, alias } = req.body;
      
      // Check if email already exists (for non-anonymous users)
      if (email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.error('Email already registered', 400);
        }
      }

      // Create user data
      const userData = {
        alias: alias || generateAlias(),
        avatarIndex: Math.floor(Math.random() * 12) + 1,
        role: 'shadow',
        isAnonymous: !email,
      };

      // Add email and password for non-anonymous users
      if (email && password) {
        userData.email = email;
        userData.passwordHash = await bcrypt.hash(password, 12);
        userData.isAnonymous = false;
      }

      const user = new User(userData);
      await user.save();

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
      await user.save();

      console.log('User registration successful:', {
        id: user.id,
        alias: user.alias,
        isAnonymous: user.isAnonymous,
        role: user.role
      });

      return res.success({
        token: accessToken,
        refreshToken,
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
      }, `Welcome to Veilo, ${user.alias}!`);

    } catch (error) {
      console.error('Registration error:', error.message, {
        stack: error.stack,
        userId: req.body?.email || 'anonymous'
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

      return res.success({
        token: accessToken,
        refreshToken,
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
      }, 'Login successful');

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

// Verify token
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.error('User not found', 404);
    }

    return res.success({
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
    }, 'Token valid');

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

      return res.success({
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
      }, 'Profile updated successfully');

    } catch (error) {
      console.error('Profile update error:', error);
      return res.error('Profile update failed', 500);
    }
  }
);

// Admin login
router.post('/admin/login',
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

      // Check if user is admin
      if (user.role !== 'admin') {
        return res.error('Access denied - admin role required', 403);
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

      return res.success({
        token: accessToken,
        refreshToken,
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
      }, 'Admin login successful');

    } catch (error) {
      console.error('Admin login error:', error);
      return res.error('Admin login failed', 500);
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

      return res.success({
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
      }, 'Avatar updated successfully');

    } catch (error) {
      console.error('Avatar update error:', error);
      return res.error('Avatar update failed', 500);
    }
  }
);

// Admin login route
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.error('Email and password are required', 400);
    }

    // Find admin user
    const adminUser = await User.findOne({ 
      email, 
      role: 'admin' 
    });

    if (!adminUser) {
      return res.error('Invalid admin credentials', 401);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) {
      return res.error('Invalid admin credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: adminUser.id, 
        role: adminUser.role,
        email: adminUser.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last active
    adminUser.lastActive = new Date();
    await adminUser.save();

    res.success({
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        alias: adminUser.alias,
        role: adminUser.role,
        lastActive: adminUser.lastActive
      }
    }, 'Admin login successful');

  } catch (error) {
    console.error('Admin login error:', error);
    res.error('Server error during admin login', 500);
  }
});

module.exports = router;