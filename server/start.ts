import 'dotenv/config';
import { createServer } from './index.ts';
import { initializeTelegramService } from './services/telegramService.ts';

const PORT = process.env.PORT || 3001;

async function startServer() {
  console.log('🚀 Starting Py-Gram 2k25 Server...\n');
  
  // Initialize Telegram service
  console.log('📱 Initializing Telegram service...');
  const telegramInitialized = await initializeTelegramService();
  
  if (telegramInitialized) {
    console.log('✅ Telegram service ready for notifications!\n');
  } else {
    console.log('⚠️  Telegram service not configured (will use in-app notifications only)\n');
  }
  
  // Create and start Express app
  const app = createServer();
  
  app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);
    console.log(`💚 Health: http://localhost:${PORT}/health`);
    console.log(`📡 Ping: http://localhost:${PORT}/api/ping`);
    console.log(`📝 New Generation: http://localhost:${PORT}/api/new-generation`);
    console.log(`📱 Telegram: http://localhost:${PORT}/api/telegram`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n✨ Server is ready! You can now test the Telegram notifications.\n');
  });
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
