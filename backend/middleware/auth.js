
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify user token
exports.authMiddleware = async (req, res, next) => {
  try {
    // Extract token from header
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload - Fixed to use id field instead of _id
    req.user = await User.findOne({ id: decoded.user.id });
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token or user'
      });
    }
    
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Token is not valid'
    });
  }
};

// Optional auth middleware that doesn't require authentication
exports.optionalAuthMiddleware = async (req, res, next) => {
  try {
    // Extract token from header
    const token = req.header('x-auth-token');
    
    if (!token) {
      // Continue without setting user
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload if available - Fixed to use id field instead of _id
    req.user = await User.findOne({ id: decoded.user.id });
    
    next();
  } catch (err) {
    // Continue without setting user on error
    next();
  }
};

// Middleware to verify admin role
exports.adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Admin privileges required'
      });
    }
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
