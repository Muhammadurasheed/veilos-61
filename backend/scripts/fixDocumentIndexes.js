const mongoose = require('mongoose');
require('dotenv').config();

async function fixDocumentIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const expertsCollection = db.collection('experts');

    // Drop the problematic index
    try {
      await expertsCollection.dropIndex('verificationDocuments.id_1');
      console.log('✅ Dropped problematic verificationDocuments.id_1 index');
    } catch (error) {
      console.log('⚠️  Index may not exist:', error.message);
    }

    // Update all existing documents to ensure they have proper IDs
    const { nanoid } = require('nanoid');
    
    const experts = await expertsCollection.find({}).toArray();
    console.log(`Found ${experts.length} expert documents`);

    for (const expert of experts) {
      let needsUpdate = false;
      
      if (expert.verificationDocuments && expert.verificationDocuments.length > 0) {
        expert.verificationDocuments.forEach(doc => {
          if (!doc.id) {
            doc.id = `doc-${nanoid(8)}`;
            needsUpdate = true;
          }
        });

        if (needsUpdate) {
          await expertsCollection.updateOne(
            { _id: expert._id },
            { $set: { verificationDocuments: expert.verificationDocuments } }
          );
          console.log(`✅ Updated expert ${expert.name} documents`);
        }
      }
    }

    console.log('✅ All expert documents have been updated with proper IDs');
    
    // Recreate the index properly (without unique constraint on potentially null fields)
    await expertsCollection.createIndex({ 'verificationDocuments.id': 1 }, { sparse: true });
    console.log('✅ Recreated verificationDocuments.id index with sparse option');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    process.exit(1);
  }
}

fixDocumentIndexes();