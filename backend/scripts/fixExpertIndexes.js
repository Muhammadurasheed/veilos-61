const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.MONGODB_URI;

if (!dbUrl) {
  console.error('❌ No MONGODB_URI found in environment variables');
  process.exit(1);
}

async function fixExpertIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(dbUrl);
    console.log('✅ MongoDB connected');

    const db = mongoose.connection.db;
    const expertsCollection = db.collection('experts');

    console.log('🔍 Checking existing indexes...');
    const indexes = await expertsCollection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));

    // Drop problematic verificationDocuments.id index if it exists
    try {
      console.log('🗑️ Attempting to drop verificationDocuments.id_1 index...');
      await expertsCollection.dropIndex('verificationDocuments.id_1');
      console.log('✅ Successfully dropped verificationDocuments.id_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ Index verificationDocuments.id_1 does not exist, skipping...');
      } else {
        console.log('⚠️ Error dropping index:', error.message);
      }
    }

    // Create a sparse index for verificationDocuments.id to handle null values
    try {
      console.log('📊 Creating sparse index for verificationDocuments.id...');
      await expertsCollection.createIndex(
        { 'verificationDocuments.id': 1 },
        { 
          sparse: true,
          background: true,
          name: 'verificationDocuments_id_sparse'
        }
      );
      console.log('✅ Successfully created sparse index for verificationDocuments.id');
    } catch (error) {
      console.log('⚠️ Error creating sparse index:', error.message);
    }

    // Update documents with null verificationDocuments.id to have proper IDs
    console.log('🔄 Updating documents with null verification document IDs...');
    
    const docsWithNullIds = await expertsCollection.find({
      'verificationDocuments.id': null
    }).toArray();

    console.log(`📋 Found ${docsWithNullIds.length} documents with null verification document IDs`);

    for (const doc of docsWithNullIds) {
      if (doc.verificationDocuments && Array.isArray(doc.verificationDocuments)) {
        let updated = false;
        doc.verificationDocuments.forEach((vDoc, index) => {
          if (!vDoc.id) {
            vDoc.id = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
            updated = true;
          }
        });

        if (updated) {
          await expertsCollection.updateOne(
            { _id: doc._id },
            { $set: { verificationDocuments: doc.verificationDocuments } }
          );
          console.log(`✅ Updated document ${doc.id || doc._id} with proper verification document IDs`);
        }
      }
    }

    console.log('🔍 Verifying final state...');
    const finalIndexes = await expertsCollection.indexes();
    console.log('Final indexes:', finalIndexes.map(idx => idx.name));

    const remainingNullIds = await expertsCollection.countDocuments({
      'verificationDocuments.id': null
    });
    console.log(`📊 Remaining documents with null verification document IDs: ${remainingNullIds}`);

    console.log('✅ Expert indexes fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing expert indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the fix
fixExpertIndexes();