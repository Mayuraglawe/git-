# 🚀 Quick Start Guide - Holiday Calendar

## For Students & Faculty

### Where to Find It
1. **Main Dashboard** - Login and see the calendar on your home page
2. **Department Dashboard** - View your department-specific dashboard
3. **Demo Page** - Visit `/calendar-demo` for full feature showcase

### How to Use

#### Check Today's Status
- Look at the calendar - **RED = Holiday/Sunday**
- Green badge = Working day
- Red badge = Holiday/Sunday

#### Plan Your Schedule
1. Click on any date to see if it's a holiday
2. Check the "Upcoming Holidays" widget for next holidays
3. Use the countdown to plan ahead

#### Understand Holidays
- 🇮🇳 National Holidays (Republic Day, Independence Day, Gandhi Jayanti)
- 🕉️ Religious Festivals (Diwali, Holi, Eid, Christmas, etc.)
- 📅 Observances (New Year, Labour Day)
- ⚠️ Restricted Holidays

---

## For Developers

### Installation
Already installed! No extra dependencies needed.

### Basic Usage

```tsx
// 1. Import components
import HolidayCalendar from '@/components/calendar/HolidayCalendar';
import UpcomingHolidays from '@/components/calendar/UpcomingHolidays';
import HolidayService from '@/services/holiday-service';

// 2. Use in your component
function MyPage() {
  return (
    <div>
      <HolidayCalendar />
      <UpcomingHolidays count={5} />
    </div>
  );
}

// 3. Check holidays programmatically
const isHoliday = HolidayService.isHoliday('2025-01-26');
const upcoming = HolidayService.getUpcomingHolidays(new Date(), 10);
```

### Key Files
- **Data**: `client/lib/indian-holidays-2025.ts`
- **Service**: `client/services/holiday-service.ts`
- **Components**: `client/components/calendar/*.tsx`

### Common Tasks

#### Add a New Holiday
```typescript
// In indian-holidays-2025.ts
{
  date: '2025-XX-XX',
  name: 'Holiday Name',
  description: 'Description here',
  type: 'national', // or 'religious', 'observance', 'restricted'
  religion: 'secular' // optional
}
```

#### Check if Date is Holiday
```typescript
if (HolidayService.isNonWorkingDay(myDate)) {
  alert('This is a holiday or Sunday!');
}
```

#### Get Working Days in Month
```typescript
const workingDays = HolidayService.getWorkingDaysInMonth(2025, 0); // January 2025
```

---

## For Timetable Creators

### Before Scheduling
```typescript
import HolidayService from '@/services/holiday-service';

// Check if date is available
const scheduleDate = new Date('2025-01-26');
if (HolidayService.isNonWorkingDay(scheduleDate)) {
  const what = HolidayService.getDateSummary(scheduleDate);
  alert(`Cannot schedule: ${what}`);
}
```

### Semester Planning
```typescript
// Get all holidays in semester
const holidays = HolidayService.getHolidaysInRange(
  '2025-07-01', // Semester start
  '2025-11-30'  // Semester end
);

console.log(`Semester has ${holidays.length} holidays`);

// Calculate working days
const workingDays = HolidayService.getWorkingDaysInMonth(2025, 6); // July
```

---

## Quick Reference

### Service Methods (Most Used)
```typescript
// Date Checking
HolidayService.isHoliday(date)        // Is it a holiday?
HolidayService.isSunday(date)         // Is it Sunday?
HolidayService.isNonWorkingDay(date)  // Is it holiday OR Sunday?

// Get Data
HolidayService.getHoliday(date)                     // Get holiday details
HolidayService.getUpcomingHolidays(date, count)     // Next N holidays
HolidayService.getHolidaysInMonth(year, month)      // Month's holidays
HolidayService.getWorkingDaysInMonth(year, month)   // Working days

// Utility
HolidayService.getDateSummary(date)   // "Sunday" or "Diwali" or "Sunday, Diwali"
HolidayService.getDaysUntilHoliday(holiday)  // Days remaining
```

### Components
```tsx
// Full calendar
<HolidayCalendar />

// Compact for dashboards
<HolidayCalendar compact />

// Upcoming holidays
<UpcomingHolidays count={10} />

// Holiday indicator
<HolidayIndicator date={myDate} variant="badge" />
<HolidayIndicator date={myDate} variant="alert" showDescription />

// Quick reference
<QuickHolidayRef />
```

---

## Color Guide

- 🔴 **RED** = Holiday or Sunday (non-working day)
- 🟢 **GREEN** = Working day
- 🟡 **ORANGE** = Holiday coming soon
- 🔵 **BLUE** = Information

---

## Examples

### Example 1: Show Today's Status
```tsx
import QuickHolidayRef from '@/components/calendar/QuickHolidayRef';

<QuickHolidayRef />
```

### Example 2: Check Before Scheduling
```tsx
function ScheduleForm() {
  const [date, setDate] = useState(new Date());
  const isNonWorking = HolidayService.isNonWorkingDay(date);
  
  return (
    <div>
      <DatePicker value={date} onChange={setDate} />
      {isNonWorking && (
        <HolidayIndicator date={date} variant="alert" />
      )}
    </div>
  );
}
```

### Example 3: Semester Statistics
```tsx
function SemesterStats({ startDate, endDate }) {
  const holidays = HolidayService.getHolidaysInRange(startDate, endDate);
  
  return (
    <div>
      <h3>Semester Overview</h3>
      <p>Total Holidays: {holidays.length}</p>
      <HolidayRangeWarning startDate={startDate} endDate={endDate} />
    </div>
  );
}
```

---

## Need Help?

1. **Demo Page**: Go to `/calendar-demo` to see all features
2. **Documentation**: Read `HOLIDAY_CALENDAR_README.md`
3. **Implementation**: Check `INDIAN_HOLIDAY_CALENDAR_IMPLEMENTATION.md`
4. **Support**: Contact the development team

---

## Key Features Summary

✅ **40+ Indian Holidays** for 2025  
✅ **Visual Calendar** with red highlighting  
✅ **Upcoming Holidays** widget with countdown  
✅ **20+ Utility Methods** for holiday checking  
✅ **Multiple Display Variants** (badge, alert, inline)  
✅ **Responsive Design** (mobile, tablet, desktop)  
✅ **Cultural Sensitivity** (multi-religion support)  
✅ **Production Ready** (tested and documented)  

---

**You're all set! Start using the holiday calendar now! 🎉**
