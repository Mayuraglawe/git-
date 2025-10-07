# 📱 Telegram Event Notifications - Setup Guide

## Overview
The platform now sends automatic Telegram notifications when events are created with Telegram reminders enabled.

---

## ✅ What's New

### 1. **Event Notifications via Telegram**
- Automatic notifications when creating events
- Formatted messages with event details
- Event type icons (🎓 Workshop, 📊 Seminar, etc.)
- Creator and department information

### 2. **New API Endpoints**
- `POST /api/telegram/events/event-notification` - Send single/broadcast event notifications
- `POST /api/telegram/events/event-reminder` - Send event reminders
- `GET /api/telegram/events/test` - Test bot connection

### 3. **Client Service**
- `telegram-event-service.ts` - Easy-to-use functions for sending notifications

---

## 🔧 Setup Instructions

### Step 1: Configure Environment Variables

Make sure you have these environment variables set:

```env
# Server-side (.env)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_PRINCIPAL_CHAT_ID=your_chat_id_here

# Client-side (.env or vite config)
VITE_TELEGRAM_PRINCIPAL_CHAT_ID=your_chat_id_here
```

### Step 2: Get Your Telegram Bot Token

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the **API token** provided
5. Add it to your `.env` file as `TELEGRAM_BOT_TOKEN`

### Step 3: Get Your Chat ID

#### Method 1: Using @userinfobot
1. Search for **@userinfobot** in Telegram
2. Start the bot
3. It will send you your **Chat ID**
4. Add it to your `.env` file as `TELEGRAM_PRINCIPAL_CHAT_ID`

#### Method 2: Using API
1. Send a message to your bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for `"chat":{"id":123456789}`
4. Use that ID

### Step 4: Configure User Chat ID (Optional)

For individual user notifications, users can set their chat ID:

```javascript
// In browser console or settings page
localStorage.setItem('telegram_chat_id', 'YOUR_CHAT_ID');
```

---

## 📖 How It Works

### Creating an Event with Telegram Notifications

1. **Go to Events Page**
2. **Click "Create Event"**
3. **Fill in event details**
4. **In the "Reminders" section:**
   - Click "Add Reminder"
   - Select "Telegram" as the type
   - Choose how many minutes before (e.g., 60 minutes)
5. **Submit the form**

### What Happens

When you create an event with Telegram reminders:

1. ✅ Event is created in the system
2. 📱 Telegram notification is sent immediately
3. 🔔 Reminder jobs are scheduled (future enhancement)

### Example Notification Message

```
🎓 Event Notification

Event: AI and Machine Learning Workshop
Type: Workshop
Date: October 15, 2025
Time: 14:00 - 17:00
Venue: Seminar Hall A
Expected Participants: 50

Description:
Hands-on workshop covering fundamental concepts
of AI and ML with practical implementations.

Organized by: Dr. John Smith
Department: Computer Science

📱 Notification from Py-Gram 2k25
```

---

## 🧪 Testing

### Test Bot Connection

```bash
curl http://localhost:8080/api/telegram/events/test
```

Expected response:
```json
{
  "success": true,
  "message": "Telegram bot is working correctly",
  "botInfo": {
    "username": "your_bot_username",
    "firstName": "Your Bot Name",
    "id": 123456789
  }
}
```

### Send Test Notification

