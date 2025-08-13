
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
const geminiRoutes = require('./routes/geminiRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const sessionNotesRoutes = require('./routes/sessionNotesRoutes');
const sessionRatingRoutes = require('./routes/sessionRatingRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.io
const io = initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/veilo', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Routes
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
app.use('/api/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/appeals', require('./routes/appealRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'An unexpected error occurred'
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server initialized`);
});

module.exports = app;
