const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const Expert = require('../models/Expert');

async function setupPlatformData() {
  try {
    // Check if we're already connected to MongoDB
    if (mongoose.connection.readyState !== 1) {
      const dbUrl = process.env.MONGODB_URI;
      if (!dbUrl) {
        throw new Error('MONGODB_URI not found in environment variables');
      }

      await mongoose.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ MongoDB connected for setup');
    }

    // 1. CREATE ADMIN USER WITH PROPER PASSWORD HASH
    console.log('\n🔐 Setting up Admin User...');
    
    const adminEmail = 'yekinirasheed2002@gmail.com';
    const adminPassword = 'admin123';
    
    // Check if admin exists
    let adminUser = await User.findOne({ email: adminEmail });
    
    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    if (adminUser) {
      // Update existing admin with proper password hash
      adminUser.passwordHash = passwordHash;
      adminUser.role = 'admin';
      adminUser.isAnonymous = false;
      await adminUser.save();
      console.log('✅ Updated existing admin user with proper password hash');
    } else {
      // Create new admin user
      adminUser = new User({
        id: `user-${nanoid(8)}`,
        alias: 'Admin',
        email: adminEmail,
        passwordHash: passwordHash,
        role: 'admin',
        avatarIndex: 1,
        isAnonymous: false,
        registeredAt: new Date()
      });
      await adminUser.save();
      console.log('✅ Created new admin user with proper password hash');
    }

    // 2. CREATE TEST EXPERTS FOR BOOKING FUNCTIONALITY
    console.log('\n👨‍⚕️ Setting up Test Experts...');
    
    const testExperts = [
      {
        id: 'expert-2Y9LaVGO',
        name: 'Rasheed Yekini',
        email: 'rasheed.yekini@veilo.com',
        specialization: 'Guidance and counselling',
        bio: 'Experienced counselor specializing in life guidance, mental health support, and personal development. I provide compassionate, confidential support to help you navigate life\'s challenges.',
        pricingModel: 'free',
        phoneNumber: '+1234567890',
        accountStatus: 'approved',
        isOnline: true,
        averageRating: 4.8,
        totalRatings: 15,
        responseTime: 'within 1 hour',
        location: {
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos'
        },
        timezone: 'Africa/Lagos',
        skills: ['Anxiety Management', 'Depression Support', 'Life Coaching', 'Relationship Counseling'],
        languages: ['English', 'Yoruba'],
        availability: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
          saturday: { start: '10:00', end: '14:00' },
          sunday: { start: 'closed', end: 'closed' }
        },
        sessionPreferences: {
          preferredDuration: 60,
          maxSessionsPerDay: 8,
          breakBetweenSessions: 15
        }
      },
      {
        id: 'expert-ABC123XY',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@veilo.com',
        specialization: 'Clinical Psychology',
        bio: 'Licensed clinical psychologist with 10+ years of experience in treating anxiety, depression, and trauma. I use evidence-based approaches including CBT and mindfulness techniques.',
        pricingModel: 'paid',
        pricingDetails: { sessionRate: 75, currency: 'USD' },
        phoneNumber: '+1987654321',
        accountStatus: 'approved',
        isOnline: true,
        averageRating: 4.9,
        totalRatings: 32,
        responseTime: 'within 30 minutes',
        location: {
          country: 'United States',
          state: 'California',
          city: 'San Francisco'
        },
        timezone: 'America/Los_Angeles',
        skills: ['CBT', 'Anxiety Treatment', 'Depression Therapy', 'Trauma Recovery'],
        languages: ['English', 'Spanish'],
        availability: {
          monday: { start: '08:00', end: '18:00' },
          tuesday: { start: '08:00', end: '18:00' },
          wednesday: { start: '08:00', end: '18:00' },
          thursday: { start: '08:00', end: '18:00' },
          friday: { start: '08:00', end: '16:00' },
          saturday: { start: 'closed', end: 'closed' },
          sunday: { start: 'closed', end: 'closed' }
        },
        sessionPreferences: {
          preferredDuration: 50,
          maxSessionsPerDay: 6,
          breakBetweenSessions: 10
        }
      },
      {
        id: 'expert-DEF456ZW',
        name: 'Michael Chen',
        email: 'michael.chen@veilo.com',
        specialization: 'Life Coaching',
        bio: 'Certified life coach helping individuals achieve their personal and professional goals. Specializing in career transitions, work-life balance, and personal growth strategies.',
        pricingModel: 'donation',
        phoneNumber: '+1555123456',
        accountStatus: 'approved',
        isOnline: false,
        averageRating: 4.7,
        totalRatings: 28,
        responseTime: 'within 2 hours',
        location: {
          country: 'Canada',
          state: 'Ontario',
          city: 'Toronto'
        },
        timezone: 'America/Toronto',
        skills: ['Career Coaching', 'Goal Setting', 'Stress Management', 'Work-Life Balance'],
        languages: ['English', 'Mandarin'],
        availability: {
          monday: { start: '10:00', end: '19:00' },
          tuesday: { start: '10:00', end: '19:00' },
          wednesday: { start: '10:00', end: '19:00' },
          thursday: { start: '10:00', end: '19:00' },
          friday: { start: '10:00', end: '17:00' },
          saturday: { start: '09:00', end: '15:00' },
          sunday: { start: 'closed', end: 'closed' }
        },
        sessionPreferences: {
          preferredDuration: 45,
          maxSessionsPerDay: 7,
          breakBetweenSessions: 15
        }
      }
    ];

    for (const expertData of testExperts) {
      try {
        // Check if expert already exists
        let expert = await Expert.findOne({ id: expertData.id });
        
        if (expert) {
          // Update existing expert
          Object.assign(expert, {
            ...expertData,
            updatedAt: new Date()
          });
          await expert.save();
          console.log(`✅ Updated existing expert: ${expertData.name}`);
        } else {
          // Create new expert
          expert = new Expert({
            ...expertData,
            userId: `user-${nanoid(8)}`, // Generate user ID
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await expert.save();
          console.log(`✅ Created new expert: ${expertData.name}`);
        }
      } catch (error) {
        console.error(`❌ Error creating/updating expert ${expertData.name}:`, error.message);
      }
    }

    // 3. VERIFY SETUP
    console.log('\n🔍 Verifying Setup...');
    
    const adminCount = await User.countDocuments({ role: 'admin' });
    const expertCount = await Expert.countDocuments({ accountStatus: 'approved' });
    
    console.log(`✅ Admin users: ${adminCount}`);
    console.log(`✅ Approved experts: ${expertCount}`);
    
    // Test admin login credentials
    const testAdmin = await User.findOne({ email: adminEmail });
    const passwordValid = await bcrypt.compare(adminPassword, testAdmin.passwordHash);
    console.log(`✅ Admin password verification: ${passwordValid ? 'PASS' : 'FAIL'}`);
    
    // Test expert lookup
    const testExpert = await Expert.findOne({ id: 'expert-2Y9LaVGO' });
    console.log(`✅ Test expert lookup: ${testExpert ? 'PASS' : 'FAIL'}`);
    
    console.log('\n🎉 Platform data setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Admin Login: ${adminEmail} / ${adminPassword}`);
    console.log(`   • Test Expert ID: expert-2Y9LaVGO (Rasheed Yekini)`);
    console.log(`   • Booking URL: /sessions/book/expert-2Y9LaVGO`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

// Export the function for use in server.js
module.exports = setupPlatformData;

// Only run directly if this file is executed directly
if (require.main === module) {
  setupPlatformData().finally(() => {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  });
}