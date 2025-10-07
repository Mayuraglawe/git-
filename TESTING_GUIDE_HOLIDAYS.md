# 🧪 Indian Holidays Calendar - Testing Guide

## Test Environment
**Server:** http://localhost:8083/
**Status:** ✅ Running

---

## 📋 Test Checklist

### 1. Event Calendar Page Tests

#### A. Access the Events Page
- [ ] Navigate to `/events` page
- [ ] Calendar view should load without errors
- [ ] Calendar should display current month

#### B. Indian Holidays Display
- [ ] Verify holidays are visible on calendar dates
- [ ] Check color coding:
  - 🟠 **Orange** badges = National holidays (Republic Day, Independence Day, etc.)
  - 🩷 **Pink** badges = Festivals (Diwali, Holi, Ganesh Chaturthi, etc.)
  - 🟣 **Purple** badges = Religious holidays (Eid, Christmas, etc.)
  - 🔵 **Blue** badges = State holidays (Maharashtra Day)
  - 🔴 **Red** background = Sundays

#### C. Legend Display
- [ ] Legend is visible at top of calendar
- [ ] All 5 holiday types are shown in legend
- [ ] Legend colors match actual holiday badges

#### D. October 2025 Holidays to Verify
**Expected Holidays:**
- [ ] **Oct 2** - Gandhi Jayanti (National - Orange)
- [ ] **Oct 2** - Dussehra (Festival - Pink)
- [ ] **Oct 21** - Diwali (Festival - Pink)
- [ ] **Oct 22** - Govardhan Puja (Religious - Purple) [Optional]
- [ ] **Oct 23** - Bhai Dooj (Festival - Pink) [Optional]

**Sundays in October 2025:**
- [ ] **Oct 5** (Today!) - Should have red background + "Sunday" label
- [ ] **Oct 12** - Should have red background + "Sunday" label
- [ ] **Oct 19** - Should have red background + "Sunday" label
- [ ] **Oct 26** - Should have red background + "Sunday" label

#### E. Date Selection Tests
- [ ] Click on **Oct 2** (Gandhi Jayanti + Dussehra)
- [ ] Selected date section should show:
  - Both holiday badges (National + Festival)
  - Holiday names displayed
  - "This is a holiday" message if no events
  
- [ ] Click on a Sunday (Oct 5, 12, 19, or 26)
- [ ] Should show:
  - "Sunday" badge
  - Red background
  - "This is a Sunday" message

- [ ] Click on a regular working day
- [ ] Should NOT show any holiday badges or warnings

#### F. Navigation Tests
- [ ] Click "Previous Month" button → Should go to September 2025
- [ ] Verify September holidays appear (Ganesh Chaturthi - Sept 5)
- [ ] Click "Next Month" button → Should go back to October
- [ ] Navigate to November → Should show Guru Nanak Jayanti (Nov 5)
- [ ] Navigate to December → Should show Christmas (Dec 25)

### 2. Calendar Components Tests

#### A. Upcoming Holidays Component
Navigate to dashboard or page with UpcomingHolidays component:
- [ ] Shows next 5 upcoming holidays from today
- [ ] Each holiday displays:
  - Holiday name
  - Date in readable format
  - Type badge with correct color
- [ ] Holidays are in chronological order

#### B. Holiday Calendar Component
If used in dashboard:
- [ ] Displays holiday calendar view
- [ ] Shows placeholder or actual calendar

#### C. Indian Holiday Calendar Component
Navigate to `/calendar-demo` (if exists):
- [ ] Full month view with all holidays
- [ ] Month navigation works
- [ ] Holidays display with truncated names
- [ ] Color coding matches

### 3. Holiday Service Tests

