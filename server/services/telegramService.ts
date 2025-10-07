import TelegramBot from 'node-telegram-bot-api';

// ============================================================================
// TELEGRAM SERVICE FOR PUBLISHER-TO-PRINCIPAL COMMUNICATION
// ============================================================================

interface TelegramConfig {
  botToken: string;
  principalChatId: string;
}

interface MessagePayload {
  senderName: string;
  senderRole: string;
  senderDepartment: string;
  message: string;
  timestamp: Date;
  priority?: 'low' | 'medium' | 'high';
}

interface SendMessageResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

interface ExamNotificationPayload {
  type: 'midterm' | 'endterm';
  subject: string;
  date: string;
  time: string;
  duration?: string;
  instructions?: string;
  topics?: string;
  creatorName?: string;
  departmentName?: string;
}

interface AssignmentNotificationPayload {
  title: string;
  subject: string;
  dueDate: string;
  dueTime?: string;
  description?: string;
  maxMarks?: string;
  submissionFormat?: string;
  creatorName?: string;
  departmentName?: string;
}

interface EventNotificationPayload {
  title: string;
  eventType: string;
  startDate: string;
  startTime: string;
  endTime?: string;
  venue?: string;
  description?: string;
  expectedParticipants?: number;
  creatorName?: string;
  departmentName?: string;
  reminderMinutes?: number;
}

/**
 * Telegram Service for handling publisher-to-principal communication
 * Allows publishers to send messages directly to the principal via Telegram bot
 * Also handles exam and assignment notifications to students/publishers
 */
export class TelegramService {
  private bot: TelegramBot | null = null;
  private config: TelegramConfig;
  private isInitialized: boolean = false;

