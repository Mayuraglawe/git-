/**
 * Emergency Holiday Notification Templates
 * Professional message templates for Telegram and in-app notifications
 */

import { format } from 'date-fns';

export interface HolidayNotificationData {
  date: Date;
  reason: string;
  urgency: 'emergency' | 'low_priority';
  institutionName?: string;
}

/**
 * Generate Emergency Holiday Telegram Message
 */
export function generateEmergencyTelegramMessage(data: HolidayNotificationData): string {
  const { date, reason, institutionName = 'The Academic Compass' } = data;
  const dayOfWeek = format(date, 'EEEE');
  const formattedDate = format(date, 'MMMM d, yyyy');

  return `🚨 *EMERGENCY HOLIDAY ANNOUNCEMENT* 🚨

*Attention All Students and Faculty,*

This is an official notification from ${institutionName} administration.

Due to *${reason}*, the institution will remain *CLOSED* on *${dayOfWeek}, ${formattedDate}*.

❌ All scheduled classes, examinations, and on-campus activities for this day are cancelled.

⚠️ Please stay safe and await further instructions. We apologize for any inconvenience this may cause.

*Regards,*
_${institutionName} Administration_`;
}

/**
 * Generate Low Priority Holiday Telegram Message
 */
export function generateLowPriorityTelegramMessage(data: HolidayNotificationData): string {
  const { date, reason, institutionName = 'The Academic Compass' } = data;
  const dayOfWeek = format(date, 'EEEE');
  const formattedDate = format(date, 'MMMM d, yyyy');

  return `🗓️ *HOLIDAY NOTIFICATION* 🗓️

*Dear Students and Faculty,*

Please be advised that the institution has declared a holiday on *${dayOfWeek}, ${formattedDate}*.

📋 *Reason:* ${reason}

All academic activities will be suspended on this day. The institution will resume its normal schedule on the following working day.

Please plan accordingly.

*Best Regards,*
_${institutionName} Administration_`;
}

/**
 * Generate In-App Notification Title
 */
export function generateInAppNotificationTitle(urgency: 'emergency' | 'low_priority', date: Date): string {
  const formattedDate = format(date, 'MMM d, yyyy');
  
  if (urgency === 'emergency') {
    return `🚨 URGENT: Institution Closed on ${formattedDate}`;
  }
  return `🗓️ Holiday Notice: ${formattedDate}`;
}

/**
 * Generate In-App Notification Body
 */
export function generateInAppNotificationBody(data: HolidayNotificationData): string {
  const { date, reason, urgency } = data;
  const dayOfWeek = format(date, 'EEEE');
  const formattedDate = format(date, 'MMMM d, yyyy');

  if (urgency === 'emergency') {
    return `Emergency Holiday Declared: The institution will be closed on ${dayOfWeek}, ${formattedDate}. Reason: ${reason}. All classes and activities are cancelled.`;
  }
  
  return `Holiday on ${dayOfWeek}, ${formattedDate}. Reason: ${reason}. All academic activities are suspended for this day.`;
}

/**
 * Generate Email Subject Line
 */
export function generateEmailSubject(urgency: 'emergency' | 'low_priority', date: Date): string {
  const formattedDate = format(date, 'MMMM d, yyyy');
  
  if (urgency === 'emergency') {
    return `URGENT: Institution Closed on ${formattedDate}`;
  }
  return `Notice: Holiday on ${formattedDate}`;
}

/**
 * Generate Email Body (HTML)
 */
export function generateEmailBody(data: HolidayNotificationData): string {
  const { date, reason, urgency, institutionName = 'The Academic Compass' } = data;
  const dayOfWeek = format(date, 'EEEE');
  const formattedDate = format(date, 'MMMM d, yyyy');

  if (urgency === 'emergency') {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .alert { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 12px; margin: 16px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 EMERGENCY HOLIDAY ANNOUNCEMENT</h1>
    </div>
    <div class="content">
      <p><strong>Attention All Students and Faculty,</strong></p>
      
      <p>This is an official notification from ${institutionName} administration.</p>
      
      <div class="alert">
        <p><strong>Due to ${reason}, the institution will remain CLOSED on ${dayOfWeek}, ${formattedDate}.</strong></p>
      </div>
      
      <p>❌ All scheduled classes, examinations, and on-campus activities for this day are cancelled.</p>
      
      <p>⚠️ Please stay safe and await further instructions. We apologize for any inconvenience this may cause.</p>
      
      <p><strong>Regards,</strong><br>
      <em>${institutionName} Administration</em></p>
    </div>
    <div class="footer">
      <p>This is an automated notification from ${institutionName}</p>
    </div>
  </div>
</body>
</html>`;
  }

  // Low Priority Email
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .info-box { background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px; margin: 16px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🗓️ HOLIDAY NOTIFICATION</h1>
    </div>
    <div class="content">
      <p><strong>Dear Students and Faculty,</strong></p>
      
      <p>Please be advised that the institution has declared a holiday on <strong>${dayOfWeek}, ${formattedDate}</strong>.</p>
      
      <div class="info-box">
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
      
      <p>All academic activities will be suspended on this day. The institution will resume its normal schedule on the following working day.</p>
      
      <p>Please plan accordingly.</p>
      
      <p><strong>Best Regards,</strong><br>
      <em>${institutionName} Administration</em></p>
    </div>
    <div class="footer">
      <p>This is an automated notification from ${institutionName}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate SMS Message (shorter version for SMS gateways)
 */
export function generateSMSMessage(data: HolidayNotificationData): string {
  const { date, reason, urgency, institutionName = 'The Academic Compass' } = data;
  const formattedDate = format(date, 'MMM d, yyyy');

  if (urgency === 'emergency') {
    return `URGENT: ${institutionName} closed on ${formattedDate}. Reason: ${reason}. All classes cancelled.`;
  }
  
  return `Holiday on ${formattedDate}. Reason: ${reason}. Academic activities suspended. - ${institutionName}`;
}
