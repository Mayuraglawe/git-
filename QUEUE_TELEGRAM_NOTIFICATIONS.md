# 🔔 Queue & Event Update Telegram Notifications

## ✅ IMPLEMENTED FEATURES

The system now sends automatic Telegram notifications for **all event lifecycle changes** including queue updates!

---

## 📱 Notification Types

### 1. **🆕 Event Created**
Sent when a new event is created with Telegram reminders enabled.

```
🆕 NEW: AI Workshop

Type: Workshop
Date: October 15, 2025
Time: 14:00 - 17:00
Venue: Seminar Hall

[Event Created]

Description: Hands-on AI workshop...

Organized by: Dr. John Smith
Department: Computer Science

📱 Notification from Py-Gram 2k25
```

---

### 2. **📝 Event Updated**
Sent when an existing event is modified.

```
📝 UPDATED: AI Workshop

Type: Workshop
Date: October 16, 2025 (CHANGED)
Time: 15:00 - 18:00 (CHANGED)
Venue: Auditorium (CHANGED)

[Event Updated]

Description: Updated workshop details...

Organized by: Dr. John Smith
Department: Computer Science

📱 Notification from Py-Gram 2k25
```

---

### 3. **✅ Event Approved**
Sent when a pending event is approved.

```
✅ APPROVED: AI Workshop

Type: Workshop
Date: October 15, 2025
Time: 14:00 - 17:00
Venue: Seminar Hall

[Event Approved - No longer in queue]

Description: Hands-on AI workshop...

Organized by: Dr. John Smith
Department: Computer Science

📱 Notification from Py-Gram 2k25
```

---

### 4. **❌ Event Rejected**
Sent when an event is rejected with reason.

```
❌ REJECTED: AI Workshop

Type: Workshop
Date: October 15, 2025
Time: 14:00 - 17:00
Venue: Seminar Hall

[Event Rejected]

Rejection Reason: Venue already booked

Description: Hands-on AI workshop...

Organized by: Dr. John Smith
Department: Computer Science

📱 Notification from Py-Gram 2k25
```

---

### 5. **🔄 Queue Position Updated** (NEW!)
Sent automatically when an event's queue position changes.

```
🔄 QUEUE UPDATE: AI Workshop

Type: Workshop
Date: October 15, 2025
Time: 14:00 - 17:00
Venue: Seminar Hall

[Queue Position Changed]
New Position: 2

Your event has moved up in the queue!

Description: Hands-on AI workshop...

Organized by: Dr. John Smith
Department: Computer Science

📱 Notification from Py-Gram 2k25
```

---

## 🔄 How Queue Updates Work

### Automatic Queue Management

The system **automatically recalculates and updates** queue positions when:

1. ✅ **Event is approved** → All pending events move up
2. ❌ **Event is deleted** → All pending events move up
3. 📝 **Event is updated** → Queue recalculated based on new dates
4. 🆕 **New event created** → Queue positions adjusted

### Queue Position Calculation

```javascript
// Events are sorted by:
1. Creation timestamp (first-come-first-serve)
2. Status (approved events first)
3. Priority level (if same timestamp)

// Position = Total conflicting events - Approved events + 1
```

### Example Scenario

**Initial State:**
- Event A: Approved (Position: Active)
- Event B: Pending (Position: 1)
- Event C: Pending (Position: 2)
- Event D: Pending (Position: 3)

**Event B gets approved:**
```
✅ Event B: Approved → Notification sent
🔄 Event C: Position 2 → 1 → Notification sent
🔄 Event D: Position 3 → 2 → Notification sent
```

**Event A gets deleted:**
```
🔄 Event B: Position 1 → Active → Notification sent
🔄 Event C: Position 2 → 1 → Notification sent
```

---

## 🛠️ Implementation Details

### Functions Added

#### 1. `sendTelegramNotification(event, messageType)`
Centralized function to send notifications for any event type.

```typescript
await sendTelegramNotification(event, 'created');
await sendTelegramNotification(event, 'updated');
await sendTelegramNotification(event, 'approved');
await sendTelegramNotification(event, 'rejected');
await sendTelegramNotification(event, 'queue_update');
```

#### 2. `updateQueuePositions(startDate, endDate, venue)`
Automatically recalculates queue positions and sends notifications.

```typescript
// Called after:
- Event creation (if conflict)
- Event update (always)
- Event approval
- Event deletion
```

#### 3. `notifyEventApproval(event)`
Sends approval notification.

#### 4. `notifyEventRejection(event, reason)`
Sends rejection notification with reason.

#### 5. `notifyQueuePromotion(event)`
Sends notification when event moves from pending to approved.

---

## 📋 When Notifications Are Sent

