const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const { initializeSocket } = require('./socket/socketHandler'); // Import socket initialization
const { createServer } = require('http'); // Import http server
const { instrument } = require('@socket.io/admin-ui');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
const dbUrl = process.env.MONGODB_URL;

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import route files
const authRoutes = require('./routes/authRoutes');
const expertRoutes = require('./routes/expertRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const postRoutes = require('./routes/postRoutes');
const aiRoutes = require('./routes/aiRoutes');
const sanctuaryRoutes = require('./routes/sanctuaryRoutes');

// Import new route files
const bookingRoutes = require('./routes/bookingRoutes');
const chatRoutes = require('./routes/chatRoutes');
const sessionRatingRoutes = require('./routes/sessionRatingRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/sanctuary', sanctuaryRoutes);
app.use('/api/bookings', bookingRoutes);  // Add booking routes
app.use('/api/chat', chatRoutes);         // Add chat routes
app.use('/api/sessions', sessionRatingRoutes); // Add session rating routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// HTTP Server Setup
const server = createServer(app);

// Socket.IO Initialization
const io = initializeSocket(server);

// Socket.IO Admin Panel Instrumentation
instrument(io, {
  auth: false, // Disable authentication for local development
  namespaceName: "/admin",
});

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
