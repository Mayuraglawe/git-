# 🧪 Quick Test Checklist

## ✅ Pre-Test Setup (5 minutes)

### Step 1: Configure Environment
- [ ] Open `.env` file
- [ ] Add or verify these lines:
  ```env
  TELEGRAM_BOT_TOKEN=your_bot_token_here
  TELEGRAM_STUDENT_CHAT_ID=your_chat_id
  TELEGRAM_PUBLISHER_CHAT_ID=your_chat_id
  ```
- [ ] Save the file

### Step 2: Get Bot Token (if you don't have it)
- [ ] Open Telegram
- [ ] Search for `@BotFather`
- [ ] Send `/newbot`
- [ ] Follow prompts
- [ ] Copy token to `.env`

### Step 3: Get Your Chat ID
- [ ] Start conversation with your bot on Telegram
- [ ] Send `/start` to the bot
- [ ] Go to: `http://localhost:5000/telegram-setup`
- [ ] Click "Get Recent Chat IDs"
- [ ] Copy your chat ID to `.env`

---

## 🚀 Testing Methods (Choose One)

### Method 1: Automated Test (Easiest - 2 minutes)

1. **Start the server:**
   ```bash
   pnpm dev
   ```
   - [ ] Server started successfully
   - [ ] No errors in console

2. **Run the test script:**
   ```bash
   .\test-telegram-notifications.ps1
   ```
   - [ ] Script runs without errors
   - [ ] See success messages

3. **Check Telegram:**
   - [ ] Received exam notification
   - [ ] Received assignment notification
   - [ ] Messages are formatted nicely

✅ **If all checked, feature is working!**

---

### Method 2: Manual UI Test (5 minutes)

1. **Start the server:**
   ```bash
   pnpm dev
   ```
   - [ ] Server started successfully

2. **Open application:**
   - [ ] Go to `http://localhost:5000`
   - [ ] Login as Creator (username: `Pygram2k25`, password: `creator123`)

3. **Test Exam Notification:**
   - [ ] Click "New Generation +" button
   - [ ] Select "Exam Information" tab
   - [ ] Fill all fields:
     - Type: Mid-term
     - Subject: Test Subject
     - Date: 2025-10-15
     - Time: 10:00
     - Duration: 2 hours
     - Topics: Test topics
     - Instructions: Test instructions
   - [ ] Click "Publish Exam Information"
   - [ ] See success toast message
   - [ ] Check Telegram for message

4. **Test Assignment Notification:**
   - [ ] Click "New Generation +" button again
   - [ ] Select "Assignment Deadlines" tab
   - [ ] Fill all fields:
     - Title: Test Assignment
     - Subject: Test Subject
     - Due Date: 2025-10-20
     - Due Time: 23:59
     - Description: Test description
     - Submission Format: PDF
     - Max Marks: 50
   - [ ] Click "Submit Assignment Information"
   - [ ] See success toast message
   - [ ] Check Telegram for message

✅ **If all checked, feature is working!**

---

### Method 3: API Test (Advanced - 3 minutes)

1. **Start server:**
   ```bash
   pnpm dev
   ```

2. **Test Telegram status:**
   ```bash
   curl http://localhost:5000/api/telegram/status
   ```
   - [ ] Response shows `isReady: true`

3. **Test exam creation:**
   ```powershell
   $body = @{
       type = "midterm"
       subject = "Test"
       date = "2025-10-15"
       time = "10:00"
       creator_id = "test"
       department_id = "test"
   } | ConvertTo-Json
   
   Invoke-RestMethod -Uri "http://localhost:5000/api/new-generation/exams" -Method POST -ContentType "application/json" -Body $body
   ```
   - [ ] Success response received
   - [ ] Check Telegram for message

✅ **If checked, feature is working!**

---

## 🔍 What to Look For

### In Telegram Messages:
- [ ] Message has emoji (📝 for exam, 📚 for assignment)
- [ ] Subject is shown
- [ ] Date and time are shown
- [ ] All details are included
- [ ] Message is formatted nicely
- [ ] "Py-Gram 2k25" signature at bottom

### In Server Console:
- [ ] "✅ Telegram bot initialized successfully"
- [ ] "✅ Exam/Assignment saved to mock database"
- [ ] "✅ In-app notifications sent to X users"
- [ ] "📱 Telegram notifications: X sent, Y failed"
- [ ] "✅ Exam/Assignment notification sent to chat..."

### In Application:
- [ ] Success toast appears after submit
- [ ] Form closes after submit
- [ ] No error messages
- [ ] Notification bell shows new notifications

---

## 🐛 Troubleshooting

### ❌ No Telegram message received

1. Check these in order:
   - [ ] TELEGRAM_BOT_TOKEN is set in `.env`
   - [ ] TELEGRAM_STUDENT_CHAT_ID is set in `.env`
   - [ ] You sent `/start` to the bot
   - [ ] Server restarted after updating `.env`
   - [ ] Bot is not blocked
   - [ ] Check server logs for errors

### ❌ Server won't start

1. Check:
   - [ ] No other server running on port 5000
   - [ ] `.env` file has no syntax errors
   - [ ] Dependencies installed (`pnpm install`)

### ❌ Form submission fails

1. Check:
   - [ ] All required fields filled (marked with *)
   - [ ] Dates are in correct format
   - [ ] Browser console for errors
   - [ ] Network tab for API errors

---

## 🎯 Success Criteria

**Feature is working if:**
- ✅ Test script runs without errors
- ✅ Telegram messages received
- ✅ Messages are formatted correctly
- ✅ Server logs show successful sends
- ✅ In-app notifications also created

**All 5 criteria met = 100% Success! 🎉**

---

## 📊 Test Results

**Date Tested:** _______________

**Method Used:** 
- [ ] Automated Script
- [ ] Manual UI Test
- [ ] API Test

**Results:**
- [ ] ✅ Exam notification sent to Telegram
- [ ] ✅ Assignment notification sent to Telegram
- [ ] ✅ Messages formatted correctly
- [ ] ✅ Server logs show success
- [ ] ✅ No errors encountered

**Overall Status:**
- [ ] ✅ PASS - Feature working perfectly
- [ ] ⚠️ PARTIAL - Some issues (list below)
- [ ] ❌ FAIL - Not working (list issues below)

**Notes/Issues:**
_________________________________________________
_________________________________________________
_________________________________________________

---

## 📞 Need Help?

Check these documents:
1. `TESTING_GUIDE.md` - Detailed testing guide
2. `TELEGRAM_QUICK_START.md` - Quick setup
3. `ERROR_FREE_VERIFICATION_REPORT.md` - Implementation details
4. Server console logs - Most informative!

---

**Quick Test Complete! ✅**