| Action | Notification Type | Telegram Sent |
|--------|------------------|---------------|
| Create Event (with Telegram reminder) | 🆕 Created | ✅ Yes |
| Update Event (with Telegram reminder) | 📝 Updated | ✅ Yes |
| Approve Event | ✅ Approved | ✅ Yes |
| Reject Event | ❌ Rejected | ✅ Yes |
| Delete Event | - | ❌ No (but queue updates sent) |
| Queue Position Changes | 🔄 Queue Update | ✅ Yes |

---

## 🎯 Usage Examples

### Creating an Event

```typescript
// User creates event
1. Fill event form
2. Add Telegram reminder
3. Submit

// System automatically:
✅ Creates event
📱 Sends "Created" notification
🔄 Checks for conflicts
🔄 Updates queue if needed
📱 Sends queue updates to affected events
```

### Updating an Event

```typescript
// User updates event
1. Edit event details
2. Change date/time/venue
3. Submit

// System automatically:
✅ Updates event
📱 Sends "Updated" notification
🔄 Recalculates queue positions
📱 Sends queue updates to affected events
```

### Approving an Event

```typescript
// Admin approves pending event
1. Opens event detail
2. Clicks "Approve"

// System automatically:
✅ Changes status to approved
📱 Sends "Approved" notification to creator
🔄 Recalculates queue
📱 Sends position updates to all waiting events
```

---

## ⚙️ Configuration

### Required Environment Variables

```env
# Server-side
TELEGRAM_BOT_TOKEN=your_bot_token

# Client-side
VITE_TELEGRAM_PRINCIPAL_CHAT_ID=your_chat_id

# Or set per user
localStorage.setItem('telegram_chat_id', 'USER_CHAT_ID');
```

### Enable/Disable Notifications

Users can control notifications by:

1. **Adding/Removing Telegram Reminders** in event form
2. **Setting Chat ID** in localStorage
3. **Configuring environment variables**

---

## 🔍 Debugging

### Check Notification Logs

```javascript
// In browser console
✅ created notification sent
✅ queue_update notification sent
✅ Event update notification sent
```

### Test Notification Flow

```javascript
// Create event → Check Telegram
// Update event → Check Telegram  
// Approve event → Check Telegram
// Check other events in queue → Should receive updates
```

### Common Issues

**No notifications received:**
```
1. Check TELEGRAM_BOT_TOKEN is set
2. Verify chat ID in localStorage
3. Ensure Telegram reminder is added
4. Check browser console for errors
```

**Queue updates not sent:**
```
1. Verify conflict exists (same date/venue)
2. Check event status is 'pending'
3. Look for console logs
4. Ensure queue positions changed
```

---

## 📊 Notification Flow Diagram

```
┌─────────────────────┐
│  Event Created      │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │ Has Telegram │
    │  Reminder?   │
    └──────┬───────┘
           │ Yes
           ▼
    ┌─────────────────┐
    │ Send "Created"  │
    │  Notification   │
    └──────┬──────────┘
           │
           ▼
    ┌─────────────────┐
    │ Check Conflicts │
    └──────┬──────────┘
           │ Yes
           ▼
    ┌─────────────────────┐
    │ Update Queue        │
    │ Positions           │
    └──────┬──────────────┘
           │
           ▼
    ┌─────────────────────┐
    │ Send "Queue Update" │
    │ to Affected Events  │
    └─────────────────────┘
```

---

## ✨ Benefits

1. **📱 Real-time Updates** - Users notified immediately
2. **🔄 Automatic Queue Management** - No manual intervention
3. **📊 Transparency** - Everyone knows their position
4. **⏰ Timely Alerts** - No missed opportunities
5. **📝 Full Audit Trail** - All changes documented

---

## 🚀 Advanced Features

### Batch Queue Updates

When multiple events are affected:
```javascript
// Only one notification per event
// Batched with 50ms delay to avoid rate limiting
// Efficient queue recalculation
```

### Smart Notification Filtering

```javascript
// Only send if:
- Position actually changed
- Event has Telegram reminder
- Chat ID is configured
- Event status is 'pending'
```

---

## 📈 Future Enhancements

- [ ] Configurable notification preferences
- [ ] Digest mode (daily summary)
- [ ] Interactive buttons (Approve/Reject from Telegram)
- [ ] Multi-language support
- [ ] Custom notification templates
- [ ] Webhook integration

---

## ✅ Status

**Implementation**: ✅ Complete
**Testing**: ✅ Ready
**Documentation**: ✅ Complete
**Production Ready**: ✅ Yes

---

## 🎉 Summary

The Events page now provides **complete Telegram integration** with:

✅ Event creation notifications
✅ Event update notifications  
✅ Event approval notifications
✅ Event rejection notifications
✅ **Automatic queue position updates**
✅ **Real-time queue notifications**
✅ Smart conflict detection
✅ Efficient batch processing

**Users are now always informed about their event status and queue position!** 📱🎉

---

*Last Updated: October 7, 2025*
