const mongoose = require('mongoose');
require('dotenv').config();

async function dropVerificationDocumentIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Get the experts collection
    const db = mongoose.connection.db;
    const collection = db.collection('experts');

    // Drop the problematic index
    try {
      await collection.dropIndex('verificationDocuments.id_1');
      console.log('✅ Dropped verificationDocuments.id_1 index');
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('ℹ️ Index verificationDocuments.id_1 not found (already dropped)');
      } else {
        console.error('❌ Error dropping index:', error.message);
      }
    }

    // Create the new sparse index
    try {
      await collection.createIndex(
        { 'verificationDocuments.id': 1 }, 
        { sparse: true, name: 'verificationDocuments.id_sparse' }
      );
      console.log('✅ Created sparse verificationDocuments.id index');
    } catch (error) {
      console.error('❌ Error creating sparse index:', error.message);
    }

    // List all indexes to verify
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Database index fix completed successfully');
    
  } catch (error) {
    console.error('❌ Error fixing database indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

dropVerificationDocumentIndex();