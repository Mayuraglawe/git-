# 🧪 Testing Guide: Telegram Exam & Assignment Notifications

## 📋 Pre-Test Checklist

Before testing, ensure you have:

- [ ] Telegram bot created (via @BotFather)
- [ ] Bot token added to `.env` file
- [ ] At least one chat ID for testing
- [ ] Server running (`pnpm dev`)

---

## 🔧 Step 1: Environment Setup

### 1.1 Check Your `.env` File

Open your `.env` file and verify these variables exist:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_STUDENT_CHAT_ID=your_chat_id_for_testing
TELEGRAM_PUBLISHER_CHAT_ID=your_chat_id_for_testing
```

**Note**: For testing, you can use your own chat ID for both student and publisher.

### 1.2 Get Your Chat ID (If You Don't Have It)

1. **Start conversation with your bot:**
   - Open Telegram
   - Search for your bot (the username from @BotFather)
   - Click "Start" or send `/start`

2. **Get your chat ID:**
   - Go to: `http://localhost:5000/telegram-setup` (or your server URL)
   - Click "Get Recent Chat IDs"
   - Copy your chat ID from the response

3. **Add to `.env`:**
   ```env
   TELEGRAM_STUDENT_CHAT_ID=your_chat_id
   TELEGRAM_PUBLISHER_CHAT_ID=your_chat_id
   ```

---

## 🚀 Step 2: Start the Server

### 2.1 Start Development Server

```bash
pnpm dev
```

### 2.2 Check Server Logs

Look for these confirmation messages:

```
✅ Telegram bot initialized successfully: @YourBotUsername
🚀 Server started on port 5000
```

**If you see errors:**
- Check your bot token is correct
- Ensure no extra spaces in `.env` file
- Verify bot hasn't been deleted

---

## 🧪 Step 3: Test Telegram Service Status

### 3.1 Check Telegram Service

Open your browser or use curl/Postman:

```bash
# Using browser
http://localhost:5000/api/telegram/status

# Using curl (PowerShell)
curl http://localhost:5000/api/telegram/status
```

**Expected Response:**
```json
{
  "success": true,
  "status": {
    "isReady": true,
    "hasToken": true,
    "hasChatId": true,
    "lastChecked": "2025-10-05T..."
  }
}
```

✅ **If `isReady: true`** → Service is working!  
❌ **If `isReady: false`** → Check environment variables

---

## 📝 Step 4: Test Exam Notification

### 4.1 Login as Creator

1. Open your application: `http://localhost:5000` (or your URL)
2. Login with Creator credentials:
   - **Username**: `Pygram2k25`
   - **Password**: `creator123`

### 4.2 Create Test Exam

1. Click the **"New Generation +"** button (should be visible on dashboard)
2. Select **"Exam Information"** tab
3. Fill in the form:

   ```
   Exam Type: Mid-term
   Subject: Test Subject - Data Structures
   Date: 2025-10-15
   Time: 10:00
   Duration: 2 hours
   Topics: Arrays, Trees, Graphs
   Instructions: Bring calculator. No phones.
   ```

4. Click **"Publish Exam Information"** button

### 4.3 What to Expect

**In the Application:**
- ✅ Success toast: "Exam information saved and notifications sent"
- ✅ Form closes
- ✅ Exam appears in exam list

**In Server Console:**
```
✅ Exam saved to mock database: {...}
📧 Notification sent and stored: {...}
✅ In-app exam notifications sent to 9 users in department...
📱 Telegram exam notifications: X sent, Y failed
✅ Exam notification sent to chat XXXXX
```

**In Telegram:**
- ✅ You should receive a message like:

```
📝 Mid-term Exam Scheduled

Subject: Test Subject - Data Structures
Date: 2025-10-15
Time: 10:00
Duration: 2 hours

Topics Covered:
Arrays, Trees, Graphs

Instructions:
Bring calculator. No phones.

Posted by: Creator
Department: Department

📱 Notification from Py-Gram 2k25
```

### 4.4 Troubleshooting Exam Test

**❌ No Telegram message received:**
1. Check server logs for errors
2. Verify your chat ID is in `.env`
3. Make sure you sent `/start` to the bot
4. Check bot isn't blocked

**❌ Error toast appears:**
1. Check server console for error details
2. Verify all required fields filled
3. Check network connection

---

## 📚 Step 5: Test Assignment Notification

### 5.1 Create Test Assignment

1. Still logged in as Creator
2. Click **"New Generation +"** button again
3. Select **"Assignment Deadlines"** tab
4. Fill in the form:

   ```
   Title: Test Assignment - Database Project
   Subject: DBMS
   Due Date: 2025-10-20
   Due Time: 23:59
   Description: Design a library management database
   Submission Format: PDF via email
   Maximum Marks: 50
   ```

5. Click **"Submit Assignment Information"** button

### 5.2 What to Expect

**In the Application:**
- ✅ Success toast: "Assignment information saved and notifications sent"
- ✅ Form closes
- ✅ Assignment appears in assignment list

**In Server Console:**
```
✅ Assignment saved to mock database: {...}
📧 Notification sent and stored: {...}
✅ In-app assignment notifications sent to 9 users...
📱 Telegram assignment notifications: X sent, Y failed
✅ Assignment notification sent to chat XXXXX
```

**In Telegram:**
- ✅ You should receive a message like:

```
📚 New Assignment Posted

Title: Test Assignment - Database Project
Subject: DBMS
Due Date: 2025-10-20
Due Time: 23:59
Maximum Marks: 50
Submission Format: PDF via email

Description:
Design a library management database

Posted by: Creator
Department: Department

📱 Notification from Py-Gram 2k25
```

