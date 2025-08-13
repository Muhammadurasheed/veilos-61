const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Refresh token middleware
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.error('Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findOne({ id: decoded.userId });
    if (!user) {
      return res.error('User not found', 404);
    }

    // Check if refresh token is valid (you might want to store refresh tokens in DB)
    if (user.refreshToken !== refreshToken) {
      return res.error('Invalid refresh token', 401);
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { 
        userId: user.id,
        role: user.role,
        isExpert: user.isExpert 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Optionally generate new refresh token
    const newRefreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    return res.success({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        alias: user.alias,
        avatarIndex: user.avatarIndex,
        role: user.role,
        isExpert: user.isExpert,
        avatarUrl: user.avatarUrl,
        email: user.email
      }
    }, 'Token refreshed successfully');

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.error('Invalid refresh token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return res.error('Refresh token expired', 401);
    }
    
    console.error('Refresh token error:', error);
    return res.error('Internal server error', 500);
  }
};

module.exports = refreshToken;