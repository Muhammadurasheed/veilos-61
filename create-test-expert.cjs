const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/veilo';
console.log('🔗 Connecting to MongoDB:', MONGODB_URI);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const Expert = require('./backend/models/Expert');
const User = require('./backend/models/User');

async function createTestExperts() {
  try {
    console.log('🔍 Checking existing experts...');
    
    const existingExperts = await Expert.find({});
    console.log(`📊 Found ${existingExperts.length} existing experts:`);
    existingExperts.forEach((expert, index) => {
      console.log(`${index + 1}. ${expert.name} (${expert.id}) - Status: ${expert.accountStatus}`);
    });

    // Array of test experts to create
    const testExperts = [
      {
        id: 'expert-7zZgxwFk',
        userId: 'user-test-123',
        name: 'Dr. James S',
        email: 'james.s@example.com',
        specialization: 'Anxiety & Depression',
        bio: "I'm a compassionate mental health practitioner dedicated to supporting individuals on their journey toward emotional well-being. With experience in cognitive behavioral therapy and mindfulness-based approaches, I help clients develop healthy coping strategies and build resilience.",
        verificationLevel: 'gold',
        avatarUrl: '/experts/expert-1.jpg',
        topicsHelped: ['Anxiety', 'Depression', 'Stress Management', 'Life Transitions']
      },
      {
        id: 'expert-2aBc3dEf',
        userId: 'user-test-456',
        name: 'Dr. Sarah M',
        email: 'sarah.m@example.com',
        specialization: 'Relationship Counseling',
        bio: "As a relationship counselor with over 10 years of experience, I help individuals and couples navigate complex emotional challenges. My approach combines evidence-based therapy with compassionate understanding.",
        verificationLevel: 'platinum',
        avatarUrl: '/experts/expert-2.jpg',
        topicsHelped: ['Relationships', 'Communication', 'Couples Therapy', 'Family Dynamics']
      },
      {
        id: 'expert-3xYz4wVu',
        userId: 'user-test-789',
        name: 'Dr. Michael R',
        email: 'michael.r@example.com',
        specialization: 'Trauma Recovery',
        bio: "Specializing in trauma-informed care, I provide safe and effective treatment for individuals who have experienced various forms of trauma. My goal is to help clients reclaim their strength and resilience.",
        verificationLevel: 'blue',
        avatarUrl: '/experts/expert-3.jpg',
        topicsHelped: ['PTSD', 'Trauma Recovery', 'Grief Counseling', 'Emotional Healing']
      }
    ];

    for (const testExpertData of testExperts) {
      let expert = await Expert.findOne({ id: testExpertData.id });
      
      if (expert) {
        console.log(`✅ Expert ${testExpertData.id} already exists. Updating status to approved...`);
        expert.accountStatus = 'approved';
        expert.verified = true;
        expert.verificationLevel = testExpertData.verificationLevel;
        expert.rating = 4.8;
        expert.avatarUrl = testExpertData.avatarUrl;
        expert.topicsHelped = testExpertData.topicsHelped;
        await expert.save();
      } else {
        console.log(`➕ Creating new expert with ID: ${testExpertData.id}`);
        
        // Create a test expert
        expert = new Expert({
          id: testExpertData.id,
          userId: testExpertData.userId,
          name: testExpertData.name,
          email: testExpertData.email,
          specialization: testExpertData.specialization,
          bio: testExpertData.bio,
          verificationLevel: testExpertData.verificationLevel,
          verified: true,
          pricingModel: 'free',
          pricingDetails: 'Free Support',
          phoneNumber: '+1234567890',
          rating: 4.8,
          testimonials: [
            {
              id: `test-${testExpertData.id}`,
              text: `${testExpertData.name.split(' ')[1]} helped me through a very difficult time. Their compassionate approach and practical advice made all the difference.`,
              user: {
                alias: 'Anonymous User',
                avatarIndex: Math.floor(Math.random() * 7) + 1
              }
            }
          ],
          topicsHelped: testExpertData.topicsHelped,
          accountStatus: 'approved',
          avatarUrl: testExpertData.avatarUrl,
          followers: [],
          followersCount: 0
        });
        
        await expert.save();
      }
      
      console.log(`✅ Expert ${testExpertData.name} (${expert.id}) processed successfully!`);
    }
    
    // List all approved experts
    const approvedExperts = await Expert.find({ accountStatus: 'approved' });
    console.log(`\n📋 All approved experts (${approvedExperts.length}):`);
    approvedExperts.forEach((expert, index) => {
      console.log(`${index + 1}. ${expert.name} (${expert.id}) - ${expert.specialization} - ${expert.avatarUrl}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test experts:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestExperts();