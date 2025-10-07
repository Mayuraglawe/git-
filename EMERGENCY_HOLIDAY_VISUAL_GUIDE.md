# Emergency Holiday Feature - Visual Guide & Testing

## 🎯 Feature Overview

The Emergency Holiday Declaration feature allows administrators and publishers to quickly declare holidays with professional notifications sent to students, faculty, and publishers through both in-app notifications and Telegram.

---

## 📸 Visual Preview

### 1. Events Page - Button Location
```
┌─────────────────────────────────────────────────────────────┐
│ Events                                                       │
│                                                              │
│  [Create Event]  [Declare Emergency Holiday] ← NEW BUTTON   │
│                                                              │
│  📅 Calendar View                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Event Calendar (with Indian holidays highlighted)    │  │
│  │  - Sundays in Red                                     │  │
│  │  - National Holidays in Orange                        │  │
│  │  - Festival Holidays in Pink                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2. Emergency Holiday Dialog (Initial View)
```
┌──────────────────────────────────────────────────────────┐
│  Declare Emergency Holiday                           [X]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Holiday Title *                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Emergency Maintenance                              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Reason *                                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Urgent electrical work in all campus buildings.   │ │
│  │ Safety inspection required by authorities.         │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Holiday Date *                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  January 25, 2025                     📅          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Priority Level *                                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │  [🚨 Emergency]  [ 📋 Low Priority ]              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Additional Notes                                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │ All classes cancelled. Campus will reopen          │ │
│  │ tomorrow at 9 AM.                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ⬇️ More options below ⬇️                               │
└──────────────────────────────────────────────────────────┘
```

### 3. Emergency Holiday Dialog (Scrolled - Recipients & Telegram)
```
┌──────────────────────────────────────────────────────────┐
│  Declare Emergency Holiday                           [X]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Notify Recipients *                                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ☑ Students    ☑ Faculty    ☑ Publishers         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Notification Channels *                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ☑ Send via Telegram                              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│                                                          │
│            [Cancel]        [Declare Holiday]             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🎨 Priority Level Comparison

### Emergency Priority (🚨)
**Use When**: Urgent, time-sensitive announcements requiring immediate attention

**Visual Indicators**:
- 🚨 Red warning emoji
- Bold red badge
- Selected state: Dark red background

**Telegram Behavior**:
- Sound: **ENABLED** (notification sound plays)
- Formatting: **Bold headers**, large emojis
- Urgency indicator: ⚠️ EMERGENCY notification tag

**Example Message**:
```
🚨 EMERGENCY HOLIDAY DECLARED

📅 Date: January 25, 2025
📌 Title: Emergency Maintenance

📝 Reason:
Urgent electrical work in campus buildings

💡 Additional Information:
All classes cancelled. Campus will reopen tomorrow.

⚠️ This is an EMERGENCY notification. Please take immediate note.

Declared at: 2:30 PM, January 24, 2025
```

---

### Low Priority (📋)
**Use When**: Standard announcements, planned events, routine updates

**Visual Indicators**:
- 📋 Blue document emoji
- Calm blue badge
- Selected state: Light blue background

**Telegram Behavior**:
- Sound: **DISABLED** (silent notification)
- Formatting: Standard text, normal emojis
- Urgency indicator: ℹ️ Standard notification tag

**Example Message**:
```
📋 HOLIDAY NOTIFICATION

📅 Date: February 15, 2025
📌 Title: Cultural Event

📝 Reason:
Annual college festival preparation

💡 Additional Information:
Students are encouraged to participate in organizing activities.

ℹ️ This is a standard notification.

Declared at: 10:00 AM, February 10, 2025
```

---

## 🔔 Notification Flow

### Step-by-Step Process
```
1. Admin clicks "Declare Emergency Holiday" button
   ↓
2. Dialog opens with empty form
   ↓
3. Admin fills in:
   - Title: "Emergency Maintenance"
   - Reason: "Urgent electrical work..."
   - Date: Picks from calendar → Jan 25, 2025
   - Priority: Clicks "🚨 Emergency"
   - Additional Notes: "All classes cancelled..."
   - Recipients: Checks ☑ Students, ☑ Faculty, ☑ Publishers
   - Telegram: Checks ☑ Send via Telegram
   ↓
4. Admin clicks "Declare Holiday"
   ↓
5. System validates form:
   ✓ Title present
   ✓ Reason present
   ✓ Date selected
   ✓ At least one recipient selected
   ↓
6. System saves to database (emergency_holidays table)
   ↓
7. System formats professional message based on priority
   ↓
8. System sends Telegram messages:
   → To Students Group (-1001234567890)
   → To Faculty Group (-1009876543210)
   → To Publishers Group (-1005555555555)
   ↓
9. System sends in-app notifications
   ↓
10. Success toast appears: "Emergency holiday declared successfully!"
    ↓
11. Dialog closes
    ↓
12. Events page refreshes to show new holiday
```

