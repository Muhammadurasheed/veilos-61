// Quick script to create admin user
const fs = require('fs');
const path = require('path');

// Read the existing script
const scriptPath = path.join(__dirname, 'backend', 'scripts', 'createAdminUser.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

console.log('🔧 Creating admin user script is ready at backend/scripts/createAdminUser.js');
console.log('📧 Email: yekinirasheed2002@gmail.com');
console.log('🔑 Password: admin123');
console.log('');
console.log('To create the admin user, run:');
console.log('cd backend && node scripts/createAdminUser.js');
console.log('');
console.log('After creating the admin user, you can login to the admin panel at /admin');