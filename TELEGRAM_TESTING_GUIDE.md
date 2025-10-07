# 🧪 Telegram Notification Testing Guide

## Quick Test Instructions

### Step 1: Check Environment Setup

**Option A: Using .env file (Recommended)**
```bash
# Create .env file in project root
TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_TELEGRAM_PRINCIPAL_CHAT_ID=your_chat_id_here
```

**Option B: Using Browser localStorage**
```javascript
// Open browser console (F12) and run:
localStorage.setItem('telegram_chat_id', 'your_chat_id_here');
```

---

## 🔧 How to Get Bot Token & Chat ID

### Get Bot Token:
1. Open Telegram
2. Search for **@BotFather**
3. Send `/newbot` command
4. Follow instructions to create your bot
5. Copy the token (looks like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### Get Chat ID:
1. Open Telegram
2. Search for **@userinfobot**
3. Send any message
4. Bot will reply with your chat ID (looks like: `123456789`)

### Start Your Bot:
1. Search for your bot username in Telegram
2. Click **START** or send `/start`
3. This is required before bot can send messages!

---

## 🚀 Manual Testing Steps

### Method 1: Via Browser UI (Easiest)

1. **Start the server** (if not running):
   ```bash
   pnpm dev
   ```

2. **Open the application**:
   ```
   http://localhost:8082/events
   ```

3. **Set Chat ID** (if not in .env):
   - Open browser console (F12)
   - Run:
     ```javascript
     localStorage.setItem('telegram_chat_id', 'YOUR_CHAT_ID');
     ```

4. **Create a test event**:
   - Click **"Create Event"** button
   - Fill in the form:
     - Title: `Test Workshop`
     - Event Type: `Workshop`
     - Description: `Testing Telegram notifications`
     - Date: Tomorrow
     - Time: 10:00 - 12:00
     - Venue: `Auditorium`
   - Click **Submit**

5. **Check your Telegram**:
   - You should receive a message like:
   ```
   🆕 NEW: Test Workshop

   [Event Created]

   📅 Date: October 9, 2025
   ⏰ Time: 10:00 - 12:00
   📍 Venue: Auditorium
   📊 Event Type: Workshop
   👥 Expected Participants: 0

   📝 Description:
   Testing Telegram notifications

   👤 Organized by: Current User
   🏢 Department: Unknown Department
   ```

6. **Check browser console**:
   - Press F12
   - Look for:
     ```
     ✅ Telegram notification sent: created
     ```

---

### Method 2: Via API Test Endpoint

1. **Test bot connection first**:
   ```bash
   # Using curl (if available)
   curl http://localhost:8082/api/telegram/events/test

   # Or open in browser:
   http://localhost:8082/api/telegram/events/test
   ```

   Expected response:
   ```json
   {
     "success": true,
     "bot": {
       "id": 123456789,
       "is_bot": true,
       "first_name": "YourBotName",
       "username": "your_bot_username"
     }
   }
   ```

2. **Send test notification**:
   ```bash
   # Create test-telegram.json file:
   {
     "chatId": "YOUR_CHAT_ID",
     "event": {
       "title": "Test Event",
       "event_type": "Workshop",
       "start_date": "October 10, 2025",
       "start_time": "10:00",
       "end_time": "12:00",
       "venue": "Auditorium",
       "description": "Test notification",
       "expected_participants": 50,
       "creator_name": "Test User",
       "department_name": "Computer Science"
     }
   }

   # Send request using curl:
   curl -X POST http://localhost:8082/api/telegram/events/event-notification \
     -H "Content-Type: application/json" \
     -d @test-telegram.json
   ```

---

### Method 3: Using PowerShell (Windows)

```powershell
# Test bot connection
Invoke-RestMethod -Uri "http://localhost:8082/api/telegram/events/test" -Method GET

# Send test notification
$body = @{
    chatId = "YOUR_CHAT_ID"
    event = @{
        title = "Test Event"
        event_type = "Workshop"
        start_date = "October 10, 2025"
        start_time = "10:00"
        end_time = "12:00"
        venue = "Auditorium"
        description = "Test notification"
        expected_participants = 50
        creator_name = "Test User"
        department_name = "Computer Science"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8082/api/telegram/events/event-notification" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## ✅ Expected Results

### Success Indicators:

1. **Browser Console Shows**:
   ```
   ✅ Telegram notification sent: created
   ```

2. **Telegram Receives Message**:
   ```
   🆕 NEW: [Your Event Title]
   [Event Created]
   ... event details ...
   ```

3. **No Errors in Console**:
   - No `❌ Error sending Telegram notification`
   - No `⚠️ No Telegram chat ID configured`

---

## 🐛 Troubleshooting

### Issue 1: "⚠️ No Telegram chat ID configured"

**Solution:**
```javascript
// In browser console (F12):
localStorage.setItem('telegram_chat_id', 'YOUR_CHAT_ID');
// Refresh page and try again
```

### Issue 2: "❌ Error sending Telegram notification"

**Check:**
1. Is TELEGRAM_BOT_TOKEN correct in server .env?
2. Did you start the bot in Telegram (/start)?
3. Is the chat ID correct?
4. Is the server running?

**Debug:**
```bash
# Check server logs for detailed error
# Look in terminal where you ran 'pnpm dev'
```

### Issue 3: Server not responding

**Solution:**
```bash
# Restart the server
# Press Ctrl+C in terminal
# Run again:
pnpm dev
```

### Issue 4: Bot token not found

**Solution:**
```bash
# Create .env file in project root:
echo "TELEGRAM_BOT_TOKEN=your_token" > .env
echo "VITE_TELEGRAM_PRINCIPAL_CHAT_ID=your_chat_id" >> .env

# Restart server
pnpm dev
```

---

## 🎯 Quick Test Checklist

Before testing, ensure:

- [ ] Server is running (`pnpm dev`)
- [ ] Bot token is set (in .env or environment)
- [ ] Chat ID is set (in .env or localStorage)
- [ ] Bot has been started in Telegram (/start)
- [ ] Browser console is open (F12) to see logs
- [ ] You can access http://localhost:8082/events

---

## 📊 Test Scenarios

### Scenario 1: Create New Event
```
Action: Create event via UI
Expected: Telegram receives "🆕 NEW" message
Console: "✅ Telegram notification sent: created"
```

### Scenario 2: Update Event
```
Action: Edit existing event and save
Expected: Telegram receives "📝 UPDATED" message
Console: "✅ Telegram notification sent: updated"
```

### Scenario 3: Approve Event
```
Action: Admin approves pending event
Expected: Telegram receives "✅ APPROVED" message
Console: "✅ Telegram notification sent: approved"
```

### Scenario 4: Reject Event
```
Action: Admin rejects event
Expected: Telegram receives "❌ REJECTED" message
Console: "✅ Telegram notification sent: rejected"
```

### Scenario 5: Queue Update
```
Action: Delete event that caused queue
Expected: Affected events receive "🔄 QUEUE UPDATE" message
Console: "✅ Telegram notification sent: queue_update"
```

---

## 🔬 Advanced Testing

### Test with Multiple Events:

1. Create Event A (Workshop) - Auditorium - Oct 10
   - ✅ Should receive notification

2. Create Event B (Seminar) - Auditorium - Oct 10 (CONFLICT!)
   - ✅ Should receive notification with queue position

3. Approve Event B
   - ✅ Event B receives approval notification
   - ✅ Queue positions update for conflicting events

4. Delete Event A
   - ✅ Event B receives queue update (position changed)

---

## 📱 Sample Telegram Messages

### New Event:
```
🆕 NEW: Workshop on Machine Learning

[Event Created]

📅 Date: October 10, 2025
⏰ Time: 10:00 - 12:00
📍 Venue: Auditorium
📊 Event Type: Workshop
👥 Expected Participants: 50

📝 Description:
Introduction to ML concepts

👤 Organized by: John Doe
🏢 Department: Computer Science
```

### Updated Event:
```
📝 UPDATED: Workshop on Machine Learning

[Event Updated]

📅 Date: October 10, 2025
⏰ Time: 14:00 - 16:00  ← Changed!
📍 Venue: Lab 2  ← Changed!
📊 Event Type: Workshop
👥 Expected Participants: 50

📝 Description:
Introduction to ML concepts

👤 Organized by: John Doe
🏢 Department: Computer Science
```

---

## 💡 Tips

1. **Keep Console Open**: Always have browser console (F12) open to see notification logs

2. **Check Network Tab**: In browser DevTools, check Network tab for API calls to `/api/telegram/events/`

3. **Test Bot First**: Always test bot connection before creating events:
   ```
   http://localhost:8082/api/telegram/events/test
   ```

4. **Use Real Data**: Test with realistic event data for better results

5. **Multiple Chats**: You can send to multiple chat IDs (group chats, channels)

---

## 🎓 Video Tutorial Steps

1. ▶️ **Start Server**: `pnpm dev`
2. 🌐 **Open Browser**: http://localhost:8082/events
3. 🔑 **Set Chat ID**: Console → `localStorage.setItem(...)`
4. ➕ **Create Event**: Click "Create Event", fill form
5. 📤 **Submit**: Click "Create Event" button
6. 📱 **Check Telegram**: Look for notification
7. ✅ **Verify Console**: See "✅ notification sent"

---

## 📞 Need Help?

**Quick Checks:**
1. Is server running? → `pnpm dev`
2. Is bot started? → Send /start to bot
3. Is chat ID correct? → Check @userinfobot
4. Is token correct? → Check .env file

**Still not working?**
- Check server terminal for errors
- Check browser console for errors
- Verify bot token with @BotFather
- Try sending test message manually via API

---

## ✨ Success Criteria

You'll know it's working when:
- ✅ Browser console shows "✅ notification sent"
- ✅ Telegram receives formatted message
- ✅ Message has correct prefix (🆕, 📝, ✅, ❌, 🔄)
- ✅ All event details are displayed correctly
- ✅ No errors in console or terminal

---

*Happy Testing! 🚀*
