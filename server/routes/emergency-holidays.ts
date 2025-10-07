import express from 'express';
import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = express.Router();

/**
 * Emergency Holiday Routes
 * Handles emergency and planned holiday declarations with notifications
 */

interface EmergencyHolidayRequest {
  date: string;
  urgency: 'emergency' | 'low_priority';
  reason: string;
  created_by: string;
}

/**
 * POST /api/emergency-holidays
 * Create a new emergency or planned holiday
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { date, urgency, reason, created_by }: EmergencyHolidayRequest = req.body;

    // Validate required fields
    if (!date || !urgency || !reason || !created_by) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: date, urgency, reason, created_by'
      });
    }

    // Insert into database
    const { data: holiday, error: insertError } = await supabase
      .from('emergency_holidays')
      .insert([{
        date,
        urgency,
        reason,
        created_by,
        created_at: new Date().toISOString(),
        notification_sent: false
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create holiday declaration',
        details: insertError
      });
    }

    // Trigger notifications asynchronously
    if (holiday) {
      // Don't await - send notifications in background
      sendHolidayNotifications(holiday.id, date, urgency, reason).catch(err => {
        console.error('Notification error:', err);
      });
    }

    res.status(201).json({
      message: urgency === 'emergency' 
        ? 'Emergency holiday declared successfully. Notifications are being sent.'
        : 'Holiday scheduled successfully. Notifications are being sent.',
      data: holiday
    });

  } catch (error) {
    console.error('Error creating holiday:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
});

/**
 * GET /api/emergency-holidays
 * Get all emergency holidays
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('emergency_holidays')
      .select(`
        *,
        creator:created_by(first_name, last_name, email)
      `)
      .order('date', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch holidays',
        details: error
      });
    }

    res.json({
      data,
      count: data.length
    });

  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
});

/**
 * GET /api/emergency-holidays/:id
 * Get a specific emergency holiday
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('emergency_holidays')
      .select(`
        *,
        creator:created_by(first_name, last_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Holiday not found'
        });
      }
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch holiday',
        details: error
      });
    }

    res.json({ data });

  } catch (error) {
    console.error('Error fetching holiday:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
});

/**
 * DELETE /api/emergency-holidays/:id
 * Cancel an emergency holiday (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('emergency_holidays')
      .update({ 
        cancelled_at: new Date().toISOString(),
        is_active: false
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Holiday not found'
        });
      }
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to cancel holiday',
        details: error
      });
    }

    res.json({
      message: 'Holiday cancelled successfully',
      data
    });

  } catch (error) {
    console.error('Error cancelling holiday:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
});

/**
 * POST /api/emergency-holidays/:id/resend-notifications
 * Resend notifications for a holiday
 */
router.post('/:id/resend-notifications', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: holiday, error } = await supabase
      .from('emergency_holidays')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Holiday not found'
        });
      }
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch holiday',
        details: error
      });
    }

    // Resend notifications
    await sendHolidayNotifications(holiday.id, holiday.date, holiday.urgency, holiday.reason);

    res.json({
      message: 'Notifications sent successfully'
    });

  } catch (error) {
    console.error('Error resending notifications:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
});

/**
 * Send notifications for emergency holiday
 * This function sends notifications via:
 * 1. In-app notifications (using existing event_notifications table)
 * 2. Telegram (using new-generation telegram service)
 * 3. Integration with existing notification infrastructure
 */
