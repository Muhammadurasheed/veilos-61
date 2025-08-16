// Script to fix duplicate key errors by dropping problematic unique indexes
require('dotenv').config();
const mongoose = require('mongoose');

const dropProblematicIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get the experts collection
    const expertsCollection = db.collection('experts');
    
    // List all indexes
    const indexes = await expertsCollection.indexes();
    console.log('Current indexes:', indexes);
    
    // Drop problematic unique indexes on subdocument IDs
    try {
      await expertsCollection.dropIndex('testimonials.id_1');
      console.log('Dropped testimonials.id_1 index');
    } catch (err) {
      console.log('testimonials.id_1 index not found or already dropped');
    }
    
    try {
      await expertsCollection.dropIndex('verificationDocuments.id_1');
      console.log('Dropped verificationDocuments.id_1 index');
    } catch (err) {
      console.log('verificationDocuments.id_1 index not found or already dropped');
    }
    
    console.log('Index cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
};

dropProblematicIndexes();