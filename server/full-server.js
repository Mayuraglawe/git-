import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import the compiled TypeScript server modules
// Note: Since we're importing TypeScript files, we need to use tsx or ts-node
console.log('🔧 Starting server with Telegram notifications support...');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Ping endpoint
app.get('/api/ping', (req, res) => {
  res.json({ message: process.env.PING_MESSAGE || 'pong' });
});

// Import and use routes - we'll need to handle this properly
// For now, let's create a minimal server that works

console.log('⚠️  Note: This is a minimal server.');
console.log('📝 For full functionality including Telegram notifications,');
console.log('    you need to run the TypeScript server using tsx');
console.log('');
console.log('💡 Run instead: npx tsx server/index.ts');

app.listen(port, () => {
  console.log(`\n🚀 Minimal server running on port ${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
  console.log(`💚 Health: http://localhost:${port}/health`);
  console.log(`📡 Ping: http://localhost:${port}/api/ping`);
  console.log('');
});