---

## 📱 Telegram Group Messages

### Students Group
```
╔══════════════════════════════════════════════╗
║  PyGram Bot 🤖                               ║
╠══════════════════════════════════════════════╣
║                                              ║
║  🚨 EMERGENCY HOLIDAY DECLARED               ║
║                                              ║
║  📅 Date: January 25, 2025                   ║
║  📌 Title: Emergency Maintenance             ║
║                                              ║
║  📝 Reason:                                  ║
║  Urgent electrical work in campus buildings  ║
║                                              ║
║  💡 Additional Information:                  ║
║  All classes cancelled. Campus will reopen   ║
║  tomorrow at 9 AM.                           ║
║                                              ║
║  ⚠️ This is an EMERGENCY notification.       ║
║  Please take immediate note.                 ║
║                                              ║
║  Declared at: 2:30 PM, January 24, 2025      ║
║                                              ║
╚══════════════════════════════════════════════╝

🔊 Sound: ON
📱 Push notification sent
```

### Faculty Group
```
╔══════════════════════════════════════════════╗
║  PyGram Bot 🤖                               ║
╠══════════════════════════════════════════════╣
║                                              ║
║  🚨 EMERGENCY HOLIDAY DECLARED               ║
║                                              ║
║  📅 Date: January 25, 2025                   ║
║  📌 Title: Emergency Maintenance             ║
║                                              ║
║  📝 Reason:                                  ║
║  Urgent electrical work in campus buildings  ║
║                                              ║
║  💡 Additional Information:                  ║
║  All classes cancelled. Campus will reopen   ║
║  tomorrow at 9 AM.                           ║
║                                              ║
║  ⚠️ This is an EMERGENCY notification.       ║
║  Please take immediate note.                 ║
║                                              ║
║  Declared at: 2:30 PM, January 24, 2025      ║
║                                              ║
╚══════════════════════════════════════════════╝

🔊 Sound: ON
📱 Push notification sent
```

### Publishers Group
```
╔══════════════════════════════════════════════╗
║  PyGram Bot 🤖                               ║
╠══════════════════════════════════════════════╣
║                                              ║
║  🚨 EMERGENCY HOLIDAY DECLARED               ║
║                                              ║
║  📅 Date: January 25, 2025                   ║
║  📌 Title: Emergency Maintenance             ║
║                                              ║
║  📝 Reason:                                  ║
║  Urgent electrical work in campus buildings  ║
║                                              ║
║  💡 Additional Information:                  ║
║  All classes cancelled. Campus will reopen   ║
║  tomorrow at 9 AM.                           ║
║                                              ║
║  ⚠️ This is an EMERGENCY notification.       ║
║  Please take immediate note.                 ║
║                                              ║
║  Declared at: 2:30 PM, January 24, 2025      ║
║                                              ║
╚══════════════════════════════════════════════╝

🔊 Sound: ON
📱 Push notification sent
```

---

## ✅ Form Validation Visual Feedback

### Missing Required Fields
```
┌──────────────────────────────────────────────────────────┐
│  Declare Emergency Holiday                           [X]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Holiday Title *                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │ ← Empty!
│  └────────────────────────────────────────────────────┘ │
│  ⚠️ Title is required                                   │
│                                                          │
│  Reason *                                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │ ← Empty!
│  └────────────────────────────────────────────────────┘ │
│  ⚠️ Reason is required                                  │
│                                                          │
│  (Rest of form...)                                       │
│                                                          │
│  ⚠️ At least one recipient must be selected            │
│                                                          │
│            [Cancel]        [Declare Holiday]             │
│                            ↑ Disabled until valid        │
└──────────────────────────────────────────────────────────┘
```

