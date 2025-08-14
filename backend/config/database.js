const mongoose = require('mongoose');

// MongoDB connection with optimized settings
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/veilo',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,               // max number of connections in pool
        serverSelectionTimeoutMS: 5000, // time to try selecting a server
        socketTimeoutMS: 45000,         // close sockets after inactivity
        family: 4,                      // use IPv4
        bufferCommands: false           // disable mongoose buffering
        // ❌ bufferMaxEntries removed — not supported in modern MongoDB driver
      }
    );

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Create indexes for better performance
    await createIndexes();

    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create database indexes for optimized queries
const createIndexes = async () => {
  try {
    const User = require('../models/User');
    const Post = require('../models/Post');
    const Expert = require('../models/Expert');
    const Session = require('../models/Session');

    // Helper function to create index safely
    const createIndexSafely = async (collection, indexSpec, options = {}) => {
      try {
        await collection.createIndex(indexSpec, options);
      } catch (error) {
        if (error.code === 86) { // IndexKeySpecsConflict
          console.log(`Index already exists with different options for ${JSON.stringify(indexSpec)}, skipping...`);
        } else {
          throw error;
        }
      }
    };

    // User indexes
    await createIndexSafely(User.collection, { id: 1 }, { unique: true });
    await createIndexSafely(User.collection, { email: 1 }, { sparse: true, unique: true });
    await createIndexSafely(User.collection, { role: 1 });
    await createIndexSafely(User.collection, { isExpert: 1 });

    // Post indexes
    await createIndexSafely(Post.collection, { id: 1 }, { unique: true });
    await createIndexSafely(Post.collection, { authorId: 1 });
    await createIndexSafely(Post.collection, { createdAt: -1 });
    await createIndexSafely(Post.collection, { 'likes.userId': 1 });
    await createIndexSafely(Post.collection, { topic: 1 });
    await createIndexSafely(Post.collection, { wantsExpertHelp: 1 });

    // Expert indexes
    await createIndexSafely(Expert.collection, { id: 1 }, { unique: true });
    await createIndexSafely(Expert.collection, { userId: 1 });
    await createIndexSafely(Expert.collection, { status: 1 });
    await createIndexSafely(Expert.collection, { specializations: 1 });
    await createIndexSafely(Expert.collection, { averageRating: -1 });

    // Session indexes
    await createIndexSafely(Session.collection, { id: 1 }, { unique: true });
    await createIndexSafely(Session.collection, { expertId: 1 });
    await createIndexSafely(Session.collection, { clientId: 1 });
    await createIndexSafely(Session.collection, { status: 1 });
    await createIndexSafely(Session.collection, { scheduledAt: 1 });
    await createIndexSafely(Session.collection, { createdAt: -1 });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

module.exports = { connectDB };
