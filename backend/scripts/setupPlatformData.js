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

    // 2. VERIFY EXISTING EXPERTS
    console.log('\n👨‍⚕️ Checking existing experts...');
    
    const existingExperts = await Expert.find({ accountStatus: 'approved' }).select('id name specialization pricingModel');
    console.log(`✅ Found ${existingExperts.length} approved experts:`);
    
    existingExperts.forEach(expert => {
      console.log(`   • ${expert.name} (${expert.id}) - ${expert.specialization} - ${expert.pricingModel}`);
    });

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
    
    // Get first available expert for testing booking
    const firstExpert = await Expert.findOne({ accountStatus: 'approved' }).select('id name');
    console.log(`✅ First expert available: ${firstExpert ? 'PASS' : 'FAIL'}`);
    
    console.log('\n🎉 Platform data setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Admin Login: ${adminEmail} / ${adminPassword}`);
    if (firstExpert) {
      console.log(`   • Expert available for booking: ${firstExpert.name} (${firstExpert.id})`);
      console.log(`   • Booking URL: /sessions/book/${firstExpert.id}`);
    }
    console.log(`   • Expert listing: /beacons`);
    
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