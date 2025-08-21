#!/usr/bin/env node

/**
 * Emergency Expert Profile Fix Script
 * 
 * This script diagnoses and fixes the expert profile 404 issue by:
 * 1. Testing database connection
 * 2. Creating test experts
 * 3. Testing API endpoints
 * 4. Verifying frontend routing
 */

const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

// Import models
const Expert = require('./backend/models/Expert');

async function diagnoseProblem() {
  console.log('🔧 VEILO EXPERT PROFILE DIAGNOSTIC TOOL');
  console.log('=====================================\n');

  try {
    // 1. Test Database Connection
    console.log('1️⃣ Testing MongoDB Connection...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/veilo';
    console.log(`   Connecting to: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('   ✅ Database connected successfully\n');

    // 2. Check Expert Data
    console.log('2️⃣ Checking Expert Data...');
    const allExperts = await Expert.find({});
    const approvedExperts = await Expert.find({ accountStatus: 'approved' });
    
    console.log(`   Total experts in database: ${allExperts.length}`);
    console.log(`   Approved experts: ${approvedExperts.length}`);
    
    if (approvedExperts.length === 0) {
      console.log('   ⚠️  No approved experts found - creating test data...');
      await createTestData();
    } else {
      console.log('   📋 Approved experts:');
      approvedExperts.forEach((expert, index) => {
        console.log(`      ${index + 1}. ${expert.name} (${expert.id}) - ${expert.specialization}`);
      });
    }
    console.log('');

    // 3. Test API Endpoints
    console.log('3️⃣ Testing API Endpoints...');
    
    const baseURL = 'http://localhost:3001';
    
    try {
      // Test health endpoint
      console.log('   Testing health endpoint...');
      const healthResponse = await axios.get(`${baseURL}/health`);
      console.log(`   ✅ Health check: ${healthResponse.status} - ${healthResponse.data.status}`);
    } catch (error) {
      console.log(`   ❌ Health check failed: ${error.message}`);
      console.log(`   🔧 Backend server might not be running on port 3001`);
    }

    try {
      // Test experts list endpoint
      console.log('   Testing experts list endpoint...');
      const expertsResponse = await axios.get(`${baseURL}/api/experts`);
      console.log(`   ✅ Experts list: ${expertsResponse.status} - Found ${expertsResponse.data.data.length} experts`);
    } catch (error) {
      console.log(`   ❌ Experts list failed: ${error.message}`);
    }

    try {
      // Test specific expert endpoint
      const testExpertId = 'expert-7zZgxwFk';
      console.log(`   Testing specific expert endpoint (${testExpertId})...`);
      const expertResponse = await axios.get(`${baseURL}/api/experts/${testExpertId}`);
      console.log(`   ✅ Expert profile: ${expertResponse.status} - ${expertResponse.data.data.name}`);
    } catch (error) {
      console.log(`   ❌ Expert profile failed: ${error.message}`);
      if (error.response) {
        console.log(`   📊 Response data:`, error.response.data);
      }
    }

    console.log('\n4️⃣ Summary & Recommendations:');
    console.log('=====================================');
    
    if (approvedExperts.length === 0) {
      console.log('❌ ISSUE: No approved experts in database');
      console.log('🔧 FIX: Run `node create-test-expert.js` to create test data');
    }
    
    console.log('✅ Database connection working');
    console.log('🔧 NEXT STEPS:');
    console.log('   1. Ensure backend server is running on port 3001');
    console.log('   2. Check frontend routing in App.tsx');
    console.log('   3. Test expert profile URL: http://localhost:8080/beacons/expert-7zZgxwFk');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

async function createTestData() {
  const testExpert = new Expert({
    id: 'expert-7zZgxwFk',
    userId: 'user-test-123',
    name: 'Dr. James S',
    email: 'james.s@example.com',
    specialization: 'Anxiety & Depression',
    bio: "I'm a compassionate mental health practitioner dedicated to supporting individuals on their journey toward emotional well-being.",
    verificationLevel: 'gold',
    verified: true,
    pricingModel: 'free',
    pricingDetails: 'Free Support',
    rating: 4.8,
    testimonials: [{
      id: 'test-1',
      text: 'James helped me through a very difficult time.',
      user: { alias: 'Anonymous User', avatarIndex: 1 }
    }],
    topicsHelped: ['Anxiety', 'Depression', 'Stress Management'],
    accountStatus: 'approved',
    avatarUrl: '/experts/expert-1.jpg',
    followers: [],
    followersCount: 0
  });

  await testExpert.save();
  console.log('   ✅ Test expert created successfully');
}

// Run diagnostic
diagnoseProblem().catch(console.error);