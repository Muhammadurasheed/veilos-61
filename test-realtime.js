// Test script to verify real-time expert application notifications
const socketIo = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Create a test admin token (replace with actual admin user ID if needed)
const adminToken = jwt.sign(
  { 
    user: { 
      id: 'admin-user-123',
      role: 'admin' 
    } 
  }, 
  process.env.JWT_SECRET || 'test-secret-key',
  { expiresIn: '1h' }
);

console.log('🚀 Testing real-time expert application notifications...');
console.log('Admin token:', adminToken);

// Connect as admin
const adminSocket = socketIo('http://localhost:3000', {
  auth: { token: adminToken }
});

adminSocket.on('connect', () => {
  console.log('✅ Admin socket connected:', adminSocket.id);
  
  // Join admin panel
  adminSocket.emit('join_admin_panel');
});

adminSocket.on('admin_panel_joined', (data) => {
  console.log('📢 Admin panel join response:', data);
});

adminSocket.on('expert_application_submitted', (data) => {
  console.log('🎯 RECEIVED EXPERT APPLICATION NOTIFICATION:', data);
  console.log('Expert Name:', data.expert.name);
  console.log('Expert Email:', data.expert.email);
  console.log('Timestamp:', data.timestamp);
  
  // Test successful!
  console.log('✅ Real-time notifications working correctly!');
  process.exit(0);
});

adminSocket.on('connect_error', (error) => {
  console.error('❌ Admin socket connection error:', error);
});

adminSocket.on('disconnect', (reason) => {
  console.log('👋 Admin socket disconnected:', reason);
});

// Keep the script running for 30 seconds to test
setTimeout(() => {
  console.log('⏰ Test timeout - no notifications received');
  console.log('👉 Try registering an expert application to test');
  process.exit(1);
}, 30000);
