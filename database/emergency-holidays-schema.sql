-- Emergency Holidays Schema
-- This schema supports emergency and planned holiday declarations with notifications

-- Create emergency_holidays table
CREATE TABLE IF NOT EXISTS emergency_holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('emergency', 'low_priority')),
  reason TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT unique_active_holiday UNIQUE (date, is_active)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emergency_holidays_date ON emergency_holidays(date);
CREATE INDEX IF NOT EXISTS idx_emergency_holidays_urgency ON emergency_holidays(urgency);
CREATE INDEX IF NOT EXISTS idx_emergency_holidays_created_by ON emergency_holidays(created_by);
CREATE INDEX IF NOT EXISTS idx_emergency_holidays_is_active ON emergency_holidays(is_active);

-- Add comments for documentation
COMMENT ON TABLE emergency_holidays IS 'Stores emergency and planned holiday declarations';
COMMENT ON COLUMN emergency_holidays.urgency IS 'Priority level: emergency (immediate notification) or low_priority (scheduled)';
COMMENT ON COLUMN emergency_holidays.notification_sent IS 'Tracks if notifications have been sent';
COMMENT ON COLUMN emergency_holidays.is_active IS 'Soft delete flag - false when holiday is cancelled';

-- Enable Row Level Security
ALTER TABLE emergency_holidays ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view holidays
CREATE POLICY "Anyone can view emergency holidays"
  ON emergency_holidays
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Only publishers/admins can create holidays
CREATE POLICY "Publishers can create emergency holidays"
  ON emergency_holidays
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role IN ('publisher', 'admin', 'faculty')
    )
  );

-- Policy: Only creators or admins can cancel holidays
CREATE POLICY "Creators can cancel their holidays"
  ON emergency_holidays
  FOR UPDATE
  USING (
    created_by = auth.uid() 
    OR auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- Function to automatically create notifications for emergency holidays
CREATE OR REPLACE FUNCTION notify_users_of_emergency_holiday()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder - actual notification sending happens in the backend
  -- This trigger just logs the event
  RAISE NOTICE 'Emergency holiday created: % on %', NEW.urgency, NEW.date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the notification function
CREATE TRIGGER emergency_holiday_created
  AFTER INSERT ON emergency_holidays
  FOR EACH ROW
  EXECUTE FUNCTION notify_users_of_emergency_holiday();

-- Sample data for testing (commented out - uncomment to use)
/*
INSERT INTO emergency_holidays (date, urgency, reason, created_by, notification_sent) VALUES
  ('2025-02-01', 'emergency', 'Severe weather conditions - heavy snowfall', (SELECT id FROM users WHERE role = 'publisher' LIMIT 1), true),
  ('2025-03-15', 'low_priority', 'Staff development day', (SELECT id FROM users WHERE role = 'faculty' LIMIT 1), true);
*/
