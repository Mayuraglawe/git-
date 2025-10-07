# Indian Holidays Calendar Integration - Event Page Update

## Overview
The Event page calendar has been updated to display Indian holidays and Sundays according to the Indian calendar for 2025.

## Changes Made

### 1. Created Indian Holidays Data File
**File**: `client/data/indianHolidays.ts`

This file contains:
- Complete list of Indian holidays for 2025 including:
  - National holidays (Republic Day, Independence Day, Gandhi Jayanti, etc.)
  - Religious holidays (Diwali, Holi, Eid, Christmas, etc.)
  - Festival holidays (Ganesh Chaturthi, Dussehra, etc.)
  - State holidays (Maharashtra Day, etc.)

- Helper functions:
  - `isSunday(date)` - Check if a date is Sunday
  - `isHoliday(date)` - Check if a date is a holiday
  - `getHolidayByDate(dateStr)` - Get holiday details by date
  - `isWorkingDay(date)` - Check if a date is a working day
  - `getHolidaysInMonth(year, month)` - Get all holidays in a month
  - `getHolidayColor(type)` - Get color scheme based on holiday type

### 2. Updated EventCalendar Component
**File**: `client/components/events/EventCalendar.tsx`

Updates include:
- **Import**: Added Indian holidays utility functions
- **Visual Indicators**: 
  - Sundays are highlighted with a light red background and "Sunday" label
  - Holidays are highlighted with color-coded badges showing the holiday name
  - Holiday types have different colors:
    - **Orange**: National holidays
    - **Pink**: Festivals
    - **Purple**: Religious holidays
    - **Blue**: State holidays
    - **Red**: Sundays

- **Calendar Legend**: Added a color legend at the top of the calendar to explain holiday types
- **Selected Date Display**: When clicking on a date, the header now shows if it's a Sunday or holiday with appropriate badges
- **Holiday Information**: The selected date section displays holiday information and warnings when selecting holidays or Sundays

## Visual Features

### Calendar Grid
- Each day cell shows:
  1. Date number (in red if holiday/Sunday)
  2. Sunday indicator (if Sunday)
  3. Holiday badge with name (if holiday)
  4. Event badges (existing functionality)

### Color Coding
- **National Holidays**: Orange badge (`Republic Day`, `Independence Day`, etc.)
- **Festivals**: Pink badge (`Diwali`, `Holi`, `Ganesh Chaturthi`, etc.)
- **Religious Holidays**: Purple badge (`Eid`, `Christmas`, `Janmashtami`, etc.)
- **State Holidays**: Blue badge (`Maharashtra Day`)
- **Sundays**: Red background with "Sunday" label

### Selected Date Details
When a date is clicked:
- Header shows badges for Sunday/Holiday
- If no events, displays a message indicating it's a holiday/Sunday
- Events are still shown if scheduled on holidays/Sundays

## Holidays Included (2025)

### National Holidays
- January 1: New Year's Day
- January 26: Republic Day
- April 14: Dr. B.R. Ambedkar Jayanti
- May 1: May Day / Maharashtra Day
- August 15: Independence Day
- October 2: Gandhi Jayanti
- December 25: Christmas

### Major Festivals & Religious Days
- January 14: Makar Sankranti
- February 26: Maha Shivaratri
- March 14: Holi
- March 30: Eid-ul-Fitr
- April 18: Ram Navami
- June 6: Eid-ul-Adha
- August 27: Janmashtami
- September 5: Ganesh Chaturthi
- October 2: Dussehra
- October 21: Diwali
- November 5: Guru Nanak Jayanti
- And many more...

## Usage
The calendar automatically displays all holidays and Sundays. No additional configuration is needed. Simply navigate to the Events page and view the calendar to see:
1. All scheduled events
2. Indian holidays marked with colored badges
3. Sundays highlighted in red
4. Complete holiday information when clicking on dates

## Benefits
- Better planning: Users can see holidays and Sundays at a glance
- Avoid conflicts: Prevents scheduling events on holidays/Sundays unintentionally
- Cultural awareness: Shows all major Indian festivals and holidays
- Visual clarity: Color-coded system makes it easy to distinguish holiday types
- Comprehensive: Includes national, religious, festival, and state holidays

## Future Enhancements
Potential improvements for future versions:
- Add holidays for multiple years
- Allow filtering by holiday type
- Add regional holiday customization
- Export holiday calendar
- Holiday reminder notifications
