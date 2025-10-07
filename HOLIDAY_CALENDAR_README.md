# 📅 Indian Holiday Calendar System

A comprehensive holiday calendar system designed specifically for Indian academic institutions, integrated into the Py-Gram smart classroom application.

## 🌟 Features

### Visual Calendar
- **Interactive monthly view** with full navigation
- **Red highlighting** for all holidays and Sundays
- **Click to view details** - holiday name, description, type, and religious affiliation
- **Today indicator** with prominent highlight
- **Working days calculator** - shows productive days in the month
- **Compact mode** for sidebar/dashboard integration

### Upcoming Holidays Widget
- **Smart countdown** - Shows "Today", "Tomorrow", or days/weeks/months remaining
- **Color-coded urgency** - Red for today, orange for soon, blue for later
- **Rich information** - Full descriptions, types, and religious context
- **Emoji indicators** - 🇮🇳 National, 🕉️ Religious, 📅 Observance
- **Configurable count** - Show 5, 10, or any number of upcoming holidays

### Holiday Indicators
Three display variants for different use cases:
- **Badge** - Compact red badge with holiday name
- **Alert** - Full alert box with detailed description
- **Inline** - Small inline text with icon

### Quick Reference Card
- **Today's status** - Working day or holiday
- **Next holiday** - Name and countdown
- **Compact design** - Perfect for sidebars

## 📂 Project Structure

```
client/
├── lib/
│   └── indian-holidays-2025.ts          # Holiday data (2025-2026)
├── services/
│   └── holiday-service.ts               # Utility functions
├── components/
│   └── calendar/
│       ├── HolidayCalendar.tsx          # Main calendar component
│       ├── UpcomingHolidays.tsx         # Upcoming holidays widget
│       ├── HolidayIndicator.tsx         # Indicator variants
│       └── QuickHolidayRef.tsx          # Quick reference card
└── pages/
    └── CalendarDemo.tsx                 # Demo & documentation page
```

## 🚀 Quick Start

### 1. Import Components

```tsx
import HolidayCalendar from '@/components/calendar/HolidayCalendar';
import UpcomingHolidays from '@/components/calendar/UpcomingHolidays';
import HolidayIndicator from '@/components/calendar/HolidayIndicator';
import QuickHolidayRef from '@/components/calendar/QuickHolidayRef';
import HolidayService from '@/services/holiday-service';
```

### 2. Use Calendar Components

```tsx
// Full calendar
<HolidayCalendar />

// Compact calendar for dashboards
<HolidayCalendar compact />

// Upcoming holidays (default 8)
<UpcomingHolidays />

// Custom count
<UpcomingHolidays count={15} />

// Quick reference
<QuickHolidayRef />
```

### 3. Use Holiday Service

```tsx
// Check if date is holiday
const isHoliday = HolidayService.isHoliday('2025-01-26');  // true

// Check if date is Sunday
const isSunday = HolidayService.isSunday(new Date());

// Check if non-working day (Sunday OR holiday)
const isNonWorking = HolidayService.isNonWorkingDay('2025-10-20');

// Get holiday details
const holiday = HolidayService.getHoliday('2025-01-26');
console.log(holiday?.name);  // "Republic Day"

// Get upcoming holidays
const next10 = HolidayService.getUpcomingHolidays(new Date(), 10);

// Get holidays in a month
const janHolidays = HolidayService.getHolidaysInMonth(2025, 0);  // 0 = January

// Get working days
const workingDays = HolidayService.getWorkingDaysInMonth(2025, 0);

// Get all Sundays
const sundays = HolidayService.getSundaysInMonth(2025, 0);

// Get holidays in date range
const semesterHolidays = HolidayService.getHolidaysInRange(
  '2025-07-01', 
  '2025-11-30'
);
```

### 4. Display Holiday Indicators