### Valid Form (Ready to Submit)
```
┌──────────────────────────────────────────────────────────┐
│  Declare Emergency Holiday                           [X]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Holiday Title * ✓                                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Emergency Maintenance                              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Reason * ✓                                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Urgent electrical work required...                 │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Holiday Date * ✓                                        │
│  Date: January 25, 2025                                  │
│                                                          │
│  Priority: 🚨 Emergency ✓                                │
│  Recipients: Students, Faculty, Publishers ✓             │
│  Telegram: Enabled ✓                                     │
│                                                          │
│            [Cancel]        [Declare Holiday] ← Active!   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🎬 User Interaction Flow

### Scenario 1: Emergency Campus Closure

**Context**: Severe weather alert, campus needs to close immediately

1. **Admin logs in** → Goes to Events page
2. **Clicks** "Declare Emergency Holiday" button
3. **Fills form**:
   - Title: "Emergency Campus Closure"
   - Reason: "Severe storm warning issued by meteorological department"
   - Date: Today (auto-filled)
   - Priority: **🚨 Emergency** (selected)
   - Additional Notes: "Stay safe indoors. Further updates will be shared."
   - Recipients: ☑ All (students, faculty, publishers)
   - Telegram: ☑ Enabled

4. **Clicks** "Declare Holiday"
5. **System processes**:
   - ⏳ Shows loading spinner
   - 💾 Saves to database
   - 📤 Sends Telegram messages (with sound)
   - 🔔 Sends in-app notifications
   - ✅ Shows success: "Emergency holiday declared successfully!"

6. **All recipients receive**:
   - 📱 Telegram notification (LOUD, with sound)
   - 🔔 In-app notification
   - 📧 Optional: Email (if configured)

### Scenario 2: Planned Cultural Event

**Context**: Annual college festival, declaring holiday in advance

1. **Publisher logs in** → Goes to Events page
2. **Clicks** "Declare Emergency Holiday" button
3. **Fills form**:
   - Title: "College Cultural Festival"
   - Reason: "Annual festival with inter-department competitions"
   - Date: February 15, 2025
   - Priority: **📋 Low Priority** (selected)
   - Additional Notes: "Participation is encouraged. Schedule will be shared soon."
   - Recipients: ☑ Students, ☑ Faculty
   - Telegram: ☑ Enabled

4. **Clicks** "Declare Holiday"
5. **System processes**:
   - ⏳ Shows loading spinner
   - 💾 Saves to database
   - 📤 Sends Telegram messages (SILENT)
   - 🔔 Sends in-app notifications
   - ✅ Shows success toast

6. **Recipients receive**:
   - 📱 Telegram notification (silent, no sound)
   - 🔔 In-app notification
   - 📧 Optional: Email

---

## 🧪 Testing Scenarios

### Test 1: Form Validation
**Steps**:
1. Click "Declare Emergency Holiday"
2. Try to submit empty form
3. **Expected**: Form prevents submission, shows validation errors

### Test 2: Emergency Priority Message
**Steps**:
1. Fill form with emergency priority
2. Submit
3. Check Telegram groups
4. **Expected**: Messages delivered with sound, bold formatting

### Test 3: Low Priority Message
**Steps**:
1. Fill form with low priority
2. Submit
3. Check Telegram groups
4. **Expected**: Messages delivered silently, standard formatting

### Test 4: Selective Recipients
**Steps**:
1. Select only "Students" checkbox
2. Uncheck "Faculty" and "Publishers"
3. Submit
4. **Expected**: Only students group receives message

### Test 5: Telegram Toggle
**Steps**:
1. Fill form
2. Uncheck "Send via Telegram"
3. Submit
4. **Expected**: Only in-app notifications sent, no Telegram messages

### Test 6: Database Persistence
**Steps**:
1. Declare a holiday
2. Check database
3. **Expected**: Record present in `emergency_holidays` table

**SQL Query**:
```sql
SELECT * FROM emergency_holidays ORDER BY declared_at DESC LIMIT 1;
```

---

## 📊 Success Indicators

### Visual Confirmation
- ✅ Button appears in Events page header
- ✅ Dialog opens smoothly
- ✅ Form fields are clear and accessible
- ✅ Priority toggle works (visual state change)
- ✅ Date picker opens and allows selection
- ✅ Checkboxes toggle correctly
- ✅ Submit button enables when form is valid
- ✅ Loading state shows during submission
- ✅ Success toast appears after submission
- ✅ Dialog closes automatically on success

### Functional Confirmation
- ✅ Form validation prevents incomplete submissions
- ✅ Data saves to database correctly
- ✅ Telegram messages delivered to selected groups
- ✅ Message formatting matches priority level
- ✅ Sound settings respect priority (emergency = sound, low = silent)
- ✅ In-app notifications appear
- ✅ Only admin/publisher users see the button
- ✅ Student/faculty users don't see the button

### Technical Confirmation
- ✅ API endpoints respond correctly
- ✅ Database queries execute without errors
- ✅ Telegram bot sends messages successfully
- ✅ RLS policies enforce access control
- ✅ Error handling catches and displays failures
- ✅ Logs record all actions for audit trail

---

## 🎨 Color Scheme & Styling

### Priority Badges

**Emergency Priority**:
- Background: `bg-red-100 dark:bg-red-900/30`
- Text: `text-red-800 dark:text-red-200`
- Border: `border-red-300 dark:border-red-700`
- Emoji: 🚨 (red siren)

**Low Priority**:
- Background: `bg-blue-100 dark:bg-blue-900/30`
- Text: `text-blue-800 dark:text-blue-200`
- Border: `border-blue-300 dark:border-blue-700`
- Emoji: 📋 (blue clipboard)

### Form Elements
- **Input Fields**: White background, gray border, rounded corners
- **Textarea**: Larger height, auto-resize
- **Buttons**: 
  - Primary (Declare): Blue gradient, white text
  - Secondary (Cancel): Gray outline, dark text
- **Checkboxes**: Custom styled with blue accent when checked
- **Date Picker**: Calendar popup with hover states

---

## 📋 Checklist for Admins

Before declaring a holiday, ensure:
- [ ] Title is clear and descriptive
- [ ] Reason explains why (mandatory)
- [ ] Date is correct
- [ ] Priority level matches urgency:
  - [ ] Emergency: Urgent, immediate action needed
  - [ ] Low: Standard announcement
- [ ] Recipients selected match intended audience
- [ ] Additional notes provide helpful context
- [ ] Telegram enabled if immediate notification needed
- [ ] All information is accurate (cannot easily undo)

---

## 🚀 Quick Start Testing

### Fastest Way to Test (5 Minutes)

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Login as admin** at `http://localhost:8083`