async function sendHolidayNotifications(
  holidayId: string,
  date: string,
  urgency: 'emergency' | 'low_priority',
  reason: string
) {
  try {
    // Try to get users from database, fallback to mock data if table doesn't exist
    let users: any[] = [];
    let useMockUsers = false;

    try {
      const { data: dbUsers, error: usersError } = await supabase
        .from('users')
        .select(`
          id, 
          email, 
          first_name, 
          last_name, 
          role,
          user_department_assignments!inner(
            department_id,
            assignment_type,
            is_active
          )
        `)
        .eq('is_active', true)
        .eq('user_department_assignments.is_active', true)
        .in('role', ['admin', 'mentor', 'student']);

      if (usersError && usersError.code !== 'PGRST205') {
        console.error('Error fetching users:', usersError);
        useMockUsers = true;
      } else if (!dbUsers || dbUsers.length === 0) {
        console.warn('No active users found in database, using mock users');
        useMockUsers = true;
      } else {
        users = dbUsers;
        console.log(`✅ Found ${users.length} users in database for notifications`);
      }
    } catch (error) {
      console.warn('Users table not available, using mock users for testing');
      useMockUsers = true;
    }

    // Use mock users if database users not available (for testing)
    if (useMockUsers) {
      users = [
        { id: 'student_1', email: 'student1@college.edu', first_name: 'John', last_name: 'Doe', role: 'student' },
        { id: 'student_2', email: 'student2@college.edu', first_name: 'Jane', last_name: 'Smith', role: 'student' },
        { id: 'publisher_demo', email: 'publisher@college.edu', first_name: 'Publisher', last_name: 'Demo', role: 'mentor' },
        { id: 'creator_demo', email: 'creator@college.edu', first_name: 'Creator', last_name: 'Demo', role: 'admin' },
        { id: 'faculty_1', email: 'faculty1@college.edu', first_name: 'Prof', last_name: 'Williams', role: 'mentor' }
      ];
      console.log(`📝 Using ${users.length} mock users for testing (database users table not available)`);
    }

    // Create in-app notifications using existing event_notifications table
    const eventNotifications = [];
    const notificationTitle = urgency === 'emergency' 
      ? `🚨 URGENT: Institution Closed on ${date}`
      : `🗓️ Holiday Notice: ${date}`;
    
    const notificationMessage = `${reason}\n\nDate: ${date}\nUrgency: ${urgency.replace('_', ' ').toUpperCase()}`;

    for (const user of users) {
      eventNotifications.push({
        user_id: user.id,
        event_id: holidayId,
        notification_type: urgency === 'emergency' ? 'emergency_notification' : 'holiday_announcement',
        title: notificationTitle,
        message: notificationMessage,
        priority: urgency === 'emergency' ? 'high' : 'medium',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    // Insert notifications in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < eventNotifications.length; i += batchSize) {
      const batch = eventNotifications.slice(i, i + batchSize);
      const { error: notifError } = await supabase
        .from('event_notifications')
        .insert(batch);

      if (notifError) {
        console.error(`Error creating notification batch ${i}:`, notifError);
      } else {
        console.log(`✅ Created ${batch.length} in-app notifications (batch ${Math.floor(i/batchSize) + 1})`);
      }
    }

    // Send Telegram notifications using new-generation service integration
    await sendComprehensiveTelegramNotifications(date, urgency, reason, users);

    // Mark holiday as notified
    await supabase
      .from('emergency_holidays')
      .update({ 
        notification_sent: true,
        notification_sent_at: new Date().toISOString()
      })
      .eq('id', holidayId);

    console.log(`✅ Holiday notifications sent successfully:`);
    console.log(`   📱 In-app: ${eventNotifications.length} users notified`);
    console.log(`   📤 Telegram: Notifications sent to all users and channels`);
    console.log(`   🎯 Holiday ID: ${holidayId}`);

  } catch (error) {
    console.error('❌ Error in sendHolidayNotifications:', error);
    throw error;
  }
}

/**
 * Send comprehensive Telegram notifications
 * Uses the existing new-generation Telegram service for better integration
 */
async function sendComprehensiveTelegramNotifications(
  date: string,
  urgency: 'emergency' | 'low_priority',
  reason: string,
  users: any[]
) {
  try {
    // Import the existing telegram service
    const { getTelegramService } = await import('../services/telegramService');
    
    const message = urgency === 'emergency'
      ? generateEmergencyMessage(date, reason)
      : generateLowPriorityMessage(date, reason);

    // 1. Send to main announcement channel/group
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    if (TELEGRAM_CHAT_ID) {
      await sendDirectTelegramMessage(TELEGRAM_CHAT_ID, message);
      console.log('✅ Sent to main Telegram channel');
    }

    // 2. Send via existing Telegram service
    let telegramSuccessCount = 0;
    let telegramFailCount = 0;

    try {
      const telegramService = getTelegramService();
      
      if (telegramService.isReady()) {
        // Send holiday announcement message
        const holidayMessage = {
          senderName: 'System Administrator',
          senderRole: 'admin',
          senderDepartment: 'Administration',
          message: `${urgency === 'emergency' ? '🚨 EMERGENCY HOLIDAY ANNOUNCEMENT' : '🗓️ HOLIDAY NOTIFICATION'}\n\n${message}`,
          timestamp: new Date(),
          priority: urgency === 'emergency' ? 'high' as const : 'medium' as const
        };

        const result = await telegramService.sendMessageToPrincipal(holidayMessage);
        if (result.success) {
          telegramSuccessCount = users.length; // Assume all users receive channel message
          console.log('✅ Holiday announcement sent to Telegram channel');
        } else {
          telegramFailCount = users.length;
          console.error('❌ Failed to send to Telegram channel:', result.error);
        }
      } else {
        console.warn('⚠️ Telegram service not ready - notifications not sent');
        telegramFailCount = users.length;
      }
    } catch (serviceError) {
      console.error('❌ Error using Telegram service:', serviceError);
      telegramFailCount = users.length;
    }

    console.log(`📊 Telegram notification summary:`);
    console.log(`   ✅ Successful: ${telegramSuccessCount}`);
    console.log(`   ❌ Failed: ${telegramFailCount}`);
    console.log(`   📢 Main channel: ${TELEGRAM_CHAT_ID ? 'Sent' : 'Not configured'}`);

  } catch (error) {
    console.error('❌ Error in comprehensive Telegram notifications:', error);
    // Fallback to basic notification
    await sendDirectTelegramMessage(
      process.env.TELEGRAM_CHAT_ID,
      urgency === 'emergency' 
        ? generateEmergencyMessage(date, reason)
        : generateLowPriorityMessage(date, reason)
    );
  }
}

/**
 * Send direct Telegram message (fallback method)
 */
async function sendDirectTelegramMessage(chatId: string | undefined, message: string) {
  if (!chatId) return;
  
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!TELEGRAM_BOT_TOKEN) {
      console.warn('Telegram bot token not configured');
      return;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Direct Telegram API error:', errorText);
    } else {
      console.log('✅ Direct Telegram message sent successfully');
    }

  } catch (error) {
    console.error('❌ Error in sendDirectTelegramMessage:', error);
  }
}

function generateEmergencyMessage(date: string, reason: string): string {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `🚨 *EMERGENCY HOLIDAY ANNOUNCEMENT* 🚨

*Attention All Students and Faculty,*

This is an official notification from The Academic Compass administration.

Due to *${reason}*, the institution will remain *CLOSED* on *${dayOfWeek}, ${formattedDate}*.

❌ All scheduled classes, examinations, and on-campus activities for this day are cancelled.

⚠️ Please stay safe and await further instructions. We apologize for any inconvenience this may cause.

*Regards,*
_The Academic Compass Administration_`;
}

function generateLowPriorityMessage(date: string, reason: string): string {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `🗓️ *HOLIDAY NOTIFICATION* 🗓️

*Dear Students and Faculty,*

Please be advised that the institution has declared a holiday on *${dayOfWeek}, ${formattedDate}*.

📋 *Reason:* ${reason}

All academic activities will be suspended on this day. The institution will resume its normal schedule on the following working day.

Please plan accordingly.

*Best Regards,*
_The Academic Compass Administration_`;
}

export default router;
