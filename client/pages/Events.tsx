import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Calendar as CalendarIcon, Clock, MapPin, Users, AlertTriangle, 
  CheckCircle, XCircle, Timer, Bell, Filter, Search, Eye, Edit, Trash2, List,
  Keyboard, HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import EventCalendar from '@/components/events/EventCalendar';
import EventDetailModal from '@/components/events/EventDetailModal';
import CalendarViews from '@/components/events/CalendarViews';
import WorkingHoursSettings from '@/components/events/WorkingHoursSettings';
import TaskManager from '@/components/events/TaskManager';
import { EventTemplatePicker, QuickAddDialog, duplicateEvent, parseNaturalLanguage } from '@/components/events/EventTemplates';
import { EventSharingDialog, addEventShare, getEventShares, FreeBusyViewer, calculateFreeBusySlots } from '@/components/events/EventSharing';
import type { EventShare, FreeBusySlot } from '@/components/events/EventSharing';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { sendEventNotification, scheduleEventReminders } from '@/services/telegram-event-service';

// Event types and statuses
const eventTypes = [
  { value: 'workshop', label: 'Workshop', color: 'bg-blue-100 text-blue-800' },
  { value: 'seminar', label: 'Seminar', color: 'bg-green-100 text-green-800' },
  { value: 'conference', label: 'Conference', color: 'bg-purple-100 text-purple-800' },
  { value: 'cultural', label: 'Cultural', color: 'bg-pink-100 text-pink-800' },
  { value: 'sports', label: 'Sports', color: 'bg-orange-100 text-orange-800' },
  { value: 'technical', label: 'Technical', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'orientation', label: 'Orientation', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'examination', label: 'Examination', color: 'bg-red-100 text-red-800' },
  { value: 'meeting', label: 'Meeting', color: 'bg-gray-100 text-gray-800' },
  { value: 'other', label: 'Other', color: 'bg-slate-100 text-slate-800' }
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

// Mock data
const mockDepartments = [
  { id: '1', name: 'Computer Engineering', code: 'COMP' },
  { id: '2', name: 'Mechanical Engineering', code: 'MECH' },
  { id: '3', name: 'Civil Engineering', code: 'CIVIL' },
  { id: '4', name: 'Electrical Engineering', code: 'ELEC' },
  { id: '5', name: 'Electronics & Telecommunication', code: 'E&TC' }
];

const mockClassrooms = [
  { id: '1', name: 'Auditorium', capacity: 500 },
  { id: '2', name: 'Seminar Hall 1', capacity: 100 },
  { id: '3', name: 'Conference Room A', capacity: 50 },
  { id: '4', name: 'Lab Complex', capacity: 80 }
];

const mockEvents = [
  {
    id: '1',
    title: 'AI/ML Workshop',
    description: 'Hands-on workshop on Machine Learning fundamentals',
    event_type: 'workshop',
    department_id: '1',
    department: { name: 'Computer Science & Engineering', code: 'CSE' },
    created_by: '1',
    creator: { first_name: 'Dr. John', last_name: 'Smith' },
    start_date: '2025-09-20',
    end_date: '2025-09-20',
    start_time: '09:00',
    end_time: '17:00',
    venue: 'Auditorium',
    classroom_id: '1',
    expected_participants: 200,
    status: 'approved',
    priority_level: 2,
    is_public: true,
    registration_required: true,
    max_registrations: 250,
    contact_person: 'Dr. John Smith',
    contact_email: 'john.smith@college.edu',
    created_at: '2025-09-10T10:00:00Z',
    conflict_info: { has_conflict: false, conflicting_events: [], queue_position: null }
  },
  {
    id: '2',
    title: 'Electronics Expo',
    description: 'Annual electronics exhibition by ECE department',
    event_type: 'technical',
    department_id: '2',
    department: { name: 'Electronics & Communication', code: 'ECE' },
    created_by: '2',
    creator: { first_name: 'Dr. Sarah', last_name: 'Johnson' },
    start_date: '2025-09-22',
    end_date: '2025-09-23',
    start_time: '10:00',
    end_time: '16:00',
    venue: 'Lab Complex',
    classroom_id: '4',
    expected_participants: 150,
    status: 'pending',
    priority_level: 3,
    is_public: true,
    registration_required: false,
    contact_person: 'Dr. Sarah Johnson',
    contact_email: 'sarah.johnson@college.edu',
    created_at: '2025-09-12T14:00:00Z',
    conflict_info: { has_conflict: false, conflicting_events: [], queue_position: null }
  },
  {
    id: '3',
    title: 'Cultural Night',
    description: 'Annual cultural festival',
    event_type: 'cultural',
    department_id: '1',
    department: { name: 'Computer Science & Engineering', code: 'CSE' },
    created_by: '3',
    creator: { first_name: 'Prof. Mike', last_name: 'Brown' },
    start_date: '2025-09-20',
    end_date: '2025-09-20',
    start_time: '18:00',
    end_time: '22:00',
    venue: 'Auditorium',
    classroom_id: '1',
    expected_participants: 400,
    status: 'pending',
    priority_level: 1,
    is_public: true,
    registration_required: false,
    contact_person: 'Prof. Mike Brown',
    contact_email: 'mike.brown@college.edu',
    created_at: '2025-09-13T09:00:00Z',
    conflict_info: { 
      has_conflict: true, 
      conflicting_events: ['1'], 
      queue_position: 2 
    }
  }
];

interface EventFormData {
  title: string;
  description: string;
  event_type: string;
  department_id: string;
  start_date: Date | undefined;
  end_date: Date | undefined;
  start_time: string;
  end_time: string;
  venue: string;
  classroom_id: string;
  expected_participants: number;
  budget_allocated: number;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  priority_level: number;
  is_public: boolean;
  registration_required: boolean;
  max_registrations: number;
  registration_deadline: Date | undefined;
  // Recurring events
  is_recurring: boolean;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'custom' | '';
  recurrence_end_date: Date | undefined;
  recurrence_days: number[]; // For weekly: [0-6] for Sun-Sat
  recurrence_interval: number; // Every N days/weeks/months
  // Color coding
  event_color: string;
  // Reminders
  reminders: Array<{ type: 'telegram' | 'email' | 'in-app'; minutes_before: number }>;
}

export default function Events() {
  const { hasPermission, user } = useAuth();
  const [events, setEvents] = useState(mockEvents);
  const [filteredEvents, setFilteredEvents] = useState(mockEvents);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [activeView, setActiveView] = useState<'calendar' | 'list' | 'day' | 'week' | 'agenda'>('calendar');
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  // New state for additional features
  const [isWorkingHoursOpen, setIsWorkingHoursOpen] = useState(false);
  const [isTaskManagerOpen, setIsTaskManagerOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false);
  const [eventShares, setEventShares] = useState<EventShare[]>([]);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [venueSuggestions, setVenueSuggestions] = useState<string[]>([]);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false);

  // Common event title suggestions based on event type
  const eventTitleTemplates = {
    'Workshop': ['Workshop on', 'Technical Workshop:', 'Hands-on Workshop:', 'Interactive Workshop:'],
    'Seminar': ['Seminar on', 'Guest Seminar:', 'Industry Seminar:', 'Academic Seminar:'],
    'Conference': ['Conference on', 'National Conference:', 'International Conference:', 'Annual Conference:'],
    'Webinar': ['Webinar on', 'Online Webinar:', 'Guest Webinar:', 'Expert Webinar:'],
    'Meeting': ['Meeting on', 'Department Meeting:', 'Team Meeting:', 'Review Meeting:'],
    'Exam': ['Exam:', 'Final Exam:', 'Mid-term Exam:', 'Practical Exam:'],
    'Lab': ['Lab Session:', 'Practical Lab:', 'Laboratory:', 'Lab Work:'],
    'Sports': ['Sports Event:', 'Tournament:', 'Match:', 'Championship:'],
    'Cultural': ['Cultural Event:', 'Festival:', 'Celebration:', 'Annual Day:']
  };

  // Common venue suggestions
  const commonVenues = [
    'Auditorium',
    'Seminar Hall',
    'Conference Room',
    'Classroom 101',
    'Classroom 102',
    'Classroom 201',
    'Lab 1',
    'Lab 2',
    'Computer Lab',
    'Sports Ground',
    'Library',
    'Cafeteria',
    'Main Hall',
    'Smart Classroom',
    'Online (Zoom)',
    'Online (Google Meet)',
    'Online (Teams)'
  ];

  // Helper function to capitalize first letter
  const capitalizeFirst = (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  // Handle title input with autocomplete
  const handleTitleInput = (value: string) => {
    // Capitalize first letter automatically
    const capitalizedValue = capitalizeFirst(value);
    setFormData({ ...formData, title: capitalizedValue });

    // Generate suggestions based on event type
    if (capitalizedValue.length > 0 && formData.event_type) {
      const templates = eventTitleTemplates[formData.event_type as keyof typeof eventTitleTemplates] || [];
      const filtered = templates.filter(template => 
        template.toLowerCase().includes(capitalizedValue.toLowerCase()) ||
        capitalizedValue.toLowerCase().includes(template.toLowerCase())
      );
      
      // Add existing event titles that match
      const existingTitles = events
        .filter(e => e.event_type === formData.event_type)
        .map(e => e.title)
        .filter(t => t.toLowerCase().includes(capitalizedValue.toLowerCase()))
        .slice(0, 3);
      
      setTitleSuggestions([...new Set([...filtered, ...existingTitles])].slice(0, 5));
      setShowTitleSuggestions(true);
    } else {
      setShowTitleSuggestions(false);
    }
  };

  // Handle venue input with autocomplete
  const handleVenueInput = (value: string) => {
    // Capitalize first letter automatically
    const capitalizedValue = capitalizeFirst(value);
    setFormData({ ...formData, venue: capitalizedValue });

    // Generate venue suggestions
    if (capitalizedValue.length > 0) {
      const filtered = commonVenues.filter(venue => 
        venue.toLowerCase().includes(capitalizedValue.toLowerCase())
      );
      
      // Add existing venues that match
      const existingVenues = [...new Set(events.map(e => e.venue))]
        .filter(v => v && v.toLowerCase().includes(capitalizedValue.toLowerCase()))
        .slice(0, 3);
      
      setVenueSuggestions([...new Set([...filtered, ...existingVenues])].slice(0, 5));
      setShowVenueSuggestions(true);
    } else {
      setShowVenueSuggestions(false);
    }
  };

  // Handle description input with capitalization
  const handleDescriptionInput = (value: string) => {
    // Capitalize first letter automatically
    const capitalizedValue = capitalizeFirst(value);
    setFormData({ ...formData, description: capitalizedValue });
  };

  // Helper function to send Telegram notification
  const sendTelegramNotification = async (event: any, messageType: 'created' | 'updated' | 'approved' | 'rejected' | 'queue_update') => {
    const chatId = process.env.VITE_TELEGRAM_PRINCIPAL_CHAT_ID || 
                   localStorage.getItem('telegram_chat_id') || '';
    
    if (!chatId) {
      console.warn('⚠️ No Telegram chat ID configured');
      return;
    }

    try {
      const department = mockDepartments.find(d => d.id === event.department_id);
      let titlePrefix = '';
      let descriptionPrefix = '';

      switch (messageType) {
        case 'created':
          titlePrefix = '🆕 NEW: ';
          descriptionPrefix = '[Event Created]\n\n';
          break;
        case 'updated':
          titlePrefix = '📝 UPDATED: ';
          descriptionPrefix = '[Event Updated]\n\n';
          break;
        case 'approved':
          titlePrefix = '✅ APPROVED: ';
          descriptionPrefix = '[Event Approved - No longer in queue]\n\n';
          break;
        case 'rejected':
          titlePrefix = '❌ REJECTED: ';
          descriptionPrefix = '[Event Rejected]\n\n';
          break;
        case 'queue_update':
          titlePrefix = '🔄 QUEUE UPDATE: ';
          descriptionPrefix = `[Queue Position Changed]\nNew Position: ${event.conflict_info?.queue_position || 'N/A'}\n\n`;
          break;
      }

      const eventNotificationData = {
        title: titlePrefix + event.title,
        event_type: event.event_type,
        start_date: format(new Date(event.start_date), 'MMMM d, yyyy'),
        start_time: event.start_time,
        end_time: event.end_time,
        venue: event.venue,
        description: descriptionPrefix + (event.description || ''),
        expected_participants: event.expected_participants,
        creator_name: event.creator?.first_name + ' ' + event.creator?.last_name || 'Unknown',
        department_name: department?.name || 'Unknown Department'
      };

      const result = await sendEventNotification(chatId, eventNotificationData);
      
      if (result.success) {
        console.log(`✅ ${messageType} notification sent`);
      } else {
        console.error(`❌ Failed to send ${messageType} notification:`, result.error);
      }
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
    }
  };

  // Update queue positions and notify affected events
  const updateQueuePositions = async (startDate: string, endDate: string, venue: string) => {
    // Find all events with conflicts on this date/venue
    const conflictingEvents = events.filter(e => {
      if (e.status === 'cancelled' || e.status === 'rejected') return false;
      
      const eventStart = e.start_date;
      const eventEnd = e.end_date;
      const eventVenue = e.venue;

      return eventVenue === venue &&
             ((eventStart >= startDate && eventStart <= endDate) ||
              (eventEnd >= startDate && eventEnd <= endDate) ||
              (eventStart <= startDate && eventEnd >= endDate));
    }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Update queue positions
    const updatedEvents = events.map(event => {
      const conflictIndex = conflictingEvents.findIndex(e => e.id === event.id);
      
      if (conflictIndex === -1) return event;

      const approvedCount = conflictingEvents.slice(0, conflictIndex).filter(e => e.status === 'approved').length;
      const newQueuePosition = conflictIndex - approvedCount + 1;
      const oldQueuePosition = event.conflict_info?.queue_position;

      // Only update if position changed
      if (newQueuePosition !== oldQueuePosition && event.status === 'pending') {
        const updatedEvent = {
          ...event,
          conflict_info: {
            ...event.conflict_info,
            queue_position: newQueuePosition,
            has_conflict: true,
            conflicting_events: conflictingEvents.map(e => e.id)
          }
        };

        // Send queue update notification
        sendTelegramNotification(updatedEvent, 'queue_update');

        return updatedEvent;
      }

      return event;
    });

    setEvents(updatedEvents);
  };

  // Notify when event is approved
  const notifyEventApproval = async (event: any) => {
    await sendTelegramNotification(event, 'approved');
  };

  // Notify when event is rejected
  const notifyEventRejection = async (event: any, reason: string) => {
    await sendTelegramNotification(
      { ...event, description: `Rejection Reason: ${reason}\n\n${event.description}` },
      'rejected'
    );
  };

  // Notify when event moves up in queue
  const notifyQueuePromotion = async (event: any) => {
    await sendTelegramNotification(event, 'approved');
  };
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    event_type: '',
    department_id: '',
    start_date: undefined,
    end_date: undefined,
    start_time: '',
    end_time: '',
    venue: '',
    classroom_id: '',
    expected_participants: 0,
    budget_allocated: 0,
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    priority_level: 1,
    is_public: true,
    registration_required: false,
    max_registrations: 0,
    registration_deadline: undefined,
    is_recurring: false,
    recurrence_pattern: '',
    recurrence_end_date: undefined,
    recurrence_days: [],
    recurrence_interval: 1,
    event_color: '#3B82F6',
    reminders: [{ type: 'telegram', minutes_before: 60 }]
  });

  // Department-based data segregation
  const getVisibleEvents = () => {
    let visibleEvents = events;

    // Data segregation: Users only see events from their department (except admins)
    if (user && user.role !== 'admin') {
      visibleEvents = events.filter(event => {
        // Show public events from all departments OR events from user's department
        return event.is_public || user.departments.some(dept => dept.id === event.department_id);
      });
    }

    return visibleEvents;
  };

  // Filter events based on search and filters
  useEffect(() => {
    let filtered = getVisibleEvents();

    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.department.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(event => event.department_id === departmentFilter);
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, statusFilter, departmentFilter, user]);

  // Check for date conflicts
  const checkDateConflicts = (startDate: string, endDate: string, venue: string, excludeEventId?: string) => {
    const conflicts = events.filter(event => {
      if (excludeEventId && event.id === excludeEventId) return false;
      if (event.venue !== venue && event.classroom_id !== formData.classroom_id) return false;
      
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);
      
      return (newStart <= eventEnd && newEnd >= eventStart);
    });
    
    return {
      has_conflict: conflicts.length > 0,
      conflicting_events: conflicts.map(e => e.id),
      conflicting_event_details: conflicts
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.start_date || !formData.end_date) {
      alert('Please select start and end dates');
      return;
    }

    const startDateStr = format(formData.start_date, 'yyyy-MM-dd');
    const endDateStr = format(formData.end_date, 'yyyy-MM-dd');
    const venue = formData.venue || mockClassrooms.find(c => c.id === formData.classroom_id)?.name || '';
    
    // Check for conflicts
    const conflictCheck = checkDateConflicts(startDateStr, endDateStr, venue, selectedEvent?.id);
    
    const eventData = {
      ...formData,
      start_date: startDateStr,
      end_date: endDateStr,
      venue,
      created_by: '1', // Current user
      creator: { first_name: 'Current', last_name: 'User' },
      department: mockDepartments.find(d => d.id === formData.department_id),
      status: conflictCheck.has_conflict ? 'pending' : 'approved',
      created_at: new Date().toISOString(),
      conflict_info: {
        has_conflict: conflictCheck.has_conflict,
        conflicting_events: conflictCheck.conflicting_events,
        queue_position: conflictCheck.has_conflict ? conflictCheck.conflicting_events.length + 1 : null
      }
    };

    if (selectedEvent) {
      // Update existing event
      const updatedEvent = { ...selectedEvent, ...eventData };
      const previousStatus = selectedEvent.status;
      const previousQueuePosition = selectedEvent.conflict_info?.queue_position;
      
      setEvents(events.map(e => e.id === selectedEvent.id ? updatedEvent : e));
      setIsEditDialogOpen(false);

      // Always send Telegram notification for event update
      await sendTelegramNotification(updatedEvent, 'updated');

      // Check if status changed from pending to approved
      if (previousStatus === 'pending' && updatedEvent.status === 'approved') {
        await notifyQueuePromotion(updatedEvent);
      }

      // Update queue for all affected events
      await updateQueuePositions(startDateStr, endDateStr, venue);
    } else {
      // Add new event
      const newEvent = {
        id: Date.now().toString(),
        ...eventData
      };
      setEvents([...events, newEvent]);
      setIsAddDialogOpen(false);

      // Always send Telegram notification for new event
      await sendTelegramNotification(newEvent, 'created');

      // Update queue for all affected events
      if (conflictCheck.has_conflict) {
        await updateQueuePositions(startDateStr, endDateStr, venue);
      }
    }
    
    resetForm();

    // Show conflict notification if needed
    if (conflictCheck.has_conflict) {
      alert(`⚠️ Date conflict detected! Your event has been added to the queue at position ${conflictCheck.conflicting_events.length + 1}. You will be notified when the date becomes available.`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: '',
      department_id: user && user.role !== 'admin' ? (user.departments[0]?.id || '') : '',
      start_date: undefined,
      end_date: undefined,
      start_time: '',
      end_time: '',
      venue: '',
      classroom_id: '',
      expected_participants: 0,
      budget_allocated: 0,
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      priority_level: 1,
      is_public: true,
      registration_required: false,
      max_registrations: 0,
      registration_deadline: undefined,
      is_recurring: false,
      recurrence_pattern: '',
      recurrence_end_date: undefined,
      recurrence_days: [],
      recurrence_interval: 1,
      event_color: '#3B82F6',
      reminders: [{ type: 'telegram', minutes_before: 60 }]
    });
    setSelectedEvent(null);
  };

  const handleEdit = (event: any) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      department_id: event.department_id,
      start_date: new Date(event.start_date),
      end_date: new Date(event.end_date),
      start_time: event.start_time,
      end_time: event.end_time,
      venue: event.venue,
      classroom_id: event.classroom_id || '',
      expected_participants: event.expected_participants || 0,
      budget_allocated: event.budget_allocated || 0,
      contact_person: event.contact_person,
      contact_email: event.contact_email,
      contact_phone: event.contact_phone || '',
      priority_level: event.priority_level,
      is_public: event.is_public,
      registration_required: event.registration_required,
      max_registrations: event.max_registrations || 0,
      registration_deadline: event.registration_deadline ? new Date(event.registration_deadline) : undefined,
      is_recurring: event.is_recurring || false,
      recurrence_pattern: event.recurrence_pattern || '',
      recurrence_end_date: event.recurrence_end_date ? new Date(event.recurrence_end_date) : undefined,
      recurrence_days: event.recurrence_days || [],
      recurrence_interval: event.recurrence_interval || 1,
      event_color: event.event_color || '#3B82F6',
      reminders: event.reminders || [{ type: 'telegram', minutes_before: 60 }]
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      const deletedEvent = events.find(e => e.id === eventId);
      setEvents(events.filter(e => e.id !== eventId));
      
      // Update queue positions after deletion
      if (deletedEvent) {
        await updateQueuePositions(
          deletedEvent.start_date,
          deletedEvent.end_date,
          deletedEvent.venue
        );
      }
    }
  };

  const handleApprove = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    
    setEvents(events.map(e => 
      e.id === eventId ? { ...e, status: 'approved', approved_at: new Date().toISOString() } : e
    ));

    // Notify about approval and update queue
    if (event) {
      await notifyEventApproval(event);
      await updateQueuePositions(event.start_date, event.end_date, event.venue);
    }
  };

  const handleReject = async (eventId: string, reason: string) => {
    const event = events.find(e => e.id === eventId);
    
    setEvents(events.map(e => 
      e.id === eventId ? { ...e, status: 'rejected', rejection_reason: reason } : e
    ));

    // Notify about rejection
    if (event) {
      await notifyEventRejection(event, reason);
    }
  };

  // Calendar event handlers
  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    if (hasPermission('create_events')) {
      setFormData({
        ...formData,
        start_date: date,
        end_date: date
      });
      setIsAddDialogOpen(true);
    }
  };

  const handleCreateEvent = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // Handle template selection
  const handleTemplateSelect = (template: any) => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(9, 0, 0, 0); // Default to 9 AM
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + template.duration_hours);

    setFormData({
      ...formData,
      title: template.name,
      event_type: template.event_type,
      start_date: startDate,
      end_date: endDate,
      start_time: format(startDate, 'HH:mm'),
      end_time: format(endDate, 'HH:mm'),
      venue: template.default_venue || '',
      expected_participants: template.default_participants || 0,
      description: template.description_template || '',
      event_color: template.color
    });
    setIsAddDialogOpen(true);
  };

  // Handle quick add from natural language
  const handleQuickAddEvent = (quickEvent: any) => {
    const endDate = new Date(quickEvent.date);
    endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration

    setFormData({
      ...formData,
      title: quickEvent.title,
      start_date: quickEvent.date,
      end_date: endDate,
      start_time: quickEvent.time,
      end_time: format(endDate, 'HH:mm')
    });
    setIsAddDialogOpen(true);
  };

  // Handle event duplication
  const handleDuplicateEvent = (event: any) => {
    const duplicated = duplicateEvent(event);
    setEvents([...events, duplicated]);
  };

  // Handle event sharing
  const handleShareEvent = (share: any) => {
    const newShare = addEventShare(share);
    setEventShares([...eventShares, newShare]);
  };

  // Transform events for calendar component
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.start_date,
    start_time: event.start_time,
    end_time: event.end_time,
    event_type: event.event_type,
    venue: event.venue,
    department_id: event.department_id,
    department_name: event.department?.name || '',
    status: event.status as 'pending' | 'approved' | 'rejected',
    created_by: event.created_by,
    created_by_name: `${event.creator?.first_name} ${event.creator?.last_name}`,
    max_participants: event.max_registrations,
    current_participants: 0,
    queue_position: event.conflict_info?.queue_position,
    conflict_with: event.conflict_info?.conflicting_events?.map(id => 
      events.find(e => e.id === id)?.title || 'Unknown Event'
    ),
    event_color: (event as any).event_color,
    is_recurring: (event as any).is_recurring,
    recurrence_pattern: (event as any).recurrence_pattern
  }));

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      description: 'Create new event',
      callback: () => {
        if (hasPermission('create_events')) {
          handleCreateEvent();
        }
      }
    },
    {
      key: 'ArrowLeft',
      description: 'Previous month',
      callback: () => {
        // Navigation handled by calendar component
      }
    },
    {
      key: 'ArrowRight',
      description: 'Next month',
      callback: () => {
        // Navigation handled by calendar component
      }
    },
    {
      key: '/',
      description: 'Focus search',
      callback: () => {
        document.getElementById('event-search')?.focus();
      }
    },
    {
      key: 'q',
      ctrl: true,
      description: 'Quick add event',
      callback: () => setIsQuickAddOpen(true)
    },
    {
      key: 't',
      ctrl: true,
      description: 'Open tasks',
      callback: () => setIsTaskManagerOpen(true)
    },
    {
      key: 'h',
      ctrl: true,
      description: 'Working hours settings',
      callback: () => setIsWorkingHoursOpen(true)
    },
    {
      key: 'Escape',
      description: 'Close dialogs',
      callback: () => {
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setIsDetailModalOpen(false);
        setShowKeyboardHelp(false);
        setIsQuickAddOpen(false);
        setIsSharingDialogOpen(false);
        setIsTaskManagerOpen(false);
        setIsWorkingHoursOpen(false);
      }
    },
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      callback: () => {
        setShowKeyboardHelp(!showKeyboardHelp);
      }
    },
    {
      key: 'm',
      description: 'Switch to month view',
      callback: () => setActiveView('calendar')
    },
    {
      key: 'w',
      description: 'Switch to week view',
      callback: () => setActiveView('week')
    },
    {
      key: 'd',
      description: 'Switch to day view',
      callback: () => setActiveView('day')
    },
    {
      key: 'a',
      description: 'Switch to agenda view',
      callback: () => setActiveView('agenda')
    },
    {
      key: 'l',
      description: 'Switch to list view',
      callback: () => setActiveView('list')
    }
  ]);

  const getEventTypeInfo = (type: string) => {
    return eventTypes.find(t => t.value === type) || eventTypes[eventTypes.length - 1];
  };

  const EventForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleTitleInput(e.target.value)}
            onFocus={() => formData.title && setShowTitleSuggestions(true)}
            onBlur={() => setTimeout(() => setShowTitleSuggestions(false), 200)}
            placeholder="AI/ML Workshop"
            required
          />
          {showTitleSuggestions && titleSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
              {titleSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setFormData({ ...formData, title: suggestion });
                    setShowTitleSuggestions(false);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="event_type">Event Type</Label>
          <Select value={formData.event_type} onValueChange={(value) => setFormData({ ...formData, event_type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleDescriptionInput(e.target.value)}
          placeholder="Brief description of the event..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="department">Department</Label>
          <Select 
            value={formData.department_id} 
            onValueChange={(value) => setFormData({ ...formData, department_id: value })}
            disabled={user && user.role !== 'admin'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {(user && user.role !== 'admin' 
                ? mockDepartments.filter(dept => user.departments.some(userDept => userDept.id === dept.id))
                : mockDepartments
              ).map(dept => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {user && user.role !== 'admin' && (
            <p className="text-xs text-muted-foreground mt-1">
              You can only create events for your department
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="priority">Priority Level</Label>
          <Select value={formData.priority_level.toString()} onValueChange={(value) => setFormData({ ...formData, priority_level: parseInt(value) })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">High Priority</SelectItem>
              <SelectItem value="2">Medium Priority</SelectItem>
              <SelectItem value="3">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.start_date ? format(formData.start_date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.start_date}
                onSelect={(date) => setFormData({ ...formData, start_date: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.end_date ? format(formData.end_date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.end_date}
                onSelect={(date) => setFormData({ ...formData, end_date: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Label htmlFor="venue">Venue/Classroom</Label>
          <Input
            id="venue"
            value={formData.venue}
            onChange={(e) => handleVenueInput(e.target.value)}
            onFocus={() => formData.venue && setShowVenueSuggestions(true)}
            onBlur={() => setTimeout(() => setShowVenueSuggestions(false), 200)}
            placeholder="Auditorium, Lab 1, etc."
            required
          />
          {showVenueSuggestions && venueSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
              {venueSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setFormData({ ...formData, venue: suggestion });
                    setShowVenueSuggestions(false);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="classroom">Classroom (Optional)</Label>
          <Select value={formData.classroom_id} onValueChange={(value) => setFormData({ ...formData, classroom_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select classroom" />
            </SelectTrigger>
            <SelectContent>
              {mockClassrooms.map(room => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} (Capacity: {room.capacity})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="participants">Expected Participants</Label>
          <Input
            id="participants"
            type="number"
            value={formData.expected_participants}
            onChange={(e) => setFormData({ ...formData, expected_participants: parseInt(e.target.value) || 0 })}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="contact_person">Contact Person</Label>
          <Input
            id="contact_person"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: capitalizeFirst(e.target.value) })}
            placeholder="Dr. John Smith"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            placeholder="john.smith@college.edu"
          />
        </div>
        <div>
          <Label htmlFor="contact_phone">Contact Phone</Label>
          <Input
            id="contact_phone"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            placeholder="+1-234-567-8900"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_public"
            checked={formData.is_public}
            onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
          />
          <Label htmlFor="is_public">Public Event</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="registration_required"
            checked={formData.registration_required}
            onCheckedChange={(checked) => setFormData({ ...formData, registration_required: checked })}
          />
          <Label htmlFor="registration_required">Registration Required</Label>
        </div>
      </div>

      {/* Recurring Events Section */}
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center space-x-2 mb-4">
          <Switch
            id="is_recurring"
            checked={formData.is_recurring}
            onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
          />
          <Label htmlFor="is_recurring" className="font-semibold">Recurring Event</Label>
        </div>

        {formData.is_recurring && (
          <div className="space-y-4 pl-6 border-l-2 border-primary/20">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recurrence_pattern">Repeat Pattern</Label>
                <Select 
                  value={formData.recurrence_pattern} 
                  onValueChange={(value: any) => setFormData({ ...formData, recurrence_pattern: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="recurrence_interval">Every</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="recurrence_interval"
                    type="number"
                    value={formData.recurrence_interval}
                    onChange={(e) => setFormData({ ...formData, recurrence_interval: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.recurrence_pattern === 'daily' && 'day(s)'}
                    {formData.recurrence_pattern === 'weekly' && 'week(s)'}
                    {formData.recurrence_pattern === 'monthly' && 'month(s)'}
                  </span>
                </div>
              </div>
            </div>

            {formData.recurrence_pattern === 'weekly' && (
              <div>
                <Label>Repeat on</Label>
                <div className="flex gap-2 mt-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <Button
                      key={day}
                      type="button"
                      variant={formData.recurrence_days.includes(index) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const days = formData.recurrence_days.includes(index)
                          ? formData.recurrence_days.filter(d => d !== index)
                          : [...formData.recurrence_days, index];
                        setFormData({ ...formData, recurrence_days: days });
                      }}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Ends</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.recurrence_end_date ? format(formData.recurrence_end_date, 'PPP') : 'Pick end date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.recurrence_end_date}
                    onSelect={(date) => setFormData({ ...formData, recurrence_end_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>

      {/* Event Color Section */}
      <div className="border-t pt-4 mt-4">
        <Label htmlFor="event_color">Event Color</Label>
        <div className="flex gap-2 mt-2">
          {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'].map((color) => (
            <button
              key={color}
              type="button"
              className={`w-10 h-10 rounded-full border-2 ${formData.event_color === color ? 'border-gray-900 scale-110' : 'border-gray-300'} transition-all`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData({ ...formData, event_color: color })}
              title={color}
            />
          ))}
          <Input
            type="color"
            value={formData.event_color}
            onChange={(e) => setFormData({ ...formData, event_color: e.target.value })}
            className="w-10 h-10 p-1 cursor-pointer"
          />
        </div>
      </div>

      {/* Reminders Section */}
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center justify-between mb-4">
          <Label className="font-semibold">Reminders</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setFormData({
                ...formData,
                reminders: [...formData.reminders, { type: 'telegram', minutes_before: 60 }]
              });
            }}
          >
            <Bell className="h-4 w-4 mr-2" />
            Add Reminder
          </Button>
        </div>
        <div className="space-y-3">
          {formData.reminders.map((reminder, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>Type</Label>
                <Select
                  value={reminder.type}
                  onValueChange={(value: any) => {
                    const newReminders = [...formData.reminders];
                    newReminders[index].type = value;
                    setFormData({ ...formData, reminders: newReminders });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="in-app">In-App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Time Before</Label>
                <Select
                  value={reminder.minutes_before.toString()}
                  onValueChange={(value) => {
                    const newReminders = [...formData.reminders];
                    newReminders[index].minutes_before = parseInt(value);
                    setFormData({ ...formData, reminders: newReminders });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="1440">1 day</SelectItem>
                    <SelectItem value="2880">2 days</SelectItem>
                    <SelectItem value="10080">1 week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFormData({
                    ...formData,
                    reminders: formData.reminders.filter((_, i) => i !== index)
                  });
                }}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {formData.registration_required && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="max_registrations">Max Registrations</Label>
            <Input
              id="max_registrations"
              type="number"
              value={formData.max_registrations}
              onChange={(e) => setFormData({ ...formData, max_registrations: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>
          <div>
            <Label>Registration Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.registration_deadline ? format(formData.registration_deadline, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.registration_deadline}
                  onSelect={(date) => setFormData({ ...formData, registration_deadline: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
        }}>
          Cancel
        </Button>
        <Button type="submit">
          {selectedEvent ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
          <p className="text-gray-600 mt-1">Master your schedule like Google Calendar - with conflict detection & smart queue</p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}>
                  <Keyboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Keyboard Shortcuts (Shift+?)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
            <TabsList>
              <TabsTrigger value="calendar">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
          {hasPermission('create_events') && (
            <>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>
                    Create a new college event. The system will automatically detect conflicts and manage queue.
                  </DialogDescription>
                </DialogHeader>
                <EventForm />
              </DialogContent>
            </Dialog>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => setIsQuickAddOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Quick Add (Ctrl+Q)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => setIsTaskManagerOpen(true)}>
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tasks (Ctrl+T)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => setIsWorkingHoursOpen(true)}>
                    <Clock className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Working Hours (Ctrl+H)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => setShowKeyboardHelp(true)}>
                    <Keyboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Shortcuts (?)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            </>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Help Dialog */}
      <Dialog open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Navigate and manage events faster with these shortcuts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="font-semibold">Navigation</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded">M</kbd>
                    <span>Month view</span>
                  </div>
                  <div className="flex justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded">W</kbd>
                    <span>Week view</span>
                  </div>
                  <div className="flex justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded">D</kbd>
                    <span>Day view</span>
                  </div>
                  <div className="flex justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded">A</kbd>
                    <span>Agenda view</span>
                  </div>
                  <div className="flex justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded">L</kbd>
                    <span>List view</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold">Actions</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded">N</kbd>
                    <span>New event</span>
                  </div>
                  <div className="flex justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded">Ctrl+Q</kbd>
                    <span>Quick add</span>
                  </div>
                  <div className="flex justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded">Ctrl+T</kbd>
                    <span>Tasks</span>
                  </div>
                  <div className="flex justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded">Ctrl+H</kbd>
                    <span>Working hours</span>
                  </div>
                  <div className="flex justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded">/</kbd>
                    <span>Search events</span>
                  </div>
                  <div className="flex justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded">Esc</kbd>
                    <span>Close dialogs</span>
                  </div>
                  <div className="flex justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded">?</kbd>
                    <span>Show shortcuts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Template Picker */}
      <EventTemplatePicker onSelectTemplate={handleTemplateSelect} />

      {/* Quick Add Dialog */}
      <QuickAddDialog
        open={isQuickAddOpen}
        onOpenChange={setIsQuickAddOpen}
        onEventCreated={handleQuickAddEvent}
      />

      {/* Working Hours Settings Dialog */}
      <Dialog open={isWorkingHoursOpen} onOpenChange={setIsWorkingHoursOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Working Hours Settings</DialogTitle>
            <DialogDescription>
              Configure your working hours to receive warnings when scheduling events outside these times
            </DialogDescription>
          </DialogHeader>
          <WorkingHoursSettings />
        </DialogContent>
      </Dialog>

      {/* Task Manager Dialog */}
      <Dialog open={isTaskManagerOpen} onOpenChange={setIsTaskManagerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Manager</DialogTitle>
            <DialogDescription>
              Manage tasks and todos related to your events
            </DialogDescription>
          </DialogHeader>
          <TaskManager />
        </DialogContent>
      </Dialog>

      {/* Event Sharing Dialog */}
      {selectedEvent && (
        <EventSharingDialog
          event={selectedEvent}
          open={isSharingDialogOpen}
          onOpenChange={setIsSharingDialogOpen}
          onShare={handleShareEvent}
          existingShares={getEventShares(selectedEvent.id)}
          currentUserEmail={user?.email || ''}
        />
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{events.filter(e => e.status === 'pending').length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{events.filter(e => e.status === 'approved').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conflicts</p>
                <p className="text-2xl font-bold text-red-600">{events.filter(e => e.conflict_info?.has_conflict).length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Queue</p>
                <p className="text-2xl font-bold text-purple-600">{events.filter(e => e.conflict_info?.queue_position).length}</p>
              </div>
              <Timer className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conflict Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Conflict Resolution:</strong> Events with date conflicts are automatically queued using first-come-first-serve. 
          You'll receive notifications when your requested date becomes available.
        </AlertDescription>
      </Alert>

      {/* Filters and Search - Only show for list view */}
      {activeView === 'list' && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="event-search"
                placeholder="Search events... (Press / to focus)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              {user && user.role === 'admin' && (
                <SelectItem value="all">All Departments</SelectItem>
              )}
              {(user && user.role !== 'admin' 
                ? mockDepartments.filter(dept => user.departments.some(userDept => userDept.id === dept.id))
                : mockDepartments
              ).map(dept => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Calendar or List View */}
      {activeView === 'calendar' ? (
        <EventCalendar
          events={calendarEvents}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
          onCreateEvent={handleCreateEvent}
        />
      ) : activeView === 'list' ? (
        /* Events List */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEvents.map((event) => {
          const eventTypeInfo = getEventTypeInfo(event.event_type);
          
          return (
            <Card key={event.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={eventTypeInfo.color}>
                        {eventTypeInfo.label}
                      </Badge>
                      <Badge className={statusColors[event.status as keyof typeof statusColors]}>
                        {event.status}
                      </Badge>
                      {event.conflict_info?.has_conflict && (
                        <Badge variant="destructive">
                          <Timer className="h-3 w-3 mr-1" />
                          Queue #{event.conflict_info.queue_position}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription>
                      {event.department?.name} ({event.department?.code})
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Event Details */}
                <p className="text-sm text-gray-600 line-clamp-2">
                  {event.description}
                </p>

                {/* Date and Time */}
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {event.start_date === event.end_date ? (
                    <span>{format(new Date(event.start_date), 'PPP')}</span>
                  ) : (
                    <span>{format(new Date(event.start_date), 'PPP')} - {format(new Date(event.end_date), 'PPP')}</span>
                  )}
                  {event.start_time && (
                    <span className="ml-2">
                      {event.start_time} - {event.end_time}
                    </span>
                  )}
                </div>

                {/* Venue */}
                {event.venue && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {event.venue}
                  </div>
                )}

                {/* Participants */}
                {event.expected_participants && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    Expected: {event.expected_participants} participants
                  </div>
                )}

                {/* Contact */}
                <div className="text-sm text-gray-600">
                  <strong>Contact:</strong> {event.contact_person}
                  {event.contact_email && (
                    <span className="block">{event.contact_email}</span>
                  )}
                </div>

                {/* Conflict Information */}
                {event.conflict_info?.has_conflict && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Date Conflict:</strong> This event conflicts with {event.conflict_info.conflicting_events.length} other event(s). 
                      Currently in queue position #{event.conflict_info.queue_position}.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                {event.status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(event.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) handleReject(event.id, reason);
                      }}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        </div>
      ) : (
        <CalendarViews
          view={activeView as 'day' | 'week' | 'agenda'}
          currentDate={new Date()}
          events={calendarEvents}
          onEventClick={handleEventClick}
        />
      )}

      {activeView === 'list' && filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">Try adjusting your search or filters, or create a new event.</p>
        </div>
      )}

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        open={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvent(null);
        }}
        onEdit={(event) => {
          setIsDetailModalOpen(false);
          handleEdit(event);
        }}
        onDelete={(eventId) => {
          setIsDetailModalOpen(false);
          handleDelete(eventId);
        }}
        onApprove={(eventId) => {
          handleApprove(eventId);
          setIsDetailModalOpen(false);
        }}
        onReject={(eventId) => {
          const reason = prompt('Rejection reason:');
          if (reason) {
            handleReject(eventId, reason);
            setIsDetailModalOpen(false);
          }
        }}
      />      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update event details. The system will check for conflicts automatically.
            </DialogDescription>
          </DialogHeader>
          <EventForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}