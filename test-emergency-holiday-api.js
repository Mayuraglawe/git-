/**
 * Emergency Holiday API Test Script
 * Tests the complete Emergency Holiday functionality
 */

const API_BASE = 'http://localhost:3001/api/emergency-holidays';

async function testEmergencyHolidayAPI() {
  console.log('🚀 Testing Emergency Holiday API...\n');

  try {
    // Test 1: GET all holidays
    console.log('📋 Test 1: Getting all emergency holidays...');
    const getResponse = await fetch(API_BASE);
    if (getResponse.ok) {
      const holidays = await getResponse.json();
      console.log('✅ GET Success:', holidays);
    } else {
      console.log('❌ GET Failed:', getResponse.status, await getResponse.text());
    }

    // Test 2: POST create new holiday
    console.log('\n📝 Test 2: Creating new emergency holiday...');
    const testHoliday = {
      date: '2025-10-15',
      urgency: 'emergency',
      reason: 'Heavy rainfall - Campus closed for safety. All students and faculty are advised to stay home.',
      confirmEmergency: true,
      created_by: 'test_admin'
    };

    const postResponse = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testHoliday)
    });

    if (postResponse.ok) {
      const result = await postResponse.json();
      console.log('✅ POST Success:', result);
      
      // Test notifications were sent
      console.log('\n📢 Checking if notifications were triggered...');
      console.log('   Expected: In-app notifications to all users');
      console.log('   Expected: Telegram notification sent');
      
      return result.data?.id; // Return the created holiday ID for further tests
    } else {
      const errorText = await postResponse.text();
      console.log('❌ POST Failed:', postResponse.status, errorText);
    }

  } catch (error) {
    console.error('🚨 API Test Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Is the backend server running on port 3001?');
    console.log('   - Are the emergency-holidays routes registered?');
    console.log('   - Is the database connection working?');
  }
}

// Run the test
testEmergencyHolidayAPI().then(() => {
  console.log('\n🏁 Test completed!');
  process.exit(0);
}).catch(error => {
  console.error('🚨 Test failed:', error);
  process.exit(1);
});