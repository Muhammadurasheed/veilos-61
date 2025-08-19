
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
const agoraRoutes = require('./routes/agoraRoutes');
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
const enhancedAdminRoutes = require('./routes/enhancedAdminRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.io
const io = initializeSocket(server);

// Import middleware
const responseHandler = require('./middleware/responseHandler');
const { securityHeaders, sanitizeInput, generalLimiter } = require('./middleware/security');
const { performanceMiddleware, errorTrackingMiddleware, initializeMonitoring } = require('./middleware/performanceMonitor');
const cacheService = require('./services/cacheService');
const auditLogger = require('./services/auditLogger');
const { connectDB } = require('./config/database');

// Initialize database connection
connectDB();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'X-Auth-Token', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security middleware
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(generalLimiter);

// Performance monitoring
app.use(performanceMiddleware);

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
app.use('/api/admin', enhancedAdminRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/sanctuary', sanctuaryRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/live-sanctuary', liveSanctuaryRoutes);
app.use('/api/live-sanctuary', breakoutRoutes);
app.use('/api/live-sanctuary', recordingRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/breakout', breakoutRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/session-notes', sessionNotesRoutes);
app.use('/api/session-ratings', sessionRatingRoutes);
app.use('/api/ai', aiRoutes);

app.use('/api/appeals', require('./routes/appealRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/consultations', consultationRoutes);
app.use('/api/stripe', stripeRoutes);

// Health and monitoring routes
app.use('/', healthRoutes);

// Cache middleware for frequently accessed endpoints
app.use('/api/experts', cacheService.middleware({ ttl: 300 })); // 5 minutes
app.use('/api/posts', cacheService.middleware({ ttl: 180 })); // 3 minutes

// Basic health check is now handled by healthRoutes

// Error tracking middleware
app.use(errorTrackingMiddleware);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON format'
    });
  }
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large. Maximum size is 5MB.'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: 'Too many files. Maximum 5 files allowed.'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }
  
  // MongoDB errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry'
    });
  }
  
  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server initialized`);
  
  // Initialize monitoring with proper sequencing
  setTimeout(async () => {
    try {
      // Wait for database connection to be stable
      if (mongoose.connection.readyState === 1) {
        initializeMonitoring();
        console.log('Performance monitoring initialized');
        
        // Warm cache after monitoring is stable
        setTimeout(() => {
          cacheService.warmCache();
        }, 2000);
        
        console.log('Production-ready monitoring and caching initialized');
      } else {
        console.log('Database not ready, skipping monitoring initialization');
      }
    } catch (error) {
      console.error('Error initializing monitoring:', error.message);
    }
  }, 3000); // Wait 3 seconds for everything to stabilize
  
  // Log system startup
  try {
    await auditLogger.logSystemEvent('startup', true, {
      port: PORT,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.log('Audit logging not available yet, skipping startup log');
  }
});

module.exports = app;
