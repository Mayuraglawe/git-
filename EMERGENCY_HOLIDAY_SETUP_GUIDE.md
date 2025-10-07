# Emergency Holiday Declaration - Setup & Configuration Guide

## 🎯 Quick Setup (5 Minutes)

This guide will help you configure and test the Emergency Holiday Declaration feature.

## Step 1: Database Setup

### Option A: Using Supabase (Recommended)

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Run the Schema**
   - Click "SQL Editor" in left sidebar
   - Create new query
   - Copy entire contents of `database/emergency-holidays-schema.sql`
   - Paste into editor
   - Click "Run" button
   - ✅ You should see "Success. No rows returned"

3. **Verify Tables Created**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('emergency_holidays', 'notifications');
   ```
   Should return both table names.

### Option B: Using Local PostgreSQL

```bash
# Connect to your database
psql -U postgres -d your_database_name

# Run the schema file
\i database/emergency-holidays-schema.sql

# Verify
\dt emergency_holidays
\dt notifications
```

## Step 2: Telegram Bot Setup (5 steps)

### 2.1 Create Bot
1. Open Telegram app
2. Search for **@BotFather**
3. Send `/newbot` command
4. Follow prompts:
   - Bot name: "Academic Compass Notifications"
   - Username: "academic_compass_notifications_bot" (must be unique)
5. **Save the token** - looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### 2.2 Create Channel/Group
1. In Telegram, create new channel or group
2. Name it: "Academic Compass Alerts"
3. Set to **Public** (easier for testing, can change later)
4. Add your bot as administrator:
   - Channel/Group Settings → Administrators
   - Add Admin → Search for your bot
   - Grant "Post Messages" permission

### 2.3 Get Chat ID

**Method 1: Using Web Bot**
1. Go to: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
2. Replace `<YOUR_BOT_TOKEN>` with your actual token
3. Post a message in your channel
4. Refresh the URL
5. Find `"chat":{"id":-1001234567890}` in response
6. Copy the ID (including the minus sign if present)

**Method 2: Using @userinfobot**
1. Add @userinfobot to your channel
2. Forward any message from your channel to @userinfobot
3. It will reply with the Chat ID

### 2.4 Test Bot
```bash
# Replace with your values
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "<YOUR_CHAT_ID>",
    "text": "🧪 Test message from Emergency Holiday System"
  }'
```

You should receive the message in your channel.

## Step 3: Environment Configuration

### 3.1 Update .env File

Create or edit `.env` in project root:

```env
# Existing variables...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Add these new variables:
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890
```

### 3.2 Verify Environment Variables

Create `test-env.js` in project root:

```javascript
require('dotenv').config();

