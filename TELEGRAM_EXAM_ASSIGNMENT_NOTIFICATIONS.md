# Telegram Exam & Assignment Notifications

## 🎯 Overview

The Py-Gram 2k25 system now automatically sends **Telegram notifications** when creators publish exam information or assignment deadlines. This ensures students and publishers receive instant updates on their mobile devices through Telegram.

## ✨ Features

- **📝 Exam Notifications**: Instant Telegram messages when exams are scheduled
- **📚 Assignment Notifications**: Real-time alerts when assignments are posted
- **📱 Dual Notification System**: Both in-app and Telegram notifications
- **🎨 Formatted Messages**: Professional, well-structured Telegram messages
- **👥 Broadcast Support**: Automatically sends to all students and publishers
- **🔔 No Configuration Needed**: Works automatically when chat IDs are configured

## 🚀 How It Works

### When Creator Submits Exam Information:

1. **Creator fills exam form** in the "New Generation" button
2. **Clicks "Publish Exam Information"**
3. **System processes**:
   - ✅ Saves exam data to database
   - ✅ Sends in-app notifications to students & publishers
   - ✅ Sends Telegram messages to configured chat IDs
   - ✅ Shows success confirmation

### When Creator Submits Assignment Information:

1. **Creator fills assignment form** in the "New Generation" button
2. **Clicks "Submit Assignment Information"**
3. **System processes**:
   - ✅ Saves assignment data to database
   - ✅ Sends in-app notifications to students & publishers
   - ✅ Sends Telegram messages to configured chat IDs
   - ✅ Shows success confirmation

## 📋 Setup Instructions

### Step 1: Configure Telegram Bot (One-Time Setup)

If you haven't already set up the Telegram bot, follow these steps:

1. **Create Telegram Bot** (if not done):
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` command
   - Follow prompts to create your bot
   - Save the **Bot Token** provided

2. **Add Bot Token to Environment**:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```

### Step 2: Get Chat IDs for Students and Publishers

You need to collect Telegram Chat IDs for users who should receive notifications:

#### For Students:

1. **Students start conversation** with your bot on Telegram
2. **Students send `/start`** command to the bot
3. **Admin retrieves Chat IDs**:
   - Visit `/telegram-setup` page in admin panel
   - Click "Get Recent Chat IDs"
   - Note down student chat IDs

#### For Publishers:

1. **Publishers start conversation** with your bot on Telegram
2. **Publishers send `/start`** command to the bot
3. **Admin retrieves Chat IDs** (same process as students)

### Step 3: Configure Chat IDs in Environment

Add the collected chat IDs to your `.env` file:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCDEF1234567890abcdef1234567890ABC

# Chat IDs for notifications
TELEGRAM_STUDENT_CHAT_ID=123456789
TELEGRAM_PUBLISHER_CHAT_ID=987654321
```

**Note**: In production, you would have individual chat IDs for each user stored in the database. For now, you can use group chat IDs or test with individual chat IDs.

### Step 4: Restart the Server

After adding environment variables:

```bash
pnpm dev
```

The server will initialize the Telegram service and be ready to send notifications.

## 📨 Notification Format

### Exam Notification Example:

```
📝 Mid-term Exam Scheduled

Subject: Data Structures and Algorithms
Date: 2025-10-15
Time: 10:00 AM
Duration: 2 hours

Topics Covered:
- Arrays and Linked Lists
- Stacks and Queues
- Trees and Graphs

Instructions:
Bring calculator. No mobile phones allowed. Closed book exam.

Posted by: Prof. John Smith
Department: Computer Science Engineering

📱 Notification from Py-Gram 2k25
```

### Assignment Notification Example:

```
📚 New Assignment Posted

Title: Database Design Project
Subject: Database Management Systems
Due Date: 2025-10-20
Due Time: 11:59 PM
Maximum Marks: 50
Submission Format: PDF document via email

Description:
Design a complete database schema for a library management system including ER diagrams, normalization, and SQL queries.

Posted by: Prof. Sarah Johnson
Department: Computer Science Engineering

📱 Notification from Py-Gram 2k25
```

## 🎯 User Experience

### For Creators:

1. Log in as **Creator mentor**
2. Click **"New Generation +"** button in dashboard
3. Select **"Exam Information"** or **"Assignment Deadlines"** tab
4. Fill in all required details
5. Click **"Publish"** button
6. Receive confirmation: *"Exam/Assignment information saved and notifications sent"*

### For Students/Publishers:

1. **In-App**: See notification badge in Py-Gram system
2. **Telegram**: Receive instant Telegram message
3. **View Details**: Can read full exam/assignment information
4. **Stay Updated**: No need to constantly check the system

## 🔧 Technical Details

### Architecture Components:

1. **TelegramService** (`server/services/telegramService.ts`)
   - Handles Telegram bot operations
   - Formats exam/assignment messages
   - Manages broadcast to multiple chats
   - Includes rate limiting protection

2. **NotificationService** (`server/services/notificationService.ts`)
   - Orchestrates in-app and Telegram notifications
   - Manages user/department lookups
   - Handles notification distribution

3. **API Routes** (`server/routes/new-generation-routes.ts`)
   - Receives exam/assignment submissions
   - Triggers notification services
   - Manages error handling

### Notification Flow:

```
Creator Submits Form
        ↓
