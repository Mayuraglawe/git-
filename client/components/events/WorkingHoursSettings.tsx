import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WorkingHours {
  enabled: boolean;
  start: string;
  end: string;
}

interface WeeklySchedule {
  monday: WorkingHours;
  tuesday: WorkingHours;
  wednesday: WorkingHours;
  thursday: WorkingHours;
  friday: WorkingHours;
  saturday: WorkingHours;
  sunday: WorkingHours;
}

interface WorkingHoursSettingsProps {
  onSave?: (schedule: WeeklySchedule) => void;
}

const DEFAULT_HOURS: WorkingHours = {
  enabled: true,
  start: '09:00',
  end: '17:00'
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<typeof DAYS[number], string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

export default function WorkingHoursSettings({ onSave }: WorkingHoursSettingsProps) {
  const [schedule, setSchedule] = useState<WeeklySchedule>({
    monday: { ...DEFAULT_HOURS },
    tuesday: { ...DEFAULT_HOURS },
    wednesday: { ...DEFAULT_HOURS },
    thursday: { ...DEFAULT_HOURS },
    friday: { ...DEFAULT_HOURS },
    saturday: { enabled: false, start: '09:00', end: '13:00' },
    sunday: { enabled: false, start: '09:00', end: '13:00' }
  });

  const [useTemplate, setUseTemplate] = useState(false);

  const updateDaySchedule = (day: typeof DAYS[number], updates: Partial<WorkingHours>) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], ...updates }
    }));
  };

  const applyTemplate = (template: 'weekdays' | 'everyday' | 'custom') => {
    if (template === 'weekdays') {
      setSchedule({
        monday: { ...DEFAULT_HOURS },
        tuesday: { ...DEFAULT_HOURS },
        wednesday: { ...DEFAULT_HOURS },
        thursday: { ...DEFAULT_HOURS },
        friday: { ...DEFAULT_HOURS },
        saturday: { enabled: false, start: '09:00', end: '13:00' },
        sunday: { enabled: false, start: '09:00', end: '13:00' }
      });
    } else if (template === 'everyday') {
      DAYS.forEach(day => {
        setSchedule(prev => ({
          ...prev,
          [day]: { ...DEFAULT_HOURS }
        }));
      });
    }
  };

  const handleSave = () => {
    onSave?.(schedule);
    // In real implementation, save to localStorage or API
    localStorage.setItem('working_hours_schedule', JSON.stringify(schedule));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Working Hours & Availability
        </CardTitle>
        <CardDescription>
          Set your working hours to receive alerts when scheduling events outside these times
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Quick Templates</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyTemplate('weekdays')}
            >
              Weekdays (Mon-Fri)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyTemplate('everyday')}
            >
              Every Day
            </Button>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Weekly Schedule</Label>
          {DAYS.map(day => (
            <div key={day} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex items-center space-x-2 w-32">
                <Switch
                  checked={schedule[day].enabled}
                  onCheckedChange={(checked) => updateDaySchedule(day, { enabled: checked })}
                />
                <Label className="font-medium">{DAY_LABELS[day]}</Label>
              </div>

              {schedule[day].enabled ? (
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">From</Label>
                    <Input
                      type="time"
                      value={schedule[day].start}
                      onChange={(e) => updateDaySchedule(day, { start: e.target.value })}
                      className="w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">To</Label>
                    <Input
                      type="time"
                      value={schedule[day].end}
                      onChange={(e) => updateDaySchedule(day, { end: e.target.value })}
                      className="w-32"
                    />
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {calculateHours(schedule[day].start, schedule[day].end)} hours
                  </Badge>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Not available</span>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Availability Alert:</strong> You'll receive warnings when creating events outside your working hours.
            Total weekly hours: <strong>{calculateTotalWeeklyHours(schedule)} hours</strong>
          </AlertDescription>
        </Alert>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Working Hours
        </Button>
      </CardContent>
    </Card>
  );
}

function calculateHours(start: string, end: string): number {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return Math.round((endMinutes - startMinutes) / 60 * 10) / 10;
}

function calculateTotalWeeklyHours(schedule: WeeklySchedule): number {
  return Object.values(schedule).reduce((total, day) => {
    if (!day.enabled) return total;
    return total + calculateHours(day.start, day.end);
  }, 0);
}

export function isWithinWorkingHours(
  date: Date,
  time: string,
  schedule: WeeklySchedule
): { isWithin: boolean; message?: string } {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[date.getDay()] as typeof DAYS[number];
  const daySchedule = schedule[dayName];

  if (!daySchedule.enabled) {
    return {
      isWithin: false,
      message: `${DAY_LABELS[dayName]} is not a working day`
    };
  }

  const [hour, minute] = time.split(':').map(Number);
  const timeMinutes = hour * 60 + minute;
  const [startHour, startMin] = daySchedule.start.split(':').map(Number);
  const [endHour, endMin] = daySchedule.end.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (timeMinutes < startMinutes || timeMinutes > endMinutes) {
    return {
      isWithin: false,
      message: `Event time ${time} is outside working hours (${daySchedule.start} - ${daySchedule.end})`
    };
  }

  return { isWithin: true };
}

export function loadWorkingHours(): WeeklySchedule | null {
  try {
    const saved = localStorage.getItem('working_hours_schedule');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}
