const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const { validateRequest } = require('../middleware/validation');
const { authLimiter } = require('../middleware/security');
const refreshTokenMiddleware = require('../middleware/refreshToken');
const { uploadAvatar } = require('../config/cloudinary');
const auth = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', 
  authLimiter,
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 6 }),
    body('alias').optional().isLength({ min: 2, max: 30 }),
  ],
  validateRequest,
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
          userId: user.id,
          role: user.role,
          isExpert: user.isExpert 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
      );

      // Save refresh token
      user.refreshToken = refreshToken;
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
      }, 'User registered successfully');

    } catch (error) {
      console.error('Registration error:', error);
      return res.error('Registration failed', 500);
    }
  }
);

// Login
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validateRequest,
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
          userId: user.id,
          role: user.role,
          isExpert: user.isExpert 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
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
router.post('/logout', auth, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.userId });
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
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.userId });
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
  auth,
  [
    body('alias').optional().isLength({ min: 2, max: 30 }),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const user = await User.findOne({ id: req.user.userId });
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

// Update avatar
router.post('/avatar',
  auth,
  uploadAvatar.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.error('No file uploaded', 400);
      }

      const user = await User.findOne({ id: req.user.userId });
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

module.exports = router;