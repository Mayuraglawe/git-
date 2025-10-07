/**
 * Telegram Event Notification Test Script
 * Tests if Telegram notifications are sent when creating events
 */

// Test configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'your-bot-token';
const TELEGRAM_CHAT_ID = process.env.VITE_TELEGRAM_PRINCIPAL_CHAT_ID || 'your-chat-id';
const SERVER_URL = 'http://localhost:8082';

console.log('🧪 TELEGRAM EVENT NOTIFICATION TEST\n');
console.log('=' .repeat(60));

// Step 1: Check environment variables
console.log('\n📋 Step 1: Checking Configuration...');
console.log('-'.repeat(60));
console.log(`Bot Token: ${TELEGRAM_BOT_TOKEN.substring(0, 20)}...`);
console.log(`Chat ID: ${TELEGRAM_CHAT_ID}`);
console.log(`Server URL: ${SERVER_URL}`);

if (TELEGRAM_BOT_TOKEN === 'your-bot-token' || TELEGRAM_CHAT_ID === 'your-chat-id') {
  console.log('\n❌ ERROR: Environment variables not configured!');
  console.log('\n📝 Please set the following:');
  console.log('   TELEGRAM_BOT_TOKEN=your_bot_token');
  console.log('   VITE_TELEGRAM_PRINCIPAL_CHAT_ID=your_chat_id');
  console.log('\n💡 How to get these:');
  console.log('   1. Bot Token: Message @BotFather on Telegram');
  console.log('   2. Chat ID: Message @userinfobot on Telegram');
  console.log('\n🔧 Quick setup:');
  console.log('   Option 1: Set in .env file');
  console.log('   Option 2: Set in browser localStorage:');
  console.log(`   localStorage.setItem('telegram_chat_id', 'YOUR_CHAT_ID');`);
  process.exit(1);
}

console.log('✅ Configuration looks good!');

// Step 2: Test Telegram bot connection
async function testBotConnection() {
  console.log('\n📋 Step 2: Testing Telegram Bot Connection...');
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch(`${SERVER_URL}/api/telegram/events/test`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Bot connection successful!');
      console.log(`   Bot Username: @${data.bot.username}`);
      console.log(`   Bot ID: ${data.bot.id}`);
      console.log(`   Bot Name: ${data.bot.first_name}`);
      return true;
    } else {
      console.log('❌ Bot connection failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing bot connection:', error.message);
    console.log('💡 Make sure the server is running on port 8082');
    return false;
  }
}

// Step 3: Send test event notification
async function sendTestEventNotification() {
  console.log('\n📋 Step 3: Sending Test Event Notification...');
  console.log('-'.repeat(60));
  
  const testEvent = {
    title: 'TEST: Workshop on Machine Learning',
    event_type: 'Workshop',
    start_date: 'October 10, 2025',
    start_time: '10:00',
    end_time: '12:00',
    venue: 'Auditorium',
    description: 'This is a test event to verify Telegram notifications are working correctly.',
    expected_participants: 50,
    creator_name: 'Test User',
    department_name: 'Computer Science'
  };
  
  console.log('📤 Sending event details:');
  console.log(`   Title: ${testEvent.title}`);
  console.log(`   Type: ${testEvent.event_type}`);
  console.log(`   Date: ${testEvent.start_date}`);
  console.log(`   Time: ${testEvent.start_time} - ${testEvent.end_time}`);
  console.log(`   Venue: ${testEvent.venue}`);
  
  try {
    const response = await fetch(`${SERVER_URL}/api/telegram/events/event-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: TELEGRAM_CHAT_ID,
        event: testEvent
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('\n✅ Notification sent successfully!');
      console.log(`   Message ID: ${data.result.message_id}`);
      console.log(`   Chat ID: ${data.result.chat.id}`);
      console.log('\n📱 Check your Telegram now!');
      return true;
    } else {
      console.log('\n❌ Failed to send notification:', data.error);
      return false;
    }
  } catch (error) {
    console.log('\n❌ Error sending notification:', error.message);
    return false;
  }
}

// Step 4: Run all tests
async function runTests() {
  console.log('\n🚀 Starting Tests...\n');
  
  // Test bot connection
  const botOk = await testBotConnection();
  if (!botOk) {
    console.log('\n❌ Test failed at bot connection step');
    console.log('💡 Please check your TELEGRAM_BOT_TOKEN');
    process.exit(1);
  }
  
  // Add delay
  console.log('\n⏳ Waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Send test notification
  const notificationOk = await sendTestEventNotification();
  if (!notificationOk) {
    console.log('\n❌ Test failed at notification step');
    console.log('💡 Please check:');
    console.log('   1. TELEGRAM_CHAT_ID is correct');
    console.log('   2. You have started the bot (send /start)');
    console.log('   3. Server is running properly');
    process.exit(1);
  }
  
  // Success summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 ALL TESTS PASSED!');
  console.log('='.repeat(60));
  console.log('\n✅ Telegram notifications are working correctly!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Go to http://localhost:8082/events');
  console.log('   2. Click "Create Event"');
  console.log('   3. Fill in the form and submit');
  console.log('   4. Check Telegram for the notification');
  console.log('\n💡 The notification will have the prefix:');
  console.log('   🆕 NEW: [Event Title]');
  console.log('\n');
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