```tsx
// Badge variant
<HolidayIndicator date="2025-01-26" variant="badge" />

// Alert with description
<HolidayIndicator 
  date="2025-10-20" 
  variant="alert" 
  showDescription 
/>

// Inline text
<HolidayIndicator date="2025-08-15" variant="inline" />

// Range warning
<HolidayRangeWarning 
  startDate="2025-07-01" 
  endDate="2025-11-30" 
/>
```

## 📊 Included Holidays (2025)

### National Holidays (3)
- **Jan 26** - Republic Day
- **Aug 15** - Independence Day
- **Oct 2** - Gandhi Jayanti

### Major Religious Festivals
- **Hindu**: Makar Sankranti, Maha Shivaratri, Holi, Ram Navami, Janmashtami, Dussehra, Diwali (3 days)
- **Muslim**: Eid-ul-Fitr, Eid-ul-Adha, Muharram, Milad-un-Nabi
- **Christian**: Good Friday, Christmas
- **Sikh**: Baisakhi, Guru Nanak Jayanti
- **Buddhist**: Buddha Purnima
- **Jain**: Mahavir Jayanti

### State & Regional
- Lohri, Pongal, Ugadi, Gudi Padwa, Parsi New Year, and more

### Observances
- New Year's Day, Labour Day, Ambedkar Jayanti

## 🎨 Design System

### Colors
```css
/* Holidays & Sundays */
--holiday-red: #dc2626;          /* Red-600 */
--holiday-bg: #fef2f2;           /* Red-50 */

/* Types */
--national: #dc2626;             /* Red-600 */
--religious: #f97316;            /* Orange-500 */
--observance: #3b82f6;           /* Blue-500 */
--restricted: #6b7280;           /* Gray-500 */

/* Status */
--today: #3b82f6;                /* Blue-600 */
--soon: #f97316;                 /* Orange-500 */
--working: #16a34a;              /* Green-600 */
```

### Typography
- Calendar dates: `font-medium`
- Holiday names: `font-semibold`
- Descriptions: `text-sm text-muted-foreground`

## 🔧 API Reference

### HolidayService

#### Date Checking Methods
```typescript
isSunday(date: Date | string): boolean
isHoliday(date: Date | string): boolean
isNonWorkingDay(date: Date | string): boolean
```

#### Holiday Retrieval
```typescript
getHoliday(date: Date | string): Holiday | null
getHolidaysInMonth(year: number, month: number): Holiday[]
getHolidaysInYear(year: number): Holiday[]
getUpcomingHolidays(fromDate?: Date, count?: number): Holiday[]
getHolidaysInRange(startDate: Date | string, endDate: Date | string): Holiday[]
```

#### Filtering Methods
```typescript
getHolidaysByType(type: 'national' | 'religious' | 'observance' | 'restricted'): Holiday[]
getHolidaysByReligion(religion: 'hindu' | 'muslim' | 'christian' | 'sikh' | 'buddhist' | 'jain' | 'secular'): Holiday[]
getNationalHolidays(): Holiday[]
```

#### Utility Methods
```typescript
getDaysUntilHoliday(holiday: Holiday, fromDate?: Date): number
getDateSummary(date: Date | string): string
getSundaysInMonth(year: number, month: number): Date[]
getWorkingDaysInMonth(year: number, month: number): number
hasHolidaysInRange(startDate: Date | string, endDate: Date | string): boolean
```

### Holiday Interface
```typescript
interface Holiday {
  date: string;        // ISO format: YYYY-MM-DD
  name: string;        // Holiday name
  description: string; // Full description
  type: 'national' | 'religious' | 'observance' | 'restricted';
  religion?: 'hindu' | 'muslim' | 'christian' | 'sikh' | 'buddhist' | 'jain' | 'secular';
}
```

## 📱 Responsive Behavior

### Desktop (≥1024px)
- Side-by-side calendar and upcoming holidays
- Full-size calendar grid (7x6)
- Expanded holiday descriptions

### Tablet (768px - 1023px)
- Stacked layout
- Compact calendar
- Truncated descriptions

### Mobile (<768px)
- Single column
- Compact mode enabled
- Touch-friendly interactions

