/**
 * Telegram Emergency Holiday Notification API
 * Server-side endpoint for sending emergency holiday notifications
 */

import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

const router = express.Router();

// Initialize Telegram Bot (configure with your bot token)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = BOT_TOKEN ? new TelegramBot(BOT_TOKEN, { polling: false }) : null;

// Group chat IDs (store these in database or environment variables)
const TELEGRAM_GROUPS = {
  students: process.env.TELEGRAM_STUDENTS_GROUP || '',
  faculty: process.env.TELEGRAM_FACULTY_GROUP || '',
  publishers: process.env.TELEGRAM_PUBLISHERS_GROUP || ''
};

/**
 * POST /api/telegram/emergency-holiday
 * Send emergency holiday notification to Telegram groups
 */
router.post('/emergency-holiday', async (req, res) => {
  try {
    const { message, recipients, priority, parse_mode = 'Markdown', disable_notification } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    if (!bot) {
      return res.status(500).json({
        success: false,
        error: 'Telegram bot not configured'
      });
    }

    const results = {
      success: [],
      failed: [],
      total: 0
    };

    // Send to students group
    if (recipients.students && TELEGRAM_GROUPS.students) {
      try {
        await bot.sendMessage(TELEGRAM_GROUPS.students, message, {
          parse_mode,
          disable_notification: priority === 'low' ? true : false
        });
        results.success.push('students');
      } catch (error) {
        console.error('Failed to send to students group:', error);
        results.failed.push('students');
      }
      results.total++;
    }

    // Send to faculty group
    if (recipients.faculty && TELEGRAM_GROUPS.faculty) {
      try {
        await bot.sendMessage(TELEGRAM_GROUPS.faculty, message, {
          parse_mode,
          disable_notification: priority === 'low' ? true : false
        });
        results.success.push('faculty');
      } catch (error) {
        console.error('Failed to send to faculty group:', error);
        results.failed.push('faculty');
      }
      results.total++;
    }

    // Send to publishers group
    if (recipients.publishers && TELEGRAM_GROUPS.publishers) {
      try {
        await bot.sendMessage(TELEGRAM_GROUPS.publishers, message, {
          parse_mode,
          disable_notification: priority === 'low' ? true : false
        });
        results.success.push('publishers');
      } catch (error) {
        console.error('Failed to send to publishers group:', error);
        results.failed.push('publishers');
      }
      results.total++;
    }

    // Log the notification
    console.log('Emergency holiday notification sent:', {
      priority,
      success: results.success,
      failed: results.failed,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      results,
      message: `Sent to ${results.success.length} out of ${results.total} groups`
    });

  } catch (error) {
    console.error('Error sending emergency holiday notification:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/telegram/test-emergency-holiday
 * Test emergency holiday notification (sends to a test group or admin)
 */
router.post('/test-emergency-holiday', async (req, res) => {
  try {
    const { message, testChatId } = req.body;

    if (!bot) {
      return res.status(500).json({
        success: false,
        error: 'Telegram bot not configured'
      });
    }

    const chatId = testChatId || process.env.TELEGRAM_TEST_CHAT_ID;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Test chat ID not provided'
      });
    }

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });

    return res.status(200).json({
      success: true,
      message: 'Test notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/telegram/groups-status
 * Check the status of configured Telegram groups
 */
router.get('/groups-status', async (req, res) => {
  try {
    const status = {
      students: {
        configured: !!TELEGRAM_GROUPS.students,
        chatId: TELEGRAM_GROUPS.students ? 'Set' : 'Not set'
      },
      faculty: {
        configured: !!TELEGRAM_GROUPS.faculty,
        chatId: TELEGRAM_GROUPS.faculty ? 'Set' : 'Not set'
      },
      publishers: {
        configured: !!TELEGRAM_GROUPS.publishers,
        chatId: TELEGRAM_GROUPS.publishers ? 'Set' : 'Not set'
      },
      bot: {
        configured: !!bot,
        status: bot ? 'Active' : 'Not configured'
      }
    };

    return res.status(200).json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Error checking groups status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check status'
    });
  }
});

export default router;
