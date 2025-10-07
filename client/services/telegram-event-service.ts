/**
 * Telegram Event Notification Service
 * Client-side service for sending event notifications via Telegram
 */

interface EventData {
  title: string;
  event_type?: string;
  start_date: string;
  start_time: string;
  end_time?: string;
  venue?: string;
  description?: string;
  expected_participants?: number;
  creator_name?: string;
  department_name?: string;
}

interface NotificationResponse {
  success: boolean;
  message?: string;
  messageId?: number;
  error?: string;
  successful?: number;
  failed?: number;
  total?: number;
}

/**
 * Send event notification to a single Telegram chat
 */
export async function sendEventNotification(
  chatId: string,
  event: EventData
): Promise<NotificationResponse> {
  try {
    const response = await fetch('/api/telegram/events/event-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId,
        event
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending event notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notification'
    };
  }
}

/**
 * Broadcast event notification to multiple Telegram chats
 */
export async function broadcastEventNotification(
  chatIds: string[],
  event: EventData
): Promise<NotificationResponse> {
  try {
    const response = await fetch('/api/telegram/events/event-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatIds,
        event
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error broadcasting event notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to broadcast notification'
    };
  }
}

/**
 * Send event reminder to a single Telegram chat
 */
export async function sendEventReminder(
  chatId: string,
  event: EventData,
  minutesBefore: number = 60
): Promise<NotificationResponse> {
  try {
    const response = await fetch('/api/telegram/events/event-reminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId,
        event,
        minutesBefore
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending event reminder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reminder'
    };
  }
}

/**
 * Broadcast event reminder to multiple Telegram chats
 */
export async function broadcastEventReminder(
  chatIds: string[],
  event: EventData,
  minutesBefore: number = 60
): Promise<NotificationResponse> {
  try {
    const response = await fetch('/api/telegram/events/event-reminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatIds,
        event,
        minutesBefore
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error broadcasting event reminder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to broadcast reminder'
    };
  }
}

/**
 * Test Telegram bot connection
 */
export async function testTelegramConnection(): Promise<NotificationResponse> {
  try {
    const response = await fetch('/api/telegram/events/test');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error testing Telegram connection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed'
    };
  }
}

/**
 * Helper function to schedule event reminders based on reminder settings
 */
export async function scheduleEventReminders(
  event: EventData,
  reminders: Array<{ type: 'telegram' | 'email' | 'in-app'; minutes_before: number }>,
  recipientChatIds: string[]
): Promise<void> {
  const telegramReminders = reminders.filter(r => r.type === 'telegram');
  
  if (telegramReminders.length === 0 || recipientChatIds.length === 0) {
    console.log('No Telegram reminders to schedule');
    return;
  }

  // In a real implementation, you would:
  // 1. Calculate the exact time to send each reminder
  // 2. Schedule jobs (using a job scheduler like node-cron or bull)
  // 3. Store reminder jobs in database for persistence
  
  // For now, we'll send immediate notification for the event creation
  console.log('Sending event creation notification...');
  const result = await broadcastEventNotification(recipientChatIds, event);
  
  if (result.success) {
    console.log(`✅ Event notification sent to ${result.successful || 0} recipients`);
  } else {
    console.error('❌ Failed to send event notification:', result.error);
  }
}

export type { EventData, NotificationResponse };