```javascript
// In browser console
const testEvent = {
  title: "Test Event",
  event_type: "workshop",
  start_date: "October 15, 2025",
  start_time: "14:00",
  end_time: "15:00",
  venue: "Test Venue",
  description: "This is a test event",
  creator_name: "Test User",
  department_name: "Test Department"
};

const chatId = localStorage.getItem('telegram_chat_id');

fetch('/api/telegram/events/event-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chatId, event: testEvent })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 🎨 Event Type Icons

| Event Type | Icon | Color |
|------------|------|-------|
| Workshop | 🎓 | Blue |
| Seminar | 📊 | Green |
| Conference | 🎤 | Purple |
| Cultural | 🎭 | Pink |
| Sports | ⚽ | Orange |
| Technical | 💻 | Indigo |
| Orientation | 🎯 | Yellow |
| Examination | 📝 | Red |
| Meeting | 👥 | Gray |
| Other | 📅 | Slate |

---

## 🔍 Troubleshooting

### No Notifications Received

**Check 1: Bot Token**
```bash
# Verify token is set
echo $TELEGRAM_BOT_TOKEN
```

**Check 2: Chat ID**
```bash
# Verify chat ID is set
echo $TELEGRAM_PRINCIPAL_CHAT_ID
```

**Check 3: Bot Started**
- Make sure you've started a conversation with your bot
- Send `/start` to your bot in Telegram

**Check 4: Server Logs**
```bash
# Look for Telegram initialization messages
✅ Telegram service initialized successfully
✅ Telegram bot initialized successfully: @your_bot_name
```

### Error: "Telegram service is not initialized"

**Solution:**
1. Restart your server
2. Check environment variables are loaded
3. Verify bot token is valid

### Error: "Chat not found"

**Solution:**
1. Verify the chat ID is correct
2. Make sure the bot has been started
3. Check if bot is blocked

---

## 🚀 Advanced Usage

### Broadcasting to Multiple Users

```typescript
import { broadcastEventNotification } from '@/services/telegram-event-service';

const chatIds = ['123456789', '987654321'];
const event = {
  title: "Department Meeting",
  event_type: "meeting",
  start_date: "October 20, 2025",
  start_time: "10:00",
  venue: "Conference Room",
  description: "Monthly department sync",
  creator_name: "HOD",
  department_name: "CS"
};

const result = await broadcastEventNotification(chatIds, event);
console.log(`Sent to ${result.successful}/${result.total} recipients`);
```

### Custom Reminder Timing

```typescript
import { sendEventReminder } from '@/services/telegram-event-service';

// Send reminder 2 hours before
await sendEventReminder(chatId, event, 120);

// Send reminder 1 day before
await sendEventReminder(chatId, event, 1440);
```

---

## 📋 API Reference

### POST /api/telegram/events/event-notification

Send event notification to Telegram.

**Request Body:**
```json
{
  "chatId": "123456789",
  "event": {
    "title": "Event Title",
    "event_type": "workshop",
    "start_date": "October 15, 2025",
    "start_time": "14:00",
    "end_time": "17:00",
    "venue": "Seminar Hall",
    "description": "Event description",
    "expected_participants": 50,
    "creator_name": "Dr. Smith",
    "department_name": "Computer Science"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event notification sent successfully",
  "messageId": 123
}
```

### POST /api/telegram/events/event-reminder

Send event reminder to Telegram.

**Request Body:**
```json
{
  "chatId": "123456789",
  "event": { /* same as above */ },
  "minutesBefore": 60
}
```

### GET /api/telegram/events/test

Test bot connection.

**Response:**
```json
{
  "success": true,
  "message": "Telegram bot is working correctly",
  "botInfo": {
    "username": "bot_username",
    "firstName": "Bot Name",
    "id": 123456789
  }
}
```

---

## ✨ Features Summary

✅ **Implemented:**
- Event creation notifications
- Telegram reminder support
- Broadcast to multiple chats
- Custom event formatting
- Event type icons
- Test endpoints
- Error handling

🔄 **Future Enhancements:**
- Scheduled reminders (using cron jobs)
- RSVP buttons in Telegram
- Event updates notifications
- Cancellation notifications
- Interactive bot commands

---

## 📞 Support

If you encounter issues:

1. Check server logs for Telegram errors
2. Verify environment variables
3. Test bot connection using `/test` endpoint
4. Ensure bot is not blocked
5. Check Telegram API status

---

**Status**: ✅ Ready to use
**Last Updated**: October 7, 2025
