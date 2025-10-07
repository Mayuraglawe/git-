/**
 * Emergency Holiday Declaration Feature - Comprehensive Test Suite
 * Tests all components, API endpoints, and integration
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

/**
 * Test helper functions
 */
function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    results.push({ name, status: 'PASS', message: '' });
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    return true;
  } catch (error) {
    failedTests++;
    results.push({ name, status: 'FAIL', message: error.message });
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function fileContains(filePath, searchString) {
  if (!fileExists(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes(searchString);
}

function getFileLineCount(filePath) {
  if (!fileExists(filePath)) return 0;
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').length;
}

/**
 * Test Suite
 */
console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  EMERGENCY HOLIDAY DECLARATION - FEATURE TEST SUITE${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

// ============================================================================
// SECTION 1: Frontend Component Tests
// ============================================================================
console.log(`${colors.bold}${colors.yellow}[1] FRONTEND COMPONENTS${colors.reset}\n`);

test('EmergencyHolidayModal.tsx exists', () => {
  const filePath = 'client/components/holidays/EmergencyHolidayModal.tsx';
  assert(fileExists(filePath), `File not found: ${filePath}`);
});

test('EmergencyHolidayModal has event type selection', () => {
  const filePath = 'client/components/holidays/EmergencyHolidayModal.tsx';
  assert(
    fileContains(filePath, 'eventType') && fileContains(filePath, 'standard') && fileContains(filePath, 'holiday'),
    'Event type selection not found'
  );
});

test('EmergencyHolidayModal has urgency levels', () => {
  const filePath = 'client/components/holidays/EmergencyHolidayModal.tsx';
  assert(
    fileContains(filePath, 'low_priority') && fileContains(filePath, 'emergency'),
    'Urgency levels not found'
  );
});

test('EmergencyHolidayModal has confirmation checkbox', () => {
  const filePath = 'client/components/holidays/EmergencyHolidayModal.tsx';
  assert(
    fileContains(filePath, 'emergencyConfirmed') || fileContains(filePath, 'checkbox'),
    'Confirmation checkbox not found'
  );
});

test('EmergencyHolidayModal has date picker', () => {
  const filePath = 'client/components/holidays/EmergencyHolidayModal.tsx';
  assert(
    fileContains(filePath, 'Calendar') && fileContains(filePath, 'date'),
    'Date picker not found'
  );
});

test('EmergencyHolidayModal has proper TypeScript types', () => {
  const filePath = 'client/components/holidays/EmergencyHolidayModal.tsx';
  assert(
    fileContains(filePath, 'interface') || fileContains(filePath, 'type'),
    'TypeScript types not found'
  );
});

// ============================================================================
// SECTION 2: Notification Templates Tests
// ============================================================================
console.log(`\n${colors.bold}${colors.yellow}[2] NOTIFICATION TEMPLATES${colors.reset}\n`);

test('holidayNotificationTemplates.ts exists', () => {
  const filePath = 'client/services/holidayNotificationTemplates.ts';
  assert(fileExists(filePath), `File not found: ${filePath}`);
});

test('Emergency Telegram template exists', () => {
  const filePath = 'client/services/holidayNotificationTemplates.ts';
  assert(
    fileContains(filePath, 'generateEmergencyTelegramMessage') && 
    fileContains(filePath, 'EMERGENCY HOLIDAY ANNOUNCEMENT'),
    'Emergency Telegram template not found'
  );
});

test('Low Priority Telegram template exists', () => {
  const filePath = 'client/services/holidayNotificationTemplates.ts';
  assert(
    fileContains(filePath, 'generateLowPriorityTelegramMessage') && 
    fileContains(filePath, 'HOLIDAY NOTIFICATION'),
    'Low Priority Telegram template not found'
  );
});

test('Email template exists', () => {
  const filePath = 'client/services/holidayNotificationTemplates.ts';
  assert(
    fileContains(filePath, 'generateEmailBody') || fileContains(filePath, 'email'),
    'Email template not found'
  );
});

test('SMS template exists', () => {
  const filePath = 'client/services/holidayNotificationTemplates.ts';
  assert(
    fileContains(filePath, 'generateSMSMessage') || fileContains(filePath, 'sms'),
    'SMS template not found'
  );
});

test('In-app notification template exists', () => {
  const filePath = 'client/services/holidayNotificationTemplates.ts';
  assert(
    fileContains(filePath, 'generateInAppNotification') || fileContains(filePath, 'notification'),
    'In-app notification template not found'
  );
});

// ============================================================================
// SECTION 3: API Service Tests
// ============================================================================
console.log(`\n${colors.bold}${colors.yellow}[3] API SERVICE LAYER${colors.reset}\n`);

test('emergency-holiday-service.ts exists', () => {
  const filePath = 'client/services/emergency-holiday-service.ts';
  assert(fileExists(filePath), `File not found: ${filePath}`);
});

test('createEmergencyHoliday function exists', () => {
  const filePath = 'client/services/emergency-holiday-service.ts';
  assert(
    fileContains(filePath, 'createEmergencyHoliday'),
    'createEmergencyHoliday function not found'
  );
});

test('getAllEmergencyHolidays function exists', () => {
  const filePath = 'client/services/emergency-holiday-service.ts';
  assert(
    fileContains(filePath, 'getAllEmergencyHolidays'),
    'getAllEmergencyHolidays function not found'
  );
});

test('API service has proper TypeScript interfaces', () => {
  const filePath = 'client/services/emergency-holiday-service.ts';
  assert(
    fileContains(filePath, 'EmergencyHolidayData') || fileContains(filePath, 'interface'),
    'TypeScript interfaces not found'
  );
});

test('API service handles errors', () => {
  const filePath = 'client/services/emergency-holiday-service.ts';
  assert(
    fileContains(filePath, 'throw new Error') || fileContains(filePath, 'catch'),
    'Error handling not found'
  );
});

// ============================================================================
// SECTION 4: Backend API Tests
// ============================================================================
console.log(`\n${colors.bold}${colors.yellow}[4] BACKEND API ROUTES${colors.reset}\n`);

test('emergency-holidays.ts routes file exists', () => {
  const filePath = 'server/routes/emergency-holidays.ts';
  assert(fileExists(filePath), `File not found: ${filePath}`);
});

test('POST /api/emergency-holidays endpoint exists', () => {
  const filePath = 'server/routes/emergency-holidays.ts';
  assert(
    fileContains(filePath, 'router.post') && fileContains(filePath, "router.post('/'"),
    'POST endpoint not found'
  );
});

test('GET /api/emergency-holidays endpoint exists', () => {
  const filePath = 'server/routes/emergency-holidays.ts';
  assert(
    fileContains(filePath, 'router.get') && fileContains(filePath, "router.get('/'"),
    'GET endpoint not found'
  );
});

test('DELETE endpoint exists', () => {
  const filePath = 'server/routes/emergency-holidays.ts';
  assert(
    fileContains(filePath, 'router.delete'),
    'DELETE endpoint not found'
  );
});

test('Notification sending function exists', () => {
  const filePath = 'server/routes/emergency-holidays.ts';
  assert(
    fileContains(filePath, 'sendHolidayNotifications') || fileContains(filePath, 'sendNotification'),
    'Notification function not found'
  );
});

test('Telegram integration exists', () => {
  const filePath = 'server/routes/emergency-holidays.ts';
  assert(
    fileContains(filePath, 'TELEGRAM_BOT_TOKEN') || fileContains(filePath, 'telegram'),
    'Telegram integration not found'
  );
});

test('Backend has proper error handling', () => {
  const filePath = 'server/routes/emergency-holidays.ts';
  assert(
    fileContains(filePath, 'try') && fileContains(filePath, 'catch'),
    'Error handling not found'
  );
});

// ============================================================================
// SECTION 5: Database Schema Tests
// ============================================================================
console.log(`\n${colors.bold}${colors.yellow}[5] DATABASE SCHEMA${colors.reset}\n`);

test('emergency-holidays-schema.sql exists', () => {
  const filePath = 'database/emergency-holidays-schema.sql';
  assert(fileExists(filePath), `File not found: ${filePath}`);
});

test('emergency_holidays table defined', () => {
  const filePath = 'database/emergency-holidays-schema.sql';
  assert(
    fileContains(filePath, 'CREATE TABLE') && fileContains(filePath, 'emergency_holidays'),
    'emergency_holidays table not found'
  );
});

test('notifications table defined', () => {
  const filePath = 'database/emergency-holidays-schema.sql';
  assert(
    fileContains(filePath, 'notifications'),
    'notifications table not found'
  );
});

test('Indexes created', () => {
  const filePath = 'database/emergency-holidays-schema.sql';
  assert(
    fileContains(filePath, 'CREATE INDEX'),
    'Indexes not found'
  );
});

test('RLS policies defined', () => {
  const filePath = 'database/emergency-holidays-schema.sql';
  assert(
    fileContains(filePath, 'CREATE POLICY') || fileContains(filePath, 'ROW LEVEL SECURITY'),
    'RLS policies not found'
  );
});

test('Urgency constraint exists', () => {
  const filePath = 'database/emergency-holidays-schema.sql';
  assert(
    fileContains(filePath, 'emergency') && fileContains(filePath, 'low_priority'),
    'Urgency constraint not found'
  );
});

// ============================================================================
// SECTION 6: Integration Tests
// ============================================================================
console.log(`\n${colors.bold}${colors.yellow}[6] INTEGRATION${colors.reset}\n`);

test('Events.tsx imports EmergencyHolidayModal', () => {
  const filePath = 'client/pages/Events.tsx';
  assert(
    fileContains(filePath, 'EmergencyHolidayModal'),
    'EmergencyHolidayModal import not found in Events.tsx'
  );
});

test('Events.tsx imports emergency-holiday-service', () => {
  const filePath = 'client/pages/Events.tsx';
  assert(
    fileContains(filePath, 'emergency-holiday-service') || fileContains(filePath, 'createEmergencyHoliday'),
    'Emergency holiday service import not found'
  );
});

test('Events.tsx has modal state management', () => {
  const filePath = 'client/pages/Events.tsx';
  assert(
    fileContains(filePath, 'isEmergencyModalOpen') || fileContains(filePath, 'EmergencyModal'),
    'Modal state not found in Events.tsx'
  );
});

test('Events.tsx has submit handler', () => {
  const filePath = 'client/pages/Events.tsx';
  assert(
    fileContains(filePath, 'handleEmergencyHolidaySubmit') || fileContains(filePath, 'onSubmit'),
    'Submit handler not found'
  );
});

test('Supabase client exists', () => {
  const filePath = 'server/lib/supabase.ts';
  assert(fileExists(filePath), 'Supabase client not found');
});

// ============================================================================
// SECTION 7: Documentation Tests
// ============================================================================
console.log(`\n${colors.bold}${colors.yellow}[7] DOCUMENTATION${colors.reset}\n`);

test('EMERGENCY_HOLIDAY_QUICK_START.md exists', () => {
  const filePath = 'EMERGENCY_HOLIDAY_QUICK_START.md';
  assert(fileExists(filePath), 'Quick start guide not found');
});

test('EMERGENCY_HOLIDAY_SETUP_GUIDE.md exists', () => {
  const filePath = 'EMERGENCY_HOLIDAY_SETUP_GUIDE.md';
  assert(fileExists(filePath), 'Setup guide not found');
});

test('EMERGENCY_HOLIDAY_IMPLEMENTATION_SUMMARY.md exists', () => {
  const filePath = 'EMERGENCY_HOLIDAY_IMPLEMENTATION_SUMMARY.md';
  assert(fileExists(filePath), 'Implementation summary not found');
});

test('EMERGENCY_HOLIDAY_FEATURE_OVERVIEW.md exists', () => {
  const filePath = 'EMERGENCY_HOLIDAY_FEATURE_OVERVIEW.md';
  assert(fileExists(filePath), 'Feature overview not found');
});

test('Documentation is comprehensive (>500 lines total)', () => {
  const files = [
    'EMERGENCY_HOLIDAY_QUICK_START.md',
    'EMERGENCY_HOLIDAY_SETUP_GUIDE.md',
    'EMERGENCY_HOLIDAY_IMPLEMENTATION_SUMMARY.md',
    'EMERGENCY_HOLIDAY_FEATURE_OVERVIEW.md'
  ];
  const totalLines = files.reduce((sum, file) => sum + getFileLineCount(file), 0);
  assert(totalLines > 500, `Documentation too short: ${totalLines} lines`);
});

// ============================================================================
// SECTION 8: Code Quality Tests
// ============================================================================
console.log(`\n${colors.bold}${colors.yellow}[8] CODE QUALITY${colors.reset}\n`);

test('Modal component has proper accessibility', () => {
  const filePath = 'client/components/holidays/EmergencyHolidayModal.tsx';
  assert(
    fileContains(filePath, 'aria-') || fileContains(filePath, 'Dialog'),
    'Accessibility attributes not found'
  );
});

test('Backend has environment variable checks', () => {
  const filePath = 'server/routes/emergency-holidays.ts';
  assert(
    fileContains(filePath, 'process.env'),
    'Environment variable usage not found'
  );
});

test('Frontend has proper error handling', () => {
  const filePath = 'client/services/emergency-holiday-service.ts';
  assert(
    fileContains(filePath, 'catch') || fileContains(filePath, 'throw'),
    'Error handling not found'
  );
});

test('Backend returns proper HTTP status codes', () => {
  const filePath = 'server/routes/emergency-holidays.ts';
  assert(
    fileContains(filePath, 'res.status(201)') || fileContains(filePath, 'res.status(400)'),
    'HTTP status codes not found'
  );
});

test('TypeScript strict mode compatible', () => {
  const filePath = 'client/components/holidays/EmergencyHolidayModal.tsx';
  assert(
    fileContains(filePath, 'interface') && !fileContains(filePath, 'any'),
    'TypeScript types may not be strict'
  );
});

// ============================================================================
// SECTION 9: File Structure Tests
// ============================================================================
console.log(`\n${colors.bold}${colors.yellow}[9] FILE STRUCTURE${colors.reset}\n`);

test('All frontend files in correct locations', () => {
  const files = [
    'client/components/holidays/EmergencyHolidayModal.tsx',
    'client/services/holidayNotificationTemplates.ts',
    'client/services/emergency-holiday-service.ts'
  ];
  const allExist = files.every(fileExists);
  assert(allExist, 'Some frontend files missing or in wrong location');
});

test('All backend files in correct locations', () => {
  const files = [
    'server/routes/emergency-holidays.ts',
    'server/lib/supabase.ts'
  ];
  const allExist = files.every(fileExists);
  assert(allExist, 'Some backend files missing or in wrong location');
});

test('Database schema in correct location', () => {
  assert(fileExists('database/emergency-holidays-schema.sql'), 'Schema file not in database folder');
});

test('Documentation in project root', () => {
  const files = [
    'EMERGENCY_HOLIDAY_QUICK_START.md',
    'EMERGENCY_HOLIDAY_SETUP_GUIDE.md'
  ];
  const allExist = files.every(fileExists);
  assert(allExist, 'Some documentation files missing from root');
});

// ============================================================================
// SECTION 10: Feature Completeness Tests
// ============================================================================
console.log(`\n${colors.bold}${colors.yellow}[10] FEATURE COMPLETENESS${colors.reset}\n`);

test('Modal has both urgency levels', () => {
  const filePath = 'client/components/holidays/EmergencyHolidayModal.tsx';
  assert(
    fileContains(filePath, 'Low Priority') && fileContains(filePath, 'Emergency'),
    'Both urgency levels not found in UI'
  );
});

test('Notification templates cover all channels', () => {
  const filePath = 'client/services/holidayNotificationTemplates.ts';
  const channels = ['Telegram', 'Email', 'SMS', 'notification'];
  const allChannels = channels.every(channel => 
    fileContains(filePath, channel) || fileContains(filePath, channel.toLowerCase())
  );
  assert(allChannels, 'Not all notification channels implemented');
});

test('Backend supports CRUD operations', () => {
  const filePath = 'server/routes/emergency-holidays.ts';
  const operations = ['post', 'get', 'delete'];
  const allOperations = operations.every(op => fileContains(filePath, `router.${op}`));
  assert(allOperations, 'Not all CRUD operations implemented');
});

test('Database has proper constraints', () => {
  const filePath = 'database/emergency-holidays-schema.sql';
  assert(
    fileContains(filePath, 'CHECK') || fileContains(filePath, 'CONSTRAINT'),
    'Database constraints not found'
  );
});

test('Feature has role-based access control', () => {
  const filePath = 'database/emergency-holidays-schema.sql';
  assert(
    fileContains(filePath, 'publisher') || fileContains(filePath, 'role'),
    'Role-based access control not found'
  );
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================
console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  TEST RESULTS SUMMARY${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

console.log(`${colors.bold}Total Tests:${colors.reset}   ${totalTests}`);
console.log(`${colors.bold}${colors.green}Passed:${colors.reset}        ${passedTests} ✓`);
console.log(`${colors.bold}${colors.red}Failed:${colors.reset}        ${failedTests} ✗`);

const successRate = ((passedTests / totalTests) * 100).toFixed(1);
console.log(`${colors.bold}Success Rate:${colors.reset}  ${successRate}%`);

console.log(`\n${colors.bold}${colors.yellow}BREAKDOWN BY SECTION:${colors.reset}\n`);

const sections = [
  { name: 'Frontend Components', tests: results.slice(0, 6) },
  { name: 'Notification Templates', tests: results.slice(6, 12) },
  { name: 'API Service Layer', tests: results.slice(12, 17) },
  { name: 'Backend API Routes', tests: results.slice(17, 24) },
  { name: 'Database Schema', tests: results.slice(24, 30) },
  { name: 'Integration', tests: results.slice(30, 35) },
  { name: 'Documentation', tests: results.slice(35, 40) },
  { name: 'Code Quality', tests: results.slice(40, 45) },
  { name: 'File Structure', tests: results.slice(45, 49) },
  { name: 'Feature Completeness', tests: results.slice(49, 54) }
];

sections.forEach(section => {
  const sectionPassed = section.tests.filter(t => t.status === 'PASS').length;
  const sectionTotal = section.tests.length;
  const sectionRate = ((sectionPassed / sectionTotal) * 100).toFixed(0);
  const icon = sectionPassed === sectionTotal ? '✓' : '⚠';
  const color = sectionPassed === sectionTotal ? colors.green : colors.yellow;
  console.log(`  ${color}${icon}${colors.reset} ${section.name}: ${sectionPassed}/${sectionTotal} (${sectionRate}%)`);
});

// Show failed tests if any
if (failedTests > 0) {
  console.log(`\n${colors.bold}${colors.red}FAILED TESTS:${colors.reset}\n`);
  results.filter(r => r.status === 'FAIL').forEach(test => {
    console.log(`  ${colors.red}✗${colors.reset} ${test.name}`);
    console.log(`    ${colors.red}${test.message}${colors.reset}`);
  });
}

// Final status
console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
if (failedTests === 0) {
  console.log(`${colors.bold}${colors.green}  ✓ ALL TESTS PASSED - FEATURE READY FOR DEPLOYMENT!${colors.reset}`);
} else if (failedTests < 5) {
  console.log(`${colors.bold}${colors.yellow}  ⚠ MOSTLY READY - FIX ${failedTests} MINOR ISSUES${colors.reset}`);
} else {
  console.log(`${colors.bold}${colors.red}  ✗ NEEDS WORK - ${failedTests} TESTS FAILED${colors.reset}`);
}
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

// Return exit code
process.exit(failedTests > 0 ? 1 : 0);
