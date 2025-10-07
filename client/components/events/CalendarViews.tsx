import React from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay, startOfDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  event_type: string;
  venue: string;
  department_name: string;
  status: 'pending' | 'approved' | 'rejected';
  event_color?: string;
  is_recurring?: boolean;
  max_participants?: number;
  current_participants?: number;
}

interface CalendarViewsProps {
  view: 'day' | 'week' | 'agenda';
  currentDate: Date;
  events: EventData[];
  onEventClick?: (event: EventData) => void;
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

export function DayView({ currentDate, events, onEventClick }: { currentDate: Date; events: EventData[]; onEventClick?: (event: EventData) => void }) {
  const dayEvents = events.filter(event => isSameDay(new Date(event.date), currentDate));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h3>
        <div className="space-y-2">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => {
              const eventHour = parseInt(event.start_time.split(':')[0]);
              return eventHour === hour;
            });

            return (
              <div key={hour} className="flex gap-4 border-b pb-2">
                <div className="w-20 text-sm text-muted-foreground font-medium">
                  {format(new Date().setHours(hour, 0), 'h:mm a')}
                </div>
                <div className="flex-1 space-y-2">
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className="p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow"
                      style={{ borderLeftColor: event.event_color || '#3B82F6' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{event.is_recurring && '🔄 '}{event.title}</h4>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>
                        <Badge className={STATUS_COLORS[event.status]}>{event.status}</Badge>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.start_time} - {event.end_time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.venue}
                        </div>
                        {event.max_participants && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.current_participants || 0}/{event.max_participants}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function WeekView({ currentDate, events, onEventClick }: { currentDate: Date; events: EventData[]; onEventClick?: (event: EventData) => void }) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 9 PM

  return (
    <Card>
      <CardContent className="p-4 overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-2 mb-4">
            <div className="text-sm font-medium text-muted-foreground">Time</div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className="text-center">
                <div className="text-sm font-medium">{format(day, 'EEE')}</div>
                <div className={cn(
                  "text-2xl font-bold",
                  isSameDay(day, new Date()) && "text-primary"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-8 gap-2">
                <div className="text-xs text-muted-foreground py-2">
                  {format(new Date().setHours(hour, 0), 'h:mm a')}
                </div>
                {weekDays.map(day => {
                  const dayEvents = events.filter(event => {
                    const eventDate = new Date(event.date);
                    const eventHour = parseInt(event.start_time.split(':')[0]);
                    return isSameDay(eventDate, day) && eventHour === hour;
                  });

                  return (
                    <div key={day.toISOString()} className="min-h-[60px] border border-border rounded p-1">
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          onClick={() => onEventClick?.(event)}
                          className="text-xs p-1 rounded mb-1 cursor-pointer hover:shadow-sm transition-shadow truncate"
                          style={{ 
                            backgroundColor: `${event.event_color || '#3B82F6'}20`,
                            borderLeft: `3px solid ${event.event_color || '#3B82F6'}`
                          }}
                          title={event.title}
                        >
                          {event.is_recurring && '🔄 '}{event.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AgendaView({ events, onEventClick }: { events: EventData[]; onEventClick?: (event: EventData) => void }) {
  const upcomingEvents = events
    .filter(event => new Date(event.date) >= startOfDay(new Date()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 20);

  const groupedEvents = upcomingEvents.reduce((acc, event) => {
    const dateKey = format(new Date(event.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, EventData[]>);

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => (
            <div key={dateKey}>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3 sticky top-0 bg-background py-2">
                {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
              </h4>
              <div className="space-y-2">
                {dateEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow bg-card"
                    style={{ borderLeftColor: event.event_color || '#3B82F6' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h5 className="font-semibold text-base">
                          {event.is_recurring && '🔄 '}{event.title}
                        </h5>
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      </div>
                      <Badge className={STATUS_COLORS[event.status]}>{event.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {event.start_time} - {event.end_time}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.venue}
                      </div>
                      <div className="text-sm">
                        {event.department_name}
                      </div>
                      {event.max_participants && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.current_participants || 0}/{event.max_participants}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {upcomingEvents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No upcoming events</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CalendarViews({ view, currentDate, events, onEventClick }: CalendarViewsProps) {
  switch (view) {
    case 'day':
      return <DayView currentDate={currentDate} events={events} onEventClick={onEventClick} />;
    case 'week':
      return <WeekView currentDate={currentDate} events={events} onEventClick={onEventClick} />;
    case 'agenda':
      return <AgendaView events={events} onEventClick={onEventClick} />;
    default:
      return null;
  }
}
