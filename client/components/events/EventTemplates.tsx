import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Zap, Copy, Sparkles, Calendar, Clock, MapPin, Users,
  GraduationCap, Presentation, Coffee, BookOpen, Award, Briefcase
} from 'lucide-react';
import { addDays, addHours, setHours, setMinutes, format } from 'date-fns';

export interface EventTemplate {
  id: string;
  name: string;
  icon: any;
  event_type: string;
  duration_hours: number;
  default_venue?: string;
  default_participants?: number;
  color: string;
  description_template?: string;
}

const DEFAULT_TEMPLATES: EventTemplate[] = [
  {
    id: 'workshop',
    name: 'Workshop',
    icon: GraduationCap,
    event_type: 'workshop',
    duration_hours: 3,
    default_venue: 'Seminar Hall',
    default_participants: 50,
    color: '#3B82F6',
    description_template: 'Hands-on workshop session on [TOPIC]'
  },
  {
    id: 'seminar',
    name: 'Seminar',
    icon: Presentation,
    event_type: 'seminar',
    duration_hours: 2,
    default_venue: 'Auditorium',
    default_participants: 100,
    color: '#10B981',
    description_template: 'Guest seminar on [TOPIC]'
  },
  {
    id: 'meeting',
    name: 'Team Meeting',
    icon: Coffee,
    event_type: 'meeting',
    duration_hours: 1,
    default_venue: 'Conference Room',
    default_participants: 15,
    color: '#F59E0B',
    description_template: 'Team meeting to discuss [TOPIC]'
  },
  {
    id: 'lecture',
    name: 'Guest Lecture',
    icon: BookOpen,
    event_type: 'guest_lecture',
    duration_hours: 1.5,
    default_venue: 'Classroom',
    default_participants: 60,
    color: '#8B5CF6',
    description_template: 'Guest lecture by [SPEAKER] on [TOPIC]'
  },
  {
    id: 'competition',
    name: 'Competition',
    icon: Award,
    event_type: 'competition',
    duration_hours: 4,
    default_venue: 'Lab Complex',
    default_participants: 80,
    color: '#EF4444',
    description_template: '[NAME] competition - [TOPIC]'
  },
  {
    id: 'orientation',
    name: 'Orientation',
    icon: Briefcase,
    event_type: 'orientation',
    duration_hours: 2,
    default_venue: 'Auditorium',
    default_participants: 200,
    color: '#06B6D4',
    description_template: 'Orientation program for [BATCH/YEAR]'
  }
];

interface EventTemplatePickerProps {
  onSelectTemplate: (template: EventTemplate) => void;
}

export function EventTemplatePicker({ onSelectTemplate }: EventTemplatePickerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Event Templates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {DEFAULT_TEMPLATES.map(template => {
            const Icon = template.icon;
            return (
              <Button
                key={template.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => onSelectTemplate(template)}
              >
                <Icon className="h-6 w-6" />
                <span className="font-medium">{template.name}</span>
                <Badge variant="outline" className="text-xs">
                  {template.duration_hours}h
                </Badge>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickAddEvent {
  title: string;
  date: Date;
  time: string;
}

export function parseNaturalLanguage(input: string): QuickAddEvent | null {
  const lower = input.toLowerCase().trim();
  
  // Patterns
  const patterns = [
    // "Workshop tomorrow 2pm" or "Meeting tomorrow at 14:00"
    /^(.+?)\s+(tomorrow|today)\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i,
    // "Seminar next monday 10am"
    /^(.+?)\s+next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i,
    // "Meeting on 15th at 3pm"
    /^(.+?)\s+on\s+(\d{1,2})(?:st|nd|rd|th)?\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i,
  ];

  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      let title = match[1].trim();
      let date = new Date();
      let hour = parseInt(match[3] || match[4] || '9');
      const minute = match[4] ? parseInt(match[4]) : 0;
      const meridiem = match[5];

      // Handle AM/PM
      if (meridiem === 'pm' && hour < 12) hour += 12;
      if (meridiem === 'am' && hour === 12) hour = 0;

      // Handle relative dates
      if (match[2] === 'tomorrow') {
        date = addDays(date, 1);
      } else if (match[2] === 'today') {
        // Already today
      } else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(match[2])) {
        // Find next occurrence of that day
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDay = days.indexOf(match[2]);
        const currentDay = date.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        date = addDays(date, daysToAdd);
      } else if (match[2]) {
        // Handle day of month
        const day = parseInt(match[2]);
        date.setDate(day);
        if (date < new Date()) {
          date.setMonth(date.getMonth() + 1);
        }
      }

      date = setHours(setMinutes(date, minute), hour);

      return {
        title: title.charAt(0).toUpperCase() + title.slice(1),
        date,
        time: format(date, 'HH:mm')
      };
    }
  }

  return null;
}

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated: (event: QuickAddEvent) => void;
}

export function QuickAddDialog({ open, onOpenChange, onEventCreated }: QuickAddDialogProps) {
  const [input, setInput] = useState('');
  const [parsedEvent, setParsedEvent] = useState<QuickAddEvent | null>(null);

  const handleInputChange = (value: string) => {
    setInput(value);
    const parsed = parseNaturalLanguage(value);
    setParsedEvent(parsed);
  };

  const handleCreate = () => {
    if (parsedEvent) {
      onEventCreated(parsedEvent);
      setInput('');
      setParsedEvent(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Quick Add Event
          </DialogTitle>
          <DialogDescription>
            Type naturally like "Workshop tomorrow 2pm" or "Meeting next Monday at 10am"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="e.g., Team meeting tomorrow 3pm"
              className="text-lg"
              autoFocus
            />
          </div>

          {parsedEvent && (
            <Card className="bg-accent/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{parsedEvent.title}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{format(parsedEvent.date, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{parsedEvent.time}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Examples:</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• "Workshop tomorrow 2pm"</p>
              <p>• "Meeting next Monday 10am"</p>
              <p>• "Seminar on 15th at 3:30pm"</p>
              <p>• "Lecture today at 11am"</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!parsedEvent}>
              Create Event
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function duplicateEvent(event: any): any {
  return {
    ...event,
    id: Date.now().toString(),
    title: `${event.title} (Copy)`,
    status: 'pending',
    created_at: new Date().toISOString()
  };
}
