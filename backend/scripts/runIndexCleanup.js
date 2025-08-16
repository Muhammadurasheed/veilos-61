// Quick script to run the index cleanup
const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Running index cleanup...');
  execSync('node ' + path.join(__dirname, 'fixIndexes.js'), { stdio: 'inherit' });
  console.log('Index cleanup completed successfully!');
} catch (error) {
  console.error('Index cleanup failed:', error.message);
}