const mongoose = require('mongoose');

// MongoDB connection with optimized settings
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/veilo', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      bufferCommands: false,
      bufferMaxEntries: 0
    });

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
    
    // User indexes
    await User.collection.createIndex({ id: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { sparse: true, unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ isExpert: 1 });
    
    // Post indexes
    await Post.collection.createIndex({ id: 1 }, { unique: true });
    await Post.collection.createIndex({ authorId: 1 });
    await Post.collection.createIndex({ createdAt: -1 });
    await Post.collection.createIndex({ 'likes.userId': 1 });
    await Post.collection.createIndex({ topic: 1 });
    await Post.collection.createIndex({ wantsExpertHelp: 1 });
    
    // Expert indexes
    await Expert.collection.createIndex({ id: 1 }, { unique: true });
    await Expert.collection.createIndex({ userId: 1 });
    await Expert.collection.createIndex({ status: 1 });
    await Expert.collection.createIndex({ specializations: 1 });
    await Expert.collection.createIndex({ averageRating: -1 });
    
    // Session indexes
    await Session.collection.createIndex({ id: 1 }, { unique: true });
    await Session.collection.createIndex({ expertId: 1 });
    await Session.collection.createIndex({ clientId: 1 });
    await Session.collection.createIndex({ status: 1 });
    await Session.collection.createIndex({ scheduledAt: 1 });
    await Session.collection.createIndex({ createdAt: -1 });
    
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