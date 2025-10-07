# Emergency Holiday Declaration - Quick Start Guide

## 🚀 Overview
The Emergency Holiday Declaration feature allows authorized users (Publishers, Faculty, Admins) to declare institutional holidays with two urgency levels:
- **Emergency** - Immediate notification for urgent closures
- **Low Priority** - Scheduled holiday notifications for planned closures

## ✨ Features
- ✅ Dual event creation mode (Standard Events + Holiday Declarations)
- ✅ Two urgency levels with visual feedback
- ✅ Multi-channel notifications (In-app + Telegram + Email + SMS)
- ✅ Professional message templates
- ✅ Calendar integration with emergency holiday display
- ✅ Confirmation system for emergency declarations

## 📋 How to Use

### 1. Access the Feature
1. Navigate to **Events** page in the application
2. Click **"Create Event"** button (requires appropriate permissions)
3. The Emergency Holiday Modal will open

### 2. Choose Event Type
**Option A: Standard Event**
- Select "Standard Event" from event type dropdown
- Fill in event details (title, description, etc.)
- Submit to create a regular event

**Option B: Holiday Declaration**
- Select "Holiday Declaration" from event type dropdown
- The interface switches to holiday declaration mode

### 3. Declare a Holiday

#### For Planned Holidays (Low Priority)
1. Select **"Holiday Declaration"** as event type
2. Choose the date using the calendar picker
3. Select **"Low Priority"** urgency level (blue radio button)
4. Enter the reason (e.g., "Staff development day")
5. Click **"Schedule Holiday"**

#### For Emergency Holidays
1. Select **"Holiday Declaration"** as event type
2. Choose the date using the calendar picker
3. Select **"Emergency"** urgency level (red radio button)
4. Enter the reason (e.g., "Severe weather conditions")
5. **Check the confirmation box**: "I confirm this is an emergency and immediate notification is required"
6. Click **"🚨 Declare Emergency Now"** (enabled only after confirmation)

### 4. Notification Preview
The modal displays a preview of the notification that will be sent:
- **Emergency**: Red alert box with urgent formatting
- **Low Priority**: Blue info box with standard formatting

## 📱 Notification Channels

### 🔔 In-App Notifications
- Appear immediately in the notification panel
- Red badge for emergency holidays
- Blue badge for planned holidays
- Shows date, reason, and sender info

### 📲 Telegram Notifications

#### Emergency Format:
```
🚨 EMERGENCY HOLIDAY ANNOUNCEMENT 🚨

Attention All Students and Faculty,

This is an official notification from The Academic Compass administration.

Due to [reason], the institution will remain CLOSED on [day, date].

❌ All scheduled classes, examinations, and on-campus activities for this day are cancelled.

⚠️ Please stay safe and await further instructions. We apologize for any inconvenience.

Regards,
The Academic Compass Administration
```

#### Low Priority Format:
```
🗓️ HOLIDAY NOTIFICATION 🗓️

Dear Students and Faculty,

Please be advised that the institution has declared a holiday on [day, date].

📋 Reason: [reason]

All academic activities will be suspended on this day. The institution will resume normal schedule on the following working day.

Please plan accordingly.

Best Regards,
The Academic Compass Administration
```

### 📧 Email Notifications
- HTML formatted professional email
- Institution branding
- Same content as Telegram with better formatting

### 💬 SMS Notifications
- Concise version for mobile delivery
- Includes date, reason, and urgency level

## 🎨 Visual Design

### Modal Interface
- **Clean Layout**: Two-column form design
- **Visual Feedback**: 
  - Blue glow for Low Priority selection
  - Red glow for Emergency selection
- **Confirmation Required**: Emergency checkbox prevents accidental emergency declarations
- **Dynamic Button**: Text changes based on urgency level

### Calendar Integration
- Emergency holidays appear in **red/orange** on the calendar
- Planned holidays appear in **blue**
- Legend includes "Emergency Holiday" entry
- Hover shows holiday reason and declaration info

## 🔐 Permissions

| Role | Can Create Emergency Holidays | Can View Holidays |
|------|------------------------------|-------------------|
| Student | ❌ No | ✅ Yes |
| Faculty | ✅ Yes | ✅ Yes |
| Publisher | ✅ Yes | ✅ Yes |
| Admin | ✅ Yes | ✅ Yes |

## 🗄️ Database Schema

### Emergency Holidays Table
```sql
CREATE TABLE emergency_holidays (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  urgency VARCHAR(20) CHECK (urgency IN ('emergency', 'low_priority')),
  reason TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50),
  title TEXT,
  message TEXT,
  priority VARCHAR(20) CHECK (priority IN ('low', 'normal', 'high')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

## 🔧 API Endpoints

### Create Emergency Holiday
```http
POST /api/emergency-holidays
Content-Type: application/json