console.log('Environment Check:');
console.log('✅ TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'Set' : '❌ Missing');
console.log('✅ TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID ? 'Set' : '❌ Missing');
```

Run:
```bash
node test-env.js
```

Both should show "Set".

## Step 4: Backend Integration

### 4.1 Check Supabase Client

Verify `server/lib/supabase.ts` exists with:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

If missing, create it.

### 4.2 Register Routes

Edit `server/index.ts` (or your main server file):

```typescript
import emergencyHolidayRoutes from './routes/emergency-holidays';

// ... other code ...

// Register routes
app.use('/api/emergency-holidays', emergencyHolidayRoutes);

// ... rest of code ...
```

### 4.3 Start Server

```bash
# Install dependencies if needed
pnpm install

# Start development server
pnpm dev
```

Server should start on port 8083 (or your configured port).

## Step 5: Frontend Setup

### 5.1 Verify Modal Integration

Check `client/pages/Events.tsx` includes:

```typescript
import EmergencyHolidayModal from '@/components/events/EmergencyHolidayModal';
import { createEmergencyHoliday } from '@/services/emergency-holiday-service';
```

### 5.2 Start Frontend

```bash
# In a new terminal
pnpm dev
```

Frontend should start on port 8080.

## Step 6: Test the Feature

### Test 1: Low Priority Holiday

1. Open browser: http://localhost:8080
2. Login as Publisher/Faculty/Admin
3. Go to **Events** page
4. Click **"Create Event"** button
5. Modal opens
6. Select **"Holiday Declaration"** from event type
7. Pick a date (e.g., tomorrow)
8. Select **"Low Priority"** urgency
9. Enter reason: "Testing scheduled holiday notification"
10. Click **"Schedule Holiday"**

**Expected Result:**
- ✅ Success message appears
- ✅ Modal closes
- ✅ Check Telegram channel - you should see:
  ```
  🗓️ HOLIDAY NOTIFICATION 🗓️
  
  Dear Students and Faculty,
  
  Please be advised that the institution has declared a holiday on Friday, January 31, 2025.
  
  📋 Reason: Testing scheduled holiday notification
  ...
  ```

### Test 2: Emergency Holiday

1. Click **"Create Event"** again
2. Select **"Holiday Declaration"**
3. Pick today's date
4. Select **"Emergency"** urgency
5. Enter reason: "Testing emergency notification system"
6. **Check the confirmation checkbox**
7. Click **"🚨 Declare Emergency Now"**

**Expected Result:**
- ✅ Success message: "🚨 Emergency holiday declared successfully!"
- ✅ Telegram receives:
  ```
  🚨 EMERGENCY HOLIDAY ANNOUNCEMENT 🚨
  
  Attention All Students and Faculty,
  
  Due to Testing emergency notification system, the institution will remain CLOSED on Friday, January 31, 2025.
  
  ❌ All scheduled classes cancelled...
  ```

### Test 3: API Verification

```bash
# Get all holidays
curl http://localhost:8083/api/emergency-holidays

# Should return JSON with your test holidays
```

## Step 7: Database Verification

### Check Records Created

```sql
-- View all emergency holidays
SELECT 
  id,
  date,
  urgency,
  reason,
  notification_sent,
  created_at
FROM emergency_holidays
ORDER BY created_at DESC;

-- View notifications created
SELECT 
  type,
  title,
  priority,
  COUNT(*) as count
FROM notifications
GROUP BY type, title, priority;
```

## 🐛 Troubleshooting

### Issue: "Cannot find module '../lib/supabase'"

**Solution:**
Create `server/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Issue: Telegram not receiving messages

**Check:**
1. Bot token is correct (no spaces)
2. Chat ID is correct (including minus sign)
3. Bot is admin in channel
4. Bot has "Post Messages" permission
5. Test with curl command from Step 2.4

**Debug:**
```typescript
// Add to server/routes/emergency-holidays.ts
console.log('Telegram Token:', process.env.TELEGRAM_BOT_TOKEN);
console.log('Chat ID:', process.env.TELEGRAM_CHAT_ID);
```

### Issue: Database errors

**Check:**
1. Supabase credentials are correct
2. Tables were created successfully
3. RLS policies are enabled (or disabled for testing)

**Disable RLS temporarily for testing:**
```sql
ALTER TABLE emergency_holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
```

### Issue: Modal not opening

**Check:**
1. Component import path is correct
2. Modal state is being managed
3. Browser console for errors

**Debug:**
```typescript
// Add to Events.tsx
console.log('Modal open:', isEmergencyModalOpen);
```

### Issue: "User not authenticated"

**Solution:**
Ensure you're logged in and have appropriate role:
- Publisher
- Faculty  
- Admin

Students cannot create holidays.

## 🔍 Verification Checklist

- [ ] Database tables created successfully
- [ ] Telegram bot created and token saved
- [ ] Telegram channel/group created
- [ ] Bot added as admin to channel
- [ ] Chat ID obtained
- [ ] Environment variables set in .env
- [ ] Server started without errors
- [ ] Frontend started without errors
- [ ] Can open Emergency Holiday Modal
- [ ] Can select "Holiday Declaration"
- [ ] Can choose date
- [ ] Can select urgency level
- [ ] Emergency confirmation checkbox works
- [ ] Can submit low priority holiday
- [ ] Can submit emergency holiday
- [ ] Telegram receives low priority message
- [ ] Telegram receives emergency message
- [ ] Database records are created
- [ ] Notification records are created

## 📚 Additional Resources

### Telegram Bot API Documentation
https://core.telegram.org/bots/api

### Supabase Documentation
https://supabase.com/docs

### Testing with Postman
Import this collection:
```json
{
  "info": { "name": "Emergency Holidays API" },
  "item": [
    {
      "name": "Create Emergency Holiday",
      "request": {
        "method": "POST",
        "url": "http://localhost:8083/api/emergency-holidays",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"date\":\"2025-02-01\",\"urgency\":\"emergency\",\"reason\":\"Test\",\"created_by\":\"user-id\"}"
        }
      }
    }
  ]
}
```

## 🎉 Success!

If all tests pass, your Emergency Holiday Declaration system is fully operational!

**What's Next?**
1. Test with real users
2. Monitor Telegram notifications
3. Check notification delivery rates
4. Set up production environment
5. Configure email/SMS (optional)

---

**Need Help?**
- Review EMERGENCY_HOLIDAY_QUICK_START.md
- Check EMERGENCY_HOLIDAY_IMPLEMENTATION_SUMMARY.md
- Review console logs
- Check database records
- Test API endpoints individually