  constructor() {
    this.config = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      principalChatId: process.env.TELEGRAM_PRINCIPAL_CHAT_ID || ''
    };
  }

  /**
   * Initialize the Telegram bot
   */
  public async initialize(): Promise<boolean> {
    try {
      if (!this.config.botToken) {
        console.error('❌ TELEGRAM_BOT_TOKEN environment variable is not set');
        return false;
      }

      if (!this.config.principalChatId) {
        console.error('❌ TELEGRAM_PRINCIPAL_CHAT_ID environment variable is not set');
        return false;
      }

      // Create bot instance
      this.bot = new TelegramBot(this.config.botToken, { polling: false });

      // Test the bot connection
      const me = await this.bot.getMe();
      console.log(`✅ Telegram bot initialized successfully: @${me.username}`);
      
      this.isInitialized = true;
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Telegram bot:', error);
      return false;
    }
  }

  /**
   * Send a message from publisher to principal
   */
  public async sendMessageToPrincipal(payload: MessagePayload): Promise<SendMessageResult> {
    try {
      if (!this.isInitialized || !this.bot) {
        return {
          success: false,
          error: 'Telegram bot is not initialized'
        };
      }

      // Format the message for the principal
      const formattedMessage = this.formatMessageForPrincipal(payload);

      // Send message to principal
      const result = await this.bot.sendMessage(
        this.config.principalChatId,
        formattedMessage,
        {
          parse_mode: 'HTML',
          disable_notification: payload.priority === 'low'
        }
      );

      console.log(`✅ Message sent to principal from ${payload.senderName}`);

      return {
        success: true,
        messageId: result.message_id
      };

    } catch (error) {
      console.error('❌ Failed to send message to principal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send a notification about urgent matters
   */
  public async sendUrgentNotification(payload: MessagePayload): Promise<SendMessageResult> {
    try {
      if (!this.isInitialized || !this.bot) {
        return {
          success: false,
          error: 'Telegram bot is not initialized'
        };
      }

      const urgentMessage = `
🚨 <b>URGENT MESSAGE</b> 🚨

<b>From:</b> ${payload.senderName}
<b>Role:</b> ${payload.senderRole}
<b>Department:</b> ${payload.senderDepartment}
<b>Time:</b> ${payload.timestamp.toLocaleString()}

<b>Message:</b>
${payload.message}

⚠️ <i>This message requires immediate attention</i>
`;

      const result = await this.bot.sendMessage(
        this.config.principalChatId,
        urgentMessage,
        {
          parse_mode: 'HTML',
          disable_notification: false // Always notify for urgent messages
        }
      );

      return {
        success: true,
        messageId: result.message_id
      };

    } catch (error) {
      console.error('❌ Failed to send urgent notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send a daily summary of messages (optional feature)
   */
  public async sendDailySummary(messages: MessagePayload[]): Promise<SendMessageResult> {
    try {
      if (!this.isInitialized || !this.bot || messages.length === 0) {
        return {
          success: false,
          error: 'No messages to summarize or bot not initialized'
        };
      }

      const summary = `
📊 <b>Daily Summary - ${new Date().toLocaleDateString()}</b>

<b>Total Messages:</b> ${messages.length}

${messages.map((msg, index) => `
<b>${index + 1}.</b> <b>${msg.senderName}</b> (${msg.senderDepartment})
<i>${msg.message.substring(0, 100)}${msg.message.length > 100 ? '...' : ''}</i>
`).join('\n')}

📱 <i>Summary generated by PyGram 2025 System</i>
`;

      const result = await this.bot.sendMessage(
        this.config.principalChatId,
        summary,
        {
          parse_mode: 'HTML'
        }
      );

      return {
        success: true,
        messageId: result.message_id
      };

    } catch (error) {
      console.error('❌ Failed to send daily summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Format message for principal with proper structure
   */
  private formatMessageForPrincipal(payload: MessagePayload): string {
    const priorityIcon = {
      'low': '🔵',
      'medium': '🟡',
      'high': '🔴'
    };

    const icon = priorityIcon[payload.priority || 'medium'];
    
    return `
${icon} <b>Message from Publisher</b>

<b>From:</b> ${payload.senderName}
<b>Role:</b> ${payload.senderRole}
<b>Department:</b> ${payload.senderDepartment}
<b>Priority:</b> ${payload.priority || 'Medium'}
<b>Time:</b> ${payload.timestamp.toLocaleString()}

<b>Message:</b>
${payload.message}

📱 <i>Sent via PyGram 2025 System</i>
`;
  }

  /**
   * Test the bot connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      if (!this.bot) {
        return false;
      }

      await this.bot.getMe();
      return true;
    } catch (error) {
      console.error('❌ Telegram bot connection test failed:', error);
      return false;
    }
  }

  /**
   * Get bot information
   */
  public async getBotInfo(): Promise<any> {
    try {
      if (!this.bot) {
        return null;
      }

      return await this.bot.getMe();
    } catch (error) {
      console.error('❌ Failed to get bot info:', error);
      return null;
    }
  }

  /**
   * Send exam notification to a Telegram chat
   */
  public async sendExamNotification(
    chatId: string,
    payload: ExamNotificationPayload
  ): Promise<SendMessageResult> {
    try {
      if (!this.isInitialized || !this.bot) {
        return {
          success: false,
          error: 'Telegram bot is not initialized'
        };
      }

      const formattedMessage = this.formatExamNotification(payload);

      const result = await this.bot.sendMessage(chatId, formattedMessage, {
        parse_mode: 'HTML',
        disable_notification: false
      });

      console.log(`✅ Exam notification sent to chat ${chatId}`);

      return {
        success: true,
        messageId: result.message_id
      };
    } catch (error) {
      console.error('❌ Failed to send exam notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send assignment notification to a Telegram chat
   */
  public async sendAssignmentNotification(
    chatId: string,
    payload: AssignmentNotificationPayload
  ): Promise<SendMessageResult> {
    try {
      if (!this.isInitialized || !this.bot) {
        return {
          success: false,
          error: 'Telegram bot is not initialized'
        };
      }

      const formattedMessage = this.formatAssignmentNotification(payload);

      const result = await this.bot.sendMessage(chatId, formattedMessage, {
        parse_mode: 'HTML',
        disable_notification: false
      });

      console.log(`✅ Assignment notification sent to chat ${chatId}`);

      return {
        success: true,
        messageId: result.message_id
      };
    } catch (error) {
      console.error('❌ Failed to send assignment notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Broadcast exam notification to multiple chats
   */
  public async broadcastExamNotification(
    chatIds: string[],
    payload: ExamNotificationPayload
  ): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    for (const chatId of chatIds) {
      const result = await this.sendExamNotification(chatId, payload);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`📊 Exam broadcast complete: ${successful} successful, ${failed} failed`);
    return { successful, failed };
  }

  /**
   * Broadcast assignment notification to multiple chats
   */
  public async broadcastAssignmentNotification(
    chatIds: string[],
    payload: AssignmentNotificationPayload
  ): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    for (const chatId of chatIds) {
      const result = await this.sendAssignmentNotification(chatId, payload);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`📊 Assignment broadcast complete: ${successful} successful, ${failed} failed`);
    return { successful, failed };
  }

  /**
   * Format exam notification message
   */
  private formatExamNotification(payload: ExamNotificationPayload): string {
    const examTypeIcon = payload.type === 'midterm' ? '📝' : '🎓';
    const examTypeName = payload.type === 'midterm' ? 'Mid-term' : 'End-term';
    
    let message = `
${examTypeIcon} <b>${examTypeName} Exam Scheduled</b>

<b>Subject:</b> ${payload.subject}
<b>Date:</b> ${payload.date}
<b>Time:</b> ${payload.time}`;

    if (payload.duration) {
      message += `\n<b>Duration:</b> ${payload.duration}`;
    }

    if (payload.topics) {
      message += `\n\n<b>Topics Covered:</b>\n${payload.topics}`;
    }

    if (payload.instructions) {
      message += `\n\n<b>Instructions:</b>\n${payload.instructions}`;
    }

    if (payload.creatorName) {
      message += `\n\n<b>Posted by:</b> ${payload.creatorName}`;
    }

    if (payload.departmentName) {
      message += `\n<b>Department:</b> ${payload.departmentName}`;
    }

    message += `\n\n📱 <i>Notification from Py-Gram 2k25</i>`;

    return message;
  }

  /**
   * Format assignment notification message
   */
  private formatAssignmentNotification(payload: AssignmentNotificationPayload): string {
    let message = `
📚 <b>New Assignment Posted</b>

<b>Title:</b> ${payload.title}
<b>Subject:</b> ${payload.subject}
<b>Due Date:</b> ${payload.dueDate}`;

    if (payload.dueTime) {
      message += `\n<b>Due Time:</b> ${payload.dueTime}`;
    }

    if (payload.maxMarks) {
      message += `\n<b>Maximum Marks:</b> ${payload.maxMarks}`;
    }

    if (payload.submissionFormat) {
      message += `\n<b>Submission Format:</b> ${payload.submissionFormat}`;
    }

    if (payload.description) {
      message += `\n\n<b>Description:</b>\n${payload.description}`;
    }

    if (payload.creatorName) {
      message += `\n\n<b>Posted by:</b> ${payload.creatorName}`;
    }

    if (payload.departmentName) {
      message += `\n<b>Department:</b> ${payload.departmentName}`;
    }

    message += `\n\n📱 <i>Notification from Py-Gram 2k25</i>`;

    return message;
  }

  /**
   * Send event notification to a Telegram chat
   */
  public async sendEventNotification(
    chatId: string,
    payload: EventNotificationPayload
  ): Promise<SendMessageResult> {
    try {
      if (!this.isInitialized || !this.bot) {
        return {
          success: false,
          error: 'Telegram bot is not initialized'
        };
      }

      const formattedMessage = this.formatEventNotification(payload);

      const result = await this.bot.sendMessage(chatId, formattedMessage, {
        parse_mode: 'HTML',
        disable_notification: false
      });

      console.log(`✅ Event notification sent to chat ${chatId}`);

      return {
        success: true,
        messageId: result.message_id
      };
    } catch (error) {
      console.error('❌ Failed to send event notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Broadcast event notification to multiple chats
   */
  public async broadcastEventNotification(
    chatIds: string[],
    payload: EventNotificationPayload
  ): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    for (const chatId of chatIds) {
      const result = await this.sendEventNotification(chatId, payload);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`📊 Event broadcast complete: ${successful} successful, ${failed} failed`);
    return { successful, failed };
  }

  /**
   * Format event notification message
   */
  private formatEventNotification(payload: EventNotificationPayload): string {
    const eventTypeIcons: Record<string, string> = {
      'workshop': '🎓',
      'seminar': '📊',
      'conference': '🎤',
      'cultural': '🎭',
      'sports': '⚽',
      'technical': '💻',
      'orientation': '🎯',
      'examination': '📝',
      'meeting': '👥',
      'other': '📅'
    };

    const icon = eventTypeIcons[payload.eventType.toLowerCase()] || '📅';
    
    let message = `
${icon} <b>Event Notification</b>

<b>Event:</b> ${payload.title}
<b>Type:</b> ${payload.eventType}
<b>Date:</b> ${payload.startDate}
<b>Time:</b> ${payload.startTime}`;

    if (payload.endTime) {
      message += ` - ${payload.endTime}`;
    }

    if (payload.venue) {
      message += `\n<b>Venue:</b> ${payload.venue}`;
    }

    if (payload.expectedParticipants) {
      message += `\n<b>Expected Participants:</b> ${payload.expectedParticipants}`;
    }

    if (payload.description) {
      message += `\n\n<b>Description:</b>\n${payload.description}`;
    }

    if (payload.creatorName) {
      message += `\n\n<b>Organized by:</b> ${payload.creatorName}`;
    }

    if (payload.departmentName) {
      message += `\n<b>Department:</b> ${payload.departmentName}`;
    }

    if (payload.reminderMinutes) {
      const hours = Math.floor(payload.reminderMinutes / 60);
      const mins = payload.reminderMinutes % 60;
      let reminderText = '';
      if (hours > 0) reminderText += `${hours}h `;
      if (mins > 0) reminderText += `${mins}m`;
      message += `\n\n⏰ <i>Reminder: ${reminderText.trim()} before event</i>`;
    }

    message += `\n\n📱 <i>Notification from Py-Gram 2k25</i>`;

    return message;
  }

  /**
   * Check if the service is ready to send messages
   */
  public isReady(): boolean {
    return this.isInitialized && this.bot !== null && 
           this.config.botToken !== '' && this.config.principalChatId !== '';
  }

  /**
   * Gracefully shutdown the bot
   */
  public async shutdown(): Promise<void> {
    try {
      if (this.bot) {
        await this.bot.stopPolling();
        this.bot = null;
        this.isInitialized = false;
        console.log('✅ Telegram bot service shutdown successfully');
      }
    } catch (error) {
      console.error('❌ Error during Telegram bot shutdown:', error);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let telegramServiceInstance: TelegramService | null = null;

/**
 * Get the singleton instance of TelegramService
 */
export function getTelegramService(): TelegramService {
  if (!telegramServiceInstance) {
    telegramServiceInstance = new TelegramService();
  }
  return telegramServiceInstance;
}

/**
 * Initialize the Telegram service (call this on server startup)
 */
export async function initializeTelegramService(): Promise<boolean> {
  const service = getTelegramService();
  return await service.initialize();
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type { 
  MessagePayload, 
  SendMessageResult, 
  TelegramConfig,
  ExamNotificationPayload,
  AssignmentNotificationPayload,
  EventNotificationPayload
};