## 🎯 Use Cases

### For Students
```tsx
// Check if today is a holiday
const canStudy = !HolidayService.isNonWorkingDay(new Date());

// Plan study schedule
const workingDays = HolidayService.getWorkingDaysInMonth(2025, 0);
const hoursAvailable = workingDays * 6; // 6 hours per day
```

### For Faculty
```tsx
// Get semester holidays
const semesterHolidays = HolidayService.getHolidaysInRange(
  semesterStart,
  semesterEnd
);

// Calculate teaching days
const totalDays = daysInSemester;
const holidays = semesterHolidays.length;
const sundays = Math.floor(totalDays / 7);
const teachingDays = totalDays - holidays - sundays;
```

### For Timetable Creators
```tsx
// Warn if scheduling on holiday
const scheduleDate = new Date('2025-01-26');
if (HolidayService.isNonWorkingDay(scheduleDate)) {
  const summary = HolidayService.getDateSummary(scheduleDate);
  alert(`Warning: ${summary}`);
}
```

## 🌐 Data Sources

1. **Government of India Official Calendar**
   - National holidays
   - Gazetted holidays

2. **Google Calendar - India Holidays**
   - Regional variations
   - Religious festivals

3. **Community Verification**
   - Cross-referenced with multiple sources
   - Regular updates

## ⚙️ Configuration

### Customize Holiday List

Edit `client/lib/indian-holidays-2025.ts`:

```typescript
export const CUSTOM_HOLIDAYS: Holiday[] = [
  {
    date: '2025-XX-XX',
    name: 'Institution Foundation Day',
    description: 'Annual celebration',
    type: 'observance',
    religion: 'secular'
  },
  // Add more...
];

export const ALL_HOLIDAYS = [
  ...INDIAN_HOLIDAYS_2025,
  ...INDIAN_HOLIDAYS_2026,
  ...CUSTOM_HOLIDAYS
];
```

### Customize Colors

In your CSS/Tailwind config:

```css
.holiday-date {
  @apply bg-red-50 text-red-600 font-semibold;
}

.holiday-indicator {
  @apply border-red-300 bg-red-50;
}
```

## 🧪 Testing

### Test Holiday Detection
```typescript
// Test Republic Day
console.assert(
  HolidayService.isHoliday('2025-01-26'),
  'Republic Day should be detected'
);

// Test working day
console.assert(
  !HolidayService.isNonWorkingDay('2025-01-27'),
  'January 27 should be a working day'
);
```

### Test Date Range
```typescript
const holidays = HolidayService.getHolidaysInRange(
  '2025-01-01',
  '2025-01-31'
);
console.log(`January 2025 has ${holidays.length} holidays`);
```

## 📈 Performance

- **Holiday lookup**: O(1) using Map
- **Range queries**: O(n) where n = total holidays
- **Month filtering**: O(h) where h = holidays in year
- **Memory**: ~50KB for 2 years of data

## 🔮 Future Enhancements

1. **Regional Customization**
   - State-specific holidays
   - Local festival dates

2. **Academic Calendar Integration**
   - Exam schedules
   - Semester breaks
   - Academic events

3. **Notifications**
   - Upcoming holiday reminders
   - Weekly schedule with holidays

4. **Export/Import**
   - iCal format export
   - Google Calendar sync
   - CSV download

5. **Multi-Year Support**
   - Extend to 5+ years
   - Historical holiday data

## 📝 License

Part of the Py-Gram project. See main LICENSE file.

## 🤝 Contributing

To add or update holidays:

1. Edit `client/lib/indian-holidays-2025.ts`
2. Follow the existing format
3. Include accurate descriptions
4. Verify dates from official sources
5. Test with HolidayService methods

## 📞 Support

For issues or questions:
- Check the demo page: `/calendar-demo`
- Review implementation docs: `INDIAN_HOLIDAY_CALENDAR_IMPLEMENTATION.md`
- Contact development team

---

**Made with ❤️ for Indian Academic Institutions**
