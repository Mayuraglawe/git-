import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting database verification test...');

// Start the server
const serverProcess = spawn('node', ['server/simple-server.js'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe']
});

serverProcess.stdout.on('data', (data) => {
  console.log(`Server: ${data}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`Server Error: ${data}`);
});

// Wait for server to start then test endpoints
setTimeout(async () => {
  console.log('\n📡 Testing database endpoints...\n');
  
  try {
    // Test 1: Connection Test
    console.log('1️⃣ Testing database connection...');
    const connResponse = await fetch('http://localhost:3001/api/database/test-connection');
    const connResult = await connResponse.json();
    console.log('✅ Connection test result:', connResult);
    
    // Test 2: Table Verification
    console.log('\n2️⃣ Testing table accessibility...');
    const tableResponse = await fetch('http://localhost:3001/api/database/verify-tables');
    const tableResult = await tableResponse.json();
    console.log('✅ Table verification result:', tableResult);
    
    // Test 3: Record Counts
    console.log('\n3️⃣ Testing record counts...');
    const countResponse = await fetch('http://localhost:3001/api/database/count-records');
    const countResult = await countResponse.json();
    console.log('✅ Record count result:', countResult);
    
    console.log('\n🎉 Database verification complete!');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  // Clean shutdown
  setTimeout(() => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  }, 2000);
  
}, 3000);

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Received interrupt, cleaning up...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});