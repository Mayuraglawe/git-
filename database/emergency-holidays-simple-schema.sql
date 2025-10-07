-- ═══════════════════════════════════════════════════════════════════════
-- Emergency Holidays Schema - COMPLETE SETUP WITH API PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════
-- This script creates the emergency_holidays table AND grants API access
-- Run this ONCE in Supabase SQL Editor to fix PGRST205 errors permanently
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Create emergency_holidays table
CREATE TABLE IF NOT EXISTS emergency_holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('emergency', 'low_priority')),
  reason TEXT NOT NULL,
  created_by TEXT NOT NULL,  -- Changed to TEXT to avoid foreign key dependency
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emergency_holidays_date ON emergency_holidays(date);
CREATE INDEX IF NOT EXISTS idx_emergency_holidays_urgency ON emergency_holidays(urgency);
CREATE INDEX IF NOT EXISTS idx_emergency_holidays_created_by ON emergency_holidays(created_by);
CREATE INDEX IF NOT EXISTS idx_emergency_holidays_is_active ON emergency_holidays(is_active);

-- 3. Add comments for documentation
COMMENT ON TABLE emergency_holidays IS 'Stores emergency and planned holiday declarations';
COMMENT ON COLUMN emergency_holidays.urgency IS 'Priority level: emergency (immediate notification) or low_priority (scheduled)';
COMMENT ON COLUMN emergency_holidays.notification_sent IS 'Tracks if notifications have been sent';
COMMENT ON COLUMN emergency_holidays.is_active IS 'Soft delete flag - false when holiday is cancelled';

-- ═══════════════════════════════════════════════════════════════════════
-- 4. CRITICAL: Grant API Access Permissions
-- ═══════════════════════════════════════════════════════════════════════
-- This makes the table accessible via Supabase's PostgREST API
-- Without this, you get PGRST205 "table not in schema cache" errors

-- Grant schema access to API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant full access to emergency_holidays table
GRANT ALL ON public.emergency_holidays TO anon, authenticated;

-- Grant access to sequences (for auto-generated IDs)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- 5. Reload Schema Cache (CRITICAL!)
-- ═══════════════════════════════════════════════════════════════════════
-- Forces Supabase to recognize the new table immediately
NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════════════
-- 6. Sample test data
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO emergency_holidays (date, urgency, reason, created_by, notification_sent) VALUES
  ('2025-10-10', 'emergency', 'Heavy rainfall - Campus flooding', 'admin@example.com', true),
  ('2025-10-25', 'low_priority', 'Diwali Festival Holiday', 'principal@example.com', true)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- SETUP COMPLETE! 
-- ═══════════════════════════════════════════════════════════════════════
-- The emergency_holidays table is now:
--   ✅ Created with proper schema
--   ✅ Accessible via Supabase API
--   ✅ Recognized by PostgREST (no more PGRST205 errors)
--   ✅ Ready for use in your application
-- ═══════════════════════════════════════════════════════════════════════
