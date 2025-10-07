/**
 * Emergency Holiday Service
 * Handles API calls for emergency holiday declarations and notifications
 */

// Use relative URL to let Vite proxy handle the request
const API_BASE_URL = '';

export interface EmergencyHolidayData {
  date: string;
  urgency: 'emergency' | 'low_priority';
  reason: string;
  created_by: string;
}

export interface EmergencyHoliday {
  id: string;
  date: string;
  urgency: 'emergency' | 'low_priority';
  reason: string;
  created_by: string;
  created_at: string;
  notification_sent: boolean;
  notification_sent_at?: string;
  cancelled_at?: string;
  is_active: boolean;
}

/**
 * Create a new emergency or planned holiday
 */
export async function createEmergencyHoliday(data: EmergencyHolidayData): Promise<EmergencyHoliday> {
  const response = await fetch(`${API_BASE_URL}/api/emergency-holidays`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create emergency holiday');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get all emergency holidays
 */
export async function getAllEmergencyHolidays(): Promise<EmergencyHoliday[]> {
  const response = await fetch(`${API_BASE_URL}/api/emergency-holidays`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch emergency holidays');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get a specific emergency holiday
 */
export async function getEmergencyHoliday(id: string): Promise<EmergencyHoliday> {
  const response = await fetch(`${API_BASE_URL}/api/emergency-holidays/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch emergency holiday');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Cancel an emergency holiday (soft delete)
 */
export async function cancelEmergencyHoliday(id: string): Promise<EmergencyHoliday> {
  const response = await fetch(`${API_BASE_URL}/api/emergency-holidays/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to cancel emergency holiday');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Resend notifications for an emergency holiday
 */
export async function resendNotifications(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/emergency-holidays/${id}/resend-notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to resend notifications');
  }
}

/**
 * Get emergency holidays for a specific date range
 */
export async function getEmergencyHolidaysInRange(startDate: Date, endDate: Date): Promise<EmergencyHoliday[]> {
  const holidays = await getAllEmergencyHolidays();
  
  return holidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate >= startDate && holidayDate <= endDate && holiday.is_active;
  });
}

/**
 * Check if a specific date is an emergency holiday
 */
export async function isEmergencyHoliday(date: Date): Promise<boolean> {
  const holidays = await getAllEmergencyHolidays();
  const dateStr = date.toISOString().split('T')[0];
  
  return holidays.some(holiday => 
    holiday.date === dateStr && 
    holiday.is_active
  );
}

/**
 * Get active emergency holidays (not cancelled)
 */
export async function getActiveEmergencyHolidays(): Promise<EmergencyHoliday[]> {
  const holidays = await getAllEmergencyHolidays();
  return holidays.filter(holiday => holiday.is_active);
}

/**
 * Get emergency holidays by urgency level
 */
export async function getEmergencyHolidaysByUrgency(urgency: 'emergency' | 'low_priority'): Promise<EmergencyHoliday[]> {
  const holidays = await getAllEmergencyHolidays();
  return holidays.filter(holiday => 
    holiday.urgency === urgency && 
    holiday.is_active
  );
}