{
  "date": "2025-02-15",
  "urgency": "emergency",
  "reason": "Severe weather - heavy snowfall",
  "created_by": "user-uuid"
}
```

**Response:**
```json
{
  "message": "Emergency holiday declared successfully. Notifications are being sent.",
  "data": {
    "id": "holiday-uuid",
    "date": "2025-02-15",
    "urgency": "emergency",
    "reason": "Severe weather - heavy snowfall",
    "notification_sent": false
  }
}
```

### Get All Emergency Holidays
```http
GET /api/emergency-holidays
```

**Response:**
```json
{
  "data": [
    {
      "id": "holiday-uuid",
      "date": "2025-02-15",
      "urgency": "emergency",
      "reason": "Severe weather",
      "created_by": "user-uuid",
      "notification_sent": true,
      "notification_sent_at": "2025-02-14T10:30:00Z"
    }
  ],
  "count": 1
}
```

### Cancel Emergency Holiday
```http
DELETE /api/emergency-holidays/{id}
```

### Resend Notifications
```http
POST /api/emergency-holidays/{id}/resend-notifications
```

## ⚙️ Setup Instructions

### 1. Database Setup
```bash
# Run the schema file
psql -U postgres -d your_database -f database/emergency-holidays-schema.sql
```

### 2. Environment Variables
Add to your `.env` file:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### 3. Telegram Bot Setup
1. Create a bot using [@BotFather](https://t.me/BotFather)
2. Get your bot token
3. Create a channel/group for notifications
4. Add your bot as admin
5. Get the chat ID
6. Update environment variables

### 4. Backend Integration
The emergency holiday routes are automatically registered when the server starts.

## 🧪 Testing

### Test Emergency Declaration
1. Login as Faculty/Publisher
2. Go to Events page
3. Click "Create Event"
4. Select "Holiday Declaration"
5. Choose tomorrow's date
6. Select "Emergency"
7. Enter reason: "Testing emergency notification system"
8. Check confirmation box
9. Click "Declare Emergency Now"
10. Check Telegram channel for notification
11. Check in-app notifications

### Test Low Priority Holiday
1. Follow steps 1-4 above
2. Choose a date 1 week ahead
3. Select "Low Priority"
4. Enter reason: "Testing scheduled holiday notification"
5. Click "Schedule Holiday"
6. Verify notification sent

## 📊 Analytics & Monitoring

### Track Notification Delivery
Check the `emergency_holidays` table:
```sql
SELECT 
  date,
  urgency,
  reason,
  notification_sent,
  notification_sent_at
FROM emergency_holidays
WHERE is_active = true
ORDER BY created_at DESC;
```

### Monitor User Notification Reads
```sql
SELECT 
  type,
  priority,
  COUNT(*) as total,
  SUM(CASE WHEN read THEN 1 ELSE 0 END) as read_count
FROM notifications
WHERE type IN ('emergency_holiday', 'holiday')
GROUP BY type, priority;
```

## 🐛 Troubleshooting

### Notifications Not Sending
1. Check environment variables are set correctly
2. Verify Telegram bot token is valid
3. Ensure bot is admin in the channel
4. Check server logs for errors
5. Verify database trigger is enabled

### Calendar Not Showing Holidays
1. Refresh the page
2. Check date range filter
3. Verify holiday is marked as `is_active = true`
4. Check console for API errors

### Permission Errors
1. Verify user role is Faculty/Publisher/Admin
2. Check RLS policies in database
3. Ensure user is authenticated

## 🎯 Best Practices

### When to Use Emergency vs Low Priority

**Use Emergency For:**
- ❗ Severe weather emergencies
- ❗ Natural disasters
- ❗ Unexpected infrastructure failures
- ❗ Health/safety emergencies
- ❗ Government-mandated closures

**Use Low Priority For:**
- 📅 Pre-planned staff training days
- 📅 Academic calendar holidays
- 📅 Cultural/festival days
- 📅 Scheduled maintenance days
- 📅 Exam preparation leaves

### Message Writing Guidelines
- **Be Clear**: State the reason concisely
- **Be Specific**: Include relevant details
- **Be Professional**: Maintain formal tone
- **Be Actionable**: Tell users what to do next

## 🔄 Update History

**Version 1.0** (Current)
- ✅ Emergency Holiday Modal
- ✅ Dual urgency levels
- ✅ Multi-channel notifications
- ✅ Calendar integration
- ✅ Database schema
- ✅ API endpoints
- ✅ Professional templates

**Planned for Version 1.1**
- 🔜 Holiday cancellation with notifications
- 🔜 Edit existing holiday declarations
- 🔜 Notification delivery reports
- 🔜 User acknowledgment tracking
- 🔜 Mobile app integration

## 📞 Support

For technical issues or questions:
- Check this documentation first
- Review server logs
- Check database connection
- Verify Telegram bot configuration
- Contact system administrator

---

**Last Updated:** January 2025  
**Feature Status:** ✅ Production Ready  
**Documentation Version:** 1.0
