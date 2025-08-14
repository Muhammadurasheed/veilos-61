
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const { initializeSocket } = require('./socket/socketHandler');
const userRoutes = require('./routes/userRoutes');
const expertRoutes = require('./routes/expertRoutes');
const postRoutes = require('./routes/postRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const sanctuaryRoutes = require('./routes/sanctuaryRoutes');
const liveSanctuaryRoutes = require('./routes/liveSanctuaryRoutes');
const breakoutRoutes = require('./routes/breakoutRoutes');
const recordingRoutes = require('./routes/recordingRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const geminiRoutes = require('./routes/geminiRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const sessionNotesRoutes = require('./routes/sessionNotesRoutes');
const sessionRatingRoutes = require('./routes/sessionRatingRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.io
const io = initializeSocket(server);

// Import middleware
const responseHandler = require('./middleware/responseHandler');
const { connectDB } = require('./config/database');

// Initialize database connection
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(responseHandler);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection is now handled by config/database.js

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', userRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/sanctuary', sanctuaryRoutes);
app.use('/api/live-sanctuary', liveSanctuaryRoutes);
app.use('/api/live-sanctuary', breakoutRoutes);
app.use('/api/live-sanctuary', recordingRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/session-notes', sessionNotesRoutes);
app.use('/api/session-ratings', sessionRatingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/appeals', require('./routes/appealRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/consultations', consultationRoutes);
app.use('/api/stripe', stripeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.error('File too large. Maximum size is 5MB.', 400);
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.error('Too many files. Maximum 5 files allowed.', 400);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.error('Invalid token', 401);
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.error('Token expired', 401);
  }
  
  // MongoDB errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.error('Validation failed', 400, errors);
  }
  
  if (err.code === 11000) {
    return res.error('Duplicate entry', 409);
  }
  
  // Default error
  res.error(
    process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    err.statusCode || 500,
    process.env.NODE_ENV === 'development' ? err.stack : null
  );
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server initialized`);
});

module.exports = app;
