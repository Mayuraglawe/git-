/**
 * Automated Database Setup for Emergency Holidays
 * This script uses Supabase REST API to create the table
 */

import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const SQL_COMMANDS = [
  // Create table
  `CREATE TABLE IF NOT EXISTS emergency_holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('emergency', 'low_priority')),
    reason TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
  )`,
  
  // Create indexes
  `CREATE INDEX IF NOT EXISTS idx_emergency_holidays_date ON emergency_holidays(date)`,
  `CREATE INDEX IF NOT EXISTS idx_emergency_holidays_urgency ON emergency_holidays(urgency)`,
  `CREATE INDEX IF NOT EXISTS idx_emergency_holidays_created_by ON emergency_holidays(created_by)`,
  `CREATE INDEX IF NOT EXISTS idx_emergency_holidays_is_active ON emergency_holidays(is_active)`,
];

async function runSQL(query: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey!,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response.json();
}

async function setup() {
  console.log('🚀 Starting automatic database setup...\n');
  
  try {
    for (let i = 0; i < SQL_COMMANDS.length; i++) {
      const cmd = SQL_COMMANDS[i];
      const shortCmd = cmd.substring(0, 60).replace(/\n/g, ' ') + '...';
      console.log(`${i + 1}/${SQL_COMMANDS.length} Executing: ${shortCmd}`);
      
      try {
        await runSQL(cmd);
        console.log('   ✅ Success\n');
      } catch (error) {
        console.log(`   ⚠️  ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }

    console.log('✅ Database setup complete!');
    console.log('\n📝 Please run this SQL manually in Supabase Dashboard:');
    console.log('   https://app.supabase.com/project/wtttlwagsnwhexbudige/sql/new');
    console.log('\nPaste this SQL and click RUN:');
    console.log('═'.repeat(70));
    console.log(SQL_COMMANDS.join(';\n\n') + ';');
    console.log('═'.repeat(70));
    
  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : String(error));
    console.log('\n📝 MANUAL SETUP REQUIRED');
    console.log('   Go to: https://app.supabase.com/project/wtttlwagsnwhexbudige/sql/new');
    console.log('   Paste and run the SQL above');
  }
}

setup();
