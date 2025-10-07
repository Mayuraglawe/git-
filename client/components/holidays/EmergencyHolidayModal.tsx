import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * Emergency Holiday Declaration Modal
 * Allows admins/publishers to declare emergency or planned holidays
 * with professional notification system
 */

interface EmergencyHolidayModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EmergencyHolidayData) => Promise<void>;
  preselectedDate?: Date;
}

export interface EmergencyHolidayData {
  eventType: 'standard' | 'holiday';
  date: Date;
  urgency: 'low_priority' | 'emergency';
  reason: string;
  confirmed: boolean;
}

export default function EmergencyHolidayModal({ 
  open, 
  onClose, 
  onSubmit,
  preselectedDate 
}: EmergencyHolidayModalProps) {
  const [eventType, setEventType] = useState<'standard' | 'holiday'>('holiday');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(preselectedDate);
  const [urgency, setUrgency] = useState<'low_priority' | 'emergency'>('low_priority');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a reason for the holiday');
      return;
    }

    if (urgency === 'emergency' && !confirmed) {
      alert('Please confirm the emergency holiday declaration');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit({
        eventType,
        date: selectedDate,
        urgency,
        reason: reason.trim(),
        confirmed
      });
      
      // Reset form
      setEventType('holiday');
      setSelectedDate(undefined);
      setUrgency('low_priority');
      setReason('');
      setConfirmed(false);
      onClose();
    } catch (error) {
      console.error('Failed to declare holiday:', error);
      alert('Failed to declare holiday. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubmitButtonText = () => {
    if (urgency === 'emergency') {
      return '🚨 Declare Emergency Now';
    }
    return 'Schedule Holiday';
  };

  const isSubmitDisabled = () => {
    if (!selectedDate || !reason.trim()) return true;
    if (urgency === 'emergency' && !confirmed) return true;
    return isSubmitting;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Declare a Holiday
          </DialogTitle>
          <DialogDescription>
            Use this form to declare emergency or planned holidays. All notifications will be sent automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Event Type</Label>
            <RadioGroup value={eventType} onValueChange={(value) => setEventType(value as 'standard' | 'holiday')}>
              <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard" className="flex-1 cursor-pointer">
                  <div className="font-medium">Standard Event</div>
                  <div className="text-sm text-muted-foreground">Regular academic event, workshop, or meeting</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="holiday" id="holiday" />
                <Label htmlFor="holiday" className="flex-1 cursor-pointer">
                  <div className="font-medium">Holiday Declaration</div>
                  <div className="text-sm text-muted-foreground">Declare an official holiday for the institution</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Show holiday-specific fields only if holiday is selected */}
          {eventType === 'holiday' && (
            <>
              {/* Date Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Urgency Level */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Holiday Urgency *</Label>
                <RadioGroup value={urgency} onValueChange={(value) => setUrgency(value as 'low_priority' | 'emergency')}>
                  <div className={cn(
                    "flex items-start space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all",
                    urgency === 'low_priority' ? "border-blue-500 bg-blue-50" : "border-border hover:bg-accent/50"
                  )}>
                    <RadioGroupItem value="low_priority" id="low_priority" className="mt-1" />
                    <Label htmlFor="low_priority" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Info className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Low Priority</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        A planned holiday or an optional day off. Users will be notified with standard priority.
                      </div>
                    </Label>
                  </div>
                  
                  <div className={cn(
                    "flex items-start space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all",
                    urgency === 'emergency' ? "border-red-500 bg-red-50" : "border-border hover:bg-accent/50"
                  )}>
                    <RadioGroupItem value="emergency" id="emergency" className="mt-1" />
                    <Label htmlFor="emergency" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-900">Emergency</span>
                        <Badge variant="destructive" className="ml-2">Urgent</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Immediate and mandatory closure. All users will be notified immediately via in-app and Telegram.
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Reason */}
              <div className="space-y-3">
                <Label htmlFor="reason" className="text-base font-semibold">
                  Reason for Holiday <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Example: Due to a severe weather warning issued by the local authorities."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  required
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  This reason will be included in all notifications sent to students and faculty.
                </p>
              </div>

              {/* Emergency Confirmation */}
              {urgency === 'emergency' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start space-x-3 mt-2">
                      <Checkbox
                        id="confirm"
                        checked={confirmed}
                        onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                        className="mt-1"
                      />
                      <Label htmlFor="confirm" className="font-medium cursor-pointer">
                        I understand that declaring an Emergency Holiday will immediately send notifications to all students and publishers. This action cannot be undone.
                      </Label>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview */}
              {selectedDate && reason && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-sm">Notification Preview:</p>
                  <div className="text-sm space-y-1">
                    <p><strong>Type:</strong> {urgency === 'emergency' ? '🚨 Emergency Holiday' : '🗓️ Planned Holiday'}</p>
                    <p><strong>Date:</strong> {format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                    <p><strong>Reason:</strong> {reason}</p>
                    <p className="text-muted-foreground mt-2">
                      {urgency === 'emergency' 
                        ? 'All students and faculty will receive immediate notifications via in-app and Telegram.'
                        : 'All students and faculty will receive standard notifications.'}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitDisabled()}
              className={cn(
                urgency === 'emergency' && eventType === 'holiday' && "bg-red-600 hover:bg-red-700"
              )}
            >
              {isSubmitting ? 'Processing...' : getSubmitButtonText()}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