Create a test console check:
```javascript
// In browser console
import HolidayService from '@/services/holiday-service';

// Test upcoming holidays
console.log('Upcoming Holidays:', HolidayService.getUpcomingHolidays(5));

// Test if today is Sunday
console.log('Is Today Sunday?', HolidayService.isSunday(new Date()));

// Test if Oct 2 is holiday
console.log('Oct 2 Holiday:', HolidayService.getHolidayByDate(new Date('2025-10-02')));

// Test working days count
console.log('Working Days Oct 1-31:', 
  HolidayService.countWorkingDays(
    new Date('2025-10-01'), 
    new Date('2025-10-31')
  )
);
```

Expected Results:
- [ ] Returns upcoming holidays array
- [ ] Correctly identifies if today (Oct 5) is Sunday
- [ ] Returns Gandhi Jayanti for Oct 2
- [ ] Working days calculation excludes Sundays and holidays

### 4. Visual Quality Tests

#### A. Responsive Design
- [ ] Calendar looks good on desktop (1920x1080)
- [ ] Calendar adapts to tablet view (768px)
- [ ] Mobile view is readable (375px)

#### B. Color Contrast
- [ ] Holiday badges are readable
- [ ] Text on colored backgrounds has good contrast
- [ ] Sunday red background doesn't obscure text

#### C. Hover States
- [ ] Calendar cells have hover effect
- [ ] Holiday badges show full name on hover
- [ ] Interactive elements have visual feedback

### 5. Performance Tests

- [ ] Calendar renders quickly (< 1 second)
- [ ] Month navigation is smooth
- [ ] No lag when clicking dates
- [ ] No console errors in browser DevTools

### 6. Integration Tests

#### A. With Events
- [ ] Can still create events on regular days
- [ ] Can create events on holidays (with warning)
- [ ] Events display alongside holiday badges
- [ ] Selecting a date with both event and holiday shows both

#### B. With Filters
- [ ] List view still works
- [ ] Switching between calendar and list view works
- [ ] Filters don't affect holiday display

---

## 🐛 Known Issues / Expected Behavior

### Expected Behaviors:
1. **Multiple holidays on same date** (Oct 2 has both Gandhi Jayanti and Dussehra)
   - Should show both badges or the first one with a truncated name
   
2. **Optional Holidays** (marked with isOptional flag)
   - Display the same as regular holidays
   - Future enhancement: could have different styling

3. **Holidays only for 2025**
   - If you navigate to 2024 or 2026, no holidays will show
   - This is expected as we only loaded 2025 holidays

### Report Issues:
If you find any bugs, note:
- [ ] What page/component
- [ ] What you did
- [ ] Expected vs actual result
- [ ] Browser console errors (if any)

---

## 📸 Visual Test Checklist

Take screenshots of:
1. ✅ Calendar view showing October 2025 with holidays
2. ✅ Sunday cell with red background and label
3. ✅ Oct 2 showing multiple holidays
4. ✅ Selected date section showing holiday info
5. ✅ Legend display
6. ✅ Upcoming holidays component (if visible)

---

## ✅ Success Criteria

Test is successful if:
- ✅ All holidays display correctly
- ✅ Sundays are highlighted
- ✅ Legend is visible and accurate
- ✅ Date selection shows holiday info
- ✅ No console errors
- ✅ Calendar is responsive
- ✅ Navigation works smoothly

---

## 🚀 Quick Test Steps (5 minutes)

1. Open http://localhost:8083/events
2. Verify October 2025 calendar loads
3. Check Oct 2 shows Gandhi Jayanti (orange) and Dussehra (pink)
4. Check Oct 5 (today) shows Sunday (red background)
5. Click on Oct 2, verify holiday badges appear in header
6. Navigate to November, verify Guru Nanak Jayanti appears
7. Switch to List view and back to Calendar view
8. Check browser console - should be error-free

**If all these pass → ✅ TEST SUCCESSFUL!**

---

## 📝 Test Results

**Date Tested:** October 5, 2025
**Tester:** _______________
**Browser:** Chrome / Firefox / Safari / Edge
**Status:** ⬜ Pass | ⬜ Fail | ⬜ Partial

**Notes:**
_________________________________
_________________________________
_________________________________