3. **Go to Events page** → Click "Declare Emergency Holiday"

4. **Fill quick test form**:
   - Title: "Test Holiday"
   - Reason: "Testing emergency holiday feature"
   - Date: Tomorrow
   - Priority: Low
   - Recipients: Students only
   - Telegram: Disabled (for quick test)

5. **Click "Declare Holiday"**

6. **Verify**:
   - Success message appears
   - Dialog closes
   - Check browser console for API calls
   - Check Network tab for successful POST

7. **Database check** (if database set up):
   ```sql
   SELECT * FROM emergency_holidays WHERE title = 'Test Holiday';
   ```

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Button not visible
- **Check**: User has admin/publisher role
- **Check**: `hasPermission('manage_holidays')` returns true
- **Fix**: Update user permissions in database

**Issue**: Form won't submit
- **Check**: All required fields filled
- **Check**: At least one recipient selected
- **Fix**: Fill all marked fields with *

**Issue**: Telegram messages not sent
- **Check**: Bot token configured in `.env`
- **Check**: Group IDs correct (negative numbers)
- **Check**: Bot is member of groups
- **Fix**: Review Telegram setup in guide

**Issue**: Database errors
- **Check**: `emergency_holidays` table exists
- **Check**: RLS policies allow insertion
- **Fix**: Run database schema SQL script

---

## ✨ Summary

The Emergency Holiday feature provides a **professional, user-friendly interface** for declaring holidays with **multi-channel notifications**. The visual design is clean, the form validation is robust, and the messaging is professional and context-aware.

**Key Highlights**:
- 🎨 Clean, modern UI with Tailwind CSS
- ✅ Comprehensive form validation
- 🚨 Two priority levels with visual distinction
- 📱 Multi-channel notifications (in-app + Telegram)
- 🔒 Role-based access control
- 💾 Complete database persistence
- 📊 Professional message formatting
- 🌓 Dark mode compatible

**Status**: ✅ **Ready for deployment** (pending configuration)

Refer to `EMERGENCY_HOLIDAY_SETUP_GUIDE.md` for deployment instructions.