---

## 🔍 Step 6: Verify In-App Notifications

### 6.1 Login as Student/Publisher

1. Logout from Creator account
2. Login as Student:
   - **Username**: `student1`
   - **Password**: `student123`

### 6.2 Check Notifications

1. Look for notification bell icon (should show badge)
2. Click on notifications
3. You should see:
   - ✅ "Mid-term Exam Scheduled" notification
   - ✅ "New Assignment Posted" notification

---

## 📊 Step 7: Advanced Testing

### 7.1 Test Without Telegram Configured

1. **Remove chat IDs from `.env`:**
   ```env
   # Comment out or remove these lines
   # TELEGRAM_STUDENT_CHAT_ID=...
   # TELEGRAM_PUBLISHER_CHAT_ID=...
   ```

2. **Restart server**

3. **Create exam/assignment**

**Expected Behavior:**
- ✅ In-app notifications still work
- ✅ Success toast still appears
- ✅ Server logs: "ℹ️ No Telegram chat IDs configured"
- ✅ No errors, graceful fallback

### 7.2 Test API Endpoints Directly

**Test Exam Creation API:**

```bash
# PowerShell
$body = @{
    type = "midterm"
    subject = "API Test Subject"
    date = "2025-10-25"
    time = "14:00"
    duration = "1 hour"
    instructions = "API test"
    topics = "Testing"
    creator_id = "creator_1"
    department_id = "dept_1"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/new-generation/exams" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected Response:**
```json
{
  "message": "Exam information created successfully and notifications sent",
  "data": { ... }
}
```

**Test Assignment Creation API:**

```bash
# PowerShell
$body = @{
    title = "API Test Assignment"
    subject = "Testing"
    dueDate = "2025-10-30"
    dueTime = "23:59"
    description = "API test assignment"
    submissionFormat = "PDF"
    maxMarks = "100"
    creator_id = "creator_1"
    department_id = "dept_1"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/new-generation/assignments" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## ✅ Test Results Checklist

### Exam Notification Test:
- [ ] Server logs show exam saved
- [ ] Server logs show in-app notifications sent
- [ ] Server logs show Telegram notifications sent
- [ ] Telegram message received
- [ ] Message format is correct
- [ ] All exam details present in message
- [ ] Success toast appears in UI
- [ ] In-app notification created

### Assignment Notification Test:
- [ ] Server logs show assignment saved
- [ ] Server logs show in-app notifications sent
- [ ] Server logs show Telegram notifications sent
- [ ] Telegram message received
- [ ] Message format is correct
- [ ] All assignment details present in message
- [ ] Success toast appears in UI
- [ ] In-app notification created

### Error Handling Test:
- [ ] Works without Telegram configured
- [ ] Graceful fallback logs shown
- [ ] No server crashes
- [ ] In-app notifications still work

---

## 🐛 Common Issues & Solutions

### Issue 1: "Telegram bot is not initialized"

**Solution:**
1. Check `TELEGRAM_BOT_TOKEN` in `.env`
2. Verify token is valid (no spaces)
3. Restart server

### Issue 2: No Telegram message received

**Solution:**
1. Verify you sent `/start` to bot
2. Check chat ID is correct
3. Ensure bot isn't blocked
4. Check `TELEGRAM_STUDENT_CHAT_ID` or `TELEGRAM_PUBLISHER_CHAT_ID` is set
5. Look for errors in server logs

### Issue 3: "Failed to send message"

**Solution:**
1. Check internet connection
2. Verify bot token is still valid
3. Check if Telegram API is accessible
4. Review server logs for specific error

### Issue 4: Form submission fails

**Solution:**
1. Fill all required fields (marked with *)
2. Check date/time formats
3. Open browser console for errors
4. Check network tab for API errors

---

## 📸 Expected Screenshots

### 1. Server Console (Success):
```
✅ Telegram bot initialized successfully: @YourBot
🚀 Server started on port 5000
✅ Exam saved to mock database
✅ In-app exam notifications sent to 9 users
📱 Telegram exam notifications: 2 sent, 0 failed
✅ Exam notification sent to chat 123456789
```

### 2. Telegram Message:
Should show formatted message with exam/assignment details

### 3. Application UI:
Should show success toast and notification in bell icon

---

## 🎯 Quick Test Script

Run this quick test (after server is running):

```bash
# 1. Check Telegram status
curl http://localhost:5000/api/telegram/status

# 2. Check if server is responding
curl http://localhost:5000/api/ping

# 3. Create test exam
# (Use the PowerShell command from Advanced Testing section)

# 4. Check your Telegram!
```

---

## 📞 Need Help?

If tests fail:

1. **Check server logs** - Most informative
2. **Check browser console** - For UI errors
3. **Check `.env` file** - Verify configuration
4. **Review** `ERROR_FREE_VERIFICATION_REPORT.md`
5. **Review** `TELEGRAM_EXAM_ASSIGNMENT_NOTIFICATIONS.md`

---

## ✅ Test Complete!

If all tests pass, your implementation is working perfectly! 🎉

**Next Steps:**
- Configure individual user chat IDs in production
- Set up Telegram bot for actual students/publishers
- Monitor logs for any issues
- Enjoy automated notifications! 📱

---

**Testing Date**: October 5, 2025  
**Feature**: Telegram Notifications for Exams & Assignments  
**Status**: Ready for Testing ✅
