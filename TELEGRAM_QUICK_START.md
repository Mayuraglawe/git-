# Quick Start Guide: Telegram Notifications for Exams & Assignments

## 🚀 5-Minute Setup

### Step 1: Add to .env File

Add these lines to your `.env` file:

```env
# Telegram Bot Token
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Chat IDs for notifications
TELEGRAM_STUDENT_CHAT_ID=student_chat_id_here
TELEGRAM_PUBLISHER_CHAT_ID=publisher_chat_id_here
```

### Step 2: Get Bot Token

1. Open Telegram
2. Search for `@BotFather`
3. Send `/newbot`
4. Follow prompts
5. Copy the bot token to `.env`

### Step 3: Get Chat IDs

1. Students/Publishers start conversation with your bot
2. They send `/start` to your bot
3. Visit `/telegram-setup` in admin panel
4. Click "Get Recent Chat IDs"
5. Copy chat IDs to `.env`

### Step 4: Restart Server

```bash
pnpm dev
```

## ✅ You're Done!

Now when creators submit exam or assignment information, notifications will automatically be sent to Telegram!

## 📱 Test It

1. Log in as Creator (`Pygram2k25`)
2. Click "New Generation +" button
3. Fill exam or assignment form
4. Click Submit
5. Check Telegram for notification! 🎉

## 📖 Full Documentation

See `TELEGRAM_EXAM_ASSIGNMENT_NOTIFICATIONS.md` for complete documentation.