API Route Receives Data
        ↓
Save to Database
        ↓
NotificationService Called
        ↓
    ┌───────┴───────┐
    ↓               ↓
In-App Notifs   Telegram Notifs
    ↓               ↓
Students/Publishers
```

### Environment Variables:

```env
# Required for Telegram functionality
TELEGRAM_BOT_TOKEN=<your_bot_token>

# Chat IDs for notification recipients
TELEGRAM_STUDENT_CHAT_ID=<student_chat_id>
TELEGRAM_PUBLISHER_CHAT_ID=<publisher_chat_id>

# Optional: Principal chat ID (for other features)
TELEGRAM_PRINCIPAL_CHAT_ID=<principal_chat_id>
```

## 📊 Monitoring & Logging

The system logs all notification activities:

### Success Logs:
```
✅ In-app exam notifications sent to 9 users in department dept_123
📱 Telegram exam notifications: 2 sent, 0 failed
✅ Exam notification sent to chat 123456789
```

### Info Logs:
```
ℹ️ No Telegram chat IDs configured for exam notifications
ℹ️ Telegram service not ready - skipping Telegram notifications
```

### Error Logs:
```
❌ Failed to send exam notification: <error details>
Failed to send exam notifications: <error details>
```

## 🛡️ Error Handling

The system is designed to be resilient:

- **Graceful Degradation**: If Telegram service fails, in-app notifications still work
- **No Request Failure**: Notification errors don't prevent data from being saved
- **Rate Limiting**: Small delays prevent Telegram API rate limits
- **Detailed Logging**: All errors are logged for debugging

## 🎨 Message Customization

Messages are automatically formatted with:

- **Icons**: Relevant emojis for visual appeal (📝 for exams, 📚 for assignments)
- **Bold Headings**: Important information stands out
- **Structured Layout**: Easy to read on mobile devices
- **Complete Details**: All relevant information included
- **Branding**: Py-Gram 2k25 signature at the bottom

## 🔄 Future Enhancements

Potential improvements for future versions:

- [ ] Individual chat IDs stored in user database
- [ ] User preferences for notification types
- [ ] Multilingual support for messages
- [ ] Rich media support (images, PDFs)
- [ ] Reply-to functionality
- [ ] Delivery confirmation tracking
- [ ] Analytics and reporting
- [ ] Scheduled notifications
- [ ] Reminder notifications before exams

## 🧪 Testing

### To Test Exam Notifications:

1. Log in as Creator (username: `Pygram2k25`)
2. Click "New Generation +" button
3. Fill exam form with test data
4. Click "Publish Exam Information"
5. Check:
   - ✅ Success toast appears
   - ✅ In-app notification created
   - ✅ Telegram message received (if configured)

### To Test Assignment Notifications:

1. Log in as Creator (username: `Pygram2k25`)
2. Click "New Generation +" button
3. Switch to "Assignment Deadlines" tab
4. Fill assignment form with test data
5. Click "Submit Assignment Information"
6. Check:
   - ✅ Success toast appears
   - ✅ In-app notification created
   - ✅ Telegram message received (if configured)

## 🐛 Troubleshooting

### Notifications not appearing in Telegram:

1. **Check Bot Token**: Verify `TELEGRAM_BOT_TOKEN` is set correctly
2. **Check Chat IDs**: Ensure chat IDs are valid numbers
3. **User Started Bot**: Users must send `/start` to bot first
4. **Check Logs**: Look for error messages in server console
5. **Test Connection**: Visit `/api/telegram/status` endpoint

### Telegram service not initializing:

1. **Environment Variables**: Check both token and chat IDs are set
2. **Bot Status**: Verify bot hasn't been deleted or disabled
3. **Network**: Ensure server can reach Telegram API
4. **Restart Server**: Try restarting after configuration changes

## 📞 Support

For assistance:

1. Check server logs for detailed error messages
2. Verify all environment variables are set
3. Test using the `/api/telegram/status` endpoint
4. Review the TELEGRAM_BOT_GUIDE.md for general Telegram setup
5. Contact system administrator if issues persist

---

**Status**: ✅ Fully implemented and ready for use  
**Version**: 1.0  
**Last Updated**: October 5, 2025  
**Feature**: Exam & Assignment Telegram Notifications
