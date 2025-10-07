import { Router, Request, Response } from 'express';
import { getTelegramService } from '../services/telegramService';
import type { EventNotificationPayload } from '../services/telegramService';

const router = Router();

/**
 * POST /api/telegram/event-notification
 * Send event notification to Telegram chat(s)
 */
router.post('/event-notification', async (req: Request, res: Response) => {
  try {
    const telegramService = getTelegramService();

    // Check if service is ready
    if (!telegramService.isReady()) {
      return res.status(503).json({
        success: false,
        error: 'Telegram service is not initialized. Please check bot configuration.'
      });
    }

    const { chatId, chatIds, event } = req.body;

    // Validate request
    if (!event || !event.title) {
      return res.status(400).json({
        success: false,
        error: 'Event data is required with at least a title'
      });
    }

    if (!chatId && (!chatIds || chatIds.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Either chatId or chatIds array is required'
      });
    }

    // Prepare notification payload
    const payload: EventNotificationPayload = {
      title: event.title,
      eventType: event.event_type || event.eventType || 'Event',
      startDate: event.start_date || event.startDate,
      startTime: event.start_time || event.startTime,
      endTime: event.end_time || event.endTime,
      venue: event.venue,
      description: event.description,
      expectedParticipants: event.expected_participants || event.expectedParticipants,
      creatorName: event.creator_name || event.creatorName,
      departmentName: event.department_name || event.departmentName,
      reminderMinutes: event.reminder_minutes || event.reminderMinutes
    };

    // Send to single chat or broadcast to multiple
    if (chatId) {
      // Single recipient
      const result = await telegramService.sendEventNotification(chatId, payload);
      
      if (result.success) {
        return res.json({
          success: true,
          message: 'Event notification sent successfully',
          messageId: result.messageId
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to send notification'
        });
      }
    } else {
      // Multiple recipients (broadcast)
      const results = await telegramService.broadcastEventNotification(chatIds, payload);
      
      return res.json({
        success: true,
        message: `Event notification broadcast completed`,
        successful: results.successful,
        failed: results.failed,
        total: chatIds.length
      });
    }

  } catch (error) {
    console.error('Error in event notification endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/telegram/event-reminder
 * Send event reminder to Telegram chat(s)
 */
router.post('/event-reminder', async (req: Request, res: Response) => {
  try {
    const telegramService = getTelegramService();

    if (!telegramService.isReady()) {
      return res.status(503).json({
        success: false,
        error: 'Telegram service is not initialized'
      });
    }

    const { chatId, chatIds, event, minutesBefore } = req.body;

    if (!event || !event.title) {
      return res.status(400).json({
        success: false,
        error: 'Event data is required'
      });
    }

    if (!chatId && (!chatIds || chatIds.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Either chatId or chatIds array is required'
      });
    }

    // Prepare reminder payload with reminder-specific formatting
    const payload: EventNotificationPayload = {
      title: event.title,
      eventType: event.event_type || event.eventType || 'Event',
      startDate: event.start_date || event.startDate,
      startTime: event.start_time || event.startTime,
      endTime: event.end_time || event.endTime,
      venue: event.venue,
      description: event.description,
      expectedParticipants: event.expected_participants || event.expectedParticipants,
      creatorName: event.creator_name || event.creatorName,
      departmentName: event.department_name || event.departmentName,
      reminderMinutes: minutesBefore || 60
    };

    if (chatId) {
      const result = await telegramService.sendEventNotification(chatId, payload);
      
      if (result.success) {
        return res.json({
          success: true,
          message: 'Event reminder sent successfully',
          messageId: result.messageId
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to send reminder'
        });
      }
    } else {
      const results = await telegramService.broadcastEventNotification(chatIds, payload);
      
      return res.json({
        success: true,
        message: 'Event reminder broadcast completed',
        successful: results.successful,
        failed: results.failed,
        total: chatIds.length
      });
    }

  } catch (error) {
    console.error('Error in event reminder endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/telegram/test
 * Test Telegram bot connection
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    const telegramService = getTelegramService();
    const isReady = telegramService.isReady();
    
    if (!isReady) {
      return res.status(503).json({
        success: false,
        error: 'Telegram service is not ready',
        details: 'Check TELEGRAM_BOT_TOKEN and TELEGRAM_PRINCIPAL_CHAT_ID environment variables'
      });
    }

    const botInfo = await telegramService.getBotInfo();
    
    return res.json({
      success: true,
      message: 'Telegram bot is working correctly',
      botInfo: {
        username: botInfo?.username,
        firstName: botInfo?.first_name,
        id: botInfo?.id
      }
    });

  } catch (error) {
    console.error('Error testing Telegram bot:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
