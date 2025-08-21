const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/veilo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const Expert = require('./backend/models/Expert');
const User = require('./backend/models/User');

async function createTestExpert() {
  try {
    console.log('🔍 Checking existing experts...');
    
    const existingExperts = await Expert.find({});
    console.log(`📊 Found ${existingExperts.length} existing experts:`);
    existingExperts.forEach((expert, index) => {
      console.log(`${index + 1}. ${expert.name} (${expert.id}) - Status: ${expert.accountStatus}`);
    });

    // Create or update the test expert
    const testExpertId = 'expert-7zZgxwFk';
    let expert = await Expert.findOne({ id: testExpertId });
    
    if (expert) {
      console.log(`✅ Expert ${testExpertId} already exists. Updating status to approved...`);
      expert.accountStatus = 'approved';
      expert.verified = true;
      expert.verificationLevel = 'gold';
      expert.rating = 4.8;
      expert.avatarUrl = '/experts/expert-1.jpg';
      await expert.save();
    } else {
      console.log(`➕ Creating new expert with ID: ${testExpertId}`);
      
      // Create a test expert
      expert = new Expert({
        id: testExpertId,
        userId: 'user-test-123',
        name: 'James S',
        email: 'james.s@example.com',
        specialization: 'Mental wellbeing',
        bio: "I'm a compassionate mental health practitioner dedicated to supporting individuals on their journey toward emotional well-being. With experience in cognitive behavioral therapy and mindfulness-based approaches, I help clients develop healthy coping strategies and build resilience.",
        verificationLevel: 'gold',
        verified: true,
        pricingModel: 'free',
        pricingDetails: 'Free Support',
        phoneNumber: '+1234567890',
        rating: 4.8,
        testimonials: [
          {
            id: 'test-1',
            text: 'James helped me through a very difficult time. His compassionate approach and practical advice made all the difference.',
            user: {
              alias: 'Anonymous User',
              avatarIndex: 1
            }
          }
        ],
        topicsHelped: ['Anxiety', 'Depression', 'Stress Management', 'Life Transitions'],
        accountStatus: 'approved',
        avatarUrl: '/experts/expert-1.jpg',
        followers: [],
        followersCount: 0
      });
      
      await expert.save();
    }
    
    console.log('✅ Test expert created/updated successfully!');
    console.log(`📝 Expert details:
      - ID: ${expert.id}
      - Name: ${expert.name}
      - Status: ${expert.accountStatus}
      - Verification: ${expert.verificationLevel}
      - Avatar: ${expert.avatarUrl}
    `);
    
    // List all approved experts
    const approvedExperts = await Expert.find({ accountStatus: 'approved' });
    console.log(`\n📋 All approved experts (${approvedExperts.length}):`);
    approvedExperts.forEach((expert, index) => {
      console.log(`${index + 1}. ${expert.name} (${expert.id}) - ${expert.specialization}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test expert:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestExpert();