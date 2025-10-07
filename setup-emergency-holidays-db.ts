/**
 * Setup Emergency Holidays Table in Supabase
 * Run this script to create the database table
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔧 Setting up Emergency Holidays table in Supabase...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    // Read the simplified SQL schema
    const sqlPath = path.join(__dirname, 'database', 'emergency-holidays-simple-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📝 SQL Schema loaded from:', sqlPath);
    console.log('🌐 Supabase URL:', supabaseUrl);
    console.log('\n⚠️  NOTE: This script creates the table structure.');
    console.log('   You need to run the SQL in Supabase Dashboard SQL Editor.\n');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('📋 SQL Statements to run:');
    console.log('═'.repeat(70));
    statements.forEach((stmt, i) => {
      console.log(`\n${i + 1}. ${stmt.substring(0, 100)}...`);
    });
    console.log('\n' + '═'.repeat(70));

    console.log('\n✅ MANUAL SETUP INSTRUCTIONS:');
    console.log('\n1. Go to: https://app.supabase.com/project/wtttlwagsnwhexbudige/sql');
    console.log('2. Copy and paste this entire SQL:');
    console.log('\n' + '─'.repeat(70));
    console.log(sql);
    console.log('─'.repeat(70));
    console.log('\n3. Click "Run" button');
    console.log('4. Verify table creation in Table Editor');
    console.log('\n💡 OR use the Supabase CLI:');
    console.log('   supabase db push --db-url "your-connection-string"');

    // Test if table exists by trying to query it
    console.log('\n🧪 Testing database connection...');
    const { data, error } = await supabase
      .from('emergency_holidays')
      .select('count')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('not found')) {
        console.log('❌ Table does NOT exist yet. Please run the SQL above in Supabase Dashboard.');
        console.log('\n📍 Quick Link: https://app.supabase.com/project/wtttlwagsnwhexbudige/sql/new');
      } else {
        console.log('❌ Database error:', error.message);
      }
    } else {
      console.log('✅ Table exists! Schema is already set up.');
      
      // Try to fetch all holidays
      const { data: holidays, error: fetchError } = await supabase
        .from('emergency_holidays')
        .select('*');

      if (!fetchError) {
        console.log(`\n📊 Current holidays in database: ${holidays?.length || 0}`);
        if (holidays && holidays.length > 0) {
          holidays.forEach(h => {
            console.log(`   • ${h.date} - ${h.urgency} - ${h.reason}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

setupDatabase();
