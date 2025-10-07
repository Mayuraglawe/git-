/**
 * Telegram Emergency Holiday Notification Service
 * Sends professional notifications to students, faculty, and publishers
 */

interface TelegramNotificationData {
  message: string;
  recipients: {
    students: boolean;
    faculty: boolean;
    publishers: boolean;
  };
  priority: 'emergency' | 'low';
  parse_mode?: string;
  disable_web_page_preview?: boolean;
}

interface HolidayData {
  title: string;
  reason: string;
  date: string;
  priority: 'emergency' | 'low';
  declared_by_name: string;
  declared_at: string;
  additional_notes?: string;
}

class TelegramEmergencyHolidayService {
  private BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || '';
  private API_URL = '/api/telegram/emergency-holiday';

  /**
   * Send emergency holiday notification
   */
  async sendEmergencyHolidayNotification(holidayData: HolidayData, recipients: any): Promise<void> {
    try {
      const message = this.formatMessage(holidayData);
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          recipients,
          priority: holidayData.priority,
          parse_mode: 'Markdown',
          disable_notification: holidayData.priority === 'low'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send Telegram notification');
      }

      const result = await response.json();
      console.log('Telegram notification sent:', result);
      
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
      throw error;
    }
  }

  /**
   * Format professional message based on priority
   */
  private formatMessage(holidayData: HolidayData): string {
    const dateFormatted = new Date(holidayData.date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const timeFormatted = new Date(holidayData.declared_at).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    if (holidayData.priority === 'emergency') {
      return this.formatEmergencyMessage(holidayData, dateFormatted, timeFormatted);
    } else {
      return this.formatLowPriorityMessage(holidayData, dateFormatted, timeFormatted);
    }
  }

  /**
   * Format emergency priority message
   */
  private formatEmergencyMessage(data: HolidayData, date: string, time: string): string {
    return `🚨 *EMERGENCY HOLIDAY DECLARATION* 🚨

━━━━━━━━━━━━━━━━━━━━━

📅 *Date of Holiday:*
${date}

📢 *Holiday Announcement:*
${data.title}

📝 *Reason:*
${data.reason}

${data.additional_notes ? `📌 *Additional Information:*\n${data.additional_notes}\n\n` : ''}👤 *Declared by:*
${data.declared_by_name}

🕒 *Notification Time:*
${time}

━━━━━━━━━━━━━━━━━━━━━

⚠️ *IMPORTANT NOTICE:*
• All classes scheduled for this day are *CANCELLED*
• All examinations, if any, are *POSTPONED*
• All college activities are *SUSPENDED*
• Campus will be *CLOSED* on this day

📱 For any urgent queries, contact your department office.

━━━━━━━━━━━━━━━━━━━━━

_This is an official notification from the institution. Please acknowledge receipt._

🏛️ ${new Date().getFullYear()} | Official Communication`;
  }

  /**
   * Format low priority message
   */
  private formatLowPriorityMessage(data: HolidayData, date: string, time: string): string {
    return `📅 *HOLIDAY NOTIFICATION*

━━━━━━━━━━━━━━━━━━━━━

📅 *Date of Holiday:*
${date}

🎉 *Holiday:*
${data.title}

📝 *Reason:*
${data.reason}

${data.additional_notes ? `📌 *Note:*\n${data.additional_notes}\n\n` : ''}👤 *Announced by:*
${data.declared_by_name}

🕒 *Announced on:*
${time}

━━━━━━━━━━━━━━━━━━━━━

ℹ️ *Please Note:*
• All classes and scheduled activities for this day are cancelled
• Make necessary arrangements accordingly
• Stay updated for any further announcements

━━━━━━━━━━━━━━━━━━━━━

_Official notification from the institution._

🏛️ ${new Date().getFullYear()} | Academic Calendar`;
  }

  /**
   * Send to specific group
   */
  async sendToGroup(groupId: string, message: string, priority: 'emergency' | 'low'): Promise<void> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          text: message,
          parse_mode: 'Markdown',
          disable_notification: priority === 'low'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send to group ${groupId}`);
      }

    } catch (error) {
      console.error(`Error sending to group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Validate and send to multiple recipients
   */
  async sendToRecipients(message: string, recipients: any, priority: 'emergency' | 'low'): Promise<any> {
    const results = {
      success: [],
      failed: [],
      total: 0
    };

    try {
      // In production, this would fetch actual group IDs from database
      const groups = {
        students: process.env.VITE_TELEGRAM_STUDENTS_GROUP || '',
        faculty: process.env.VITE_TELEGRAM_FACULTY_GROUP || '',
        publishers: process.env.VITE_TELEGRAM_PUBLISHERS_GROUP || ''
      };

      const promises = [];

      if (recipients.students && groups.students) {
        promises.push(
          this.sendToGroup(groups.students, message, priority)
            .then(() => results.success.push('students'))
            .catch(() => results.failed.push('students'))
        );
        results.total++;
      }

      if (recipients.faculty && groups.faculty) {
        promises.push(
          this.sendToGroup(groups.faculty, message, priority)
            .then(() => results.success.push('faculty'))
            .catch(() => results.failed.push('faculty'))
        );
        results.total++;
      }

      if (recipients.publishers && groups.publishers) {
        promises.push(
          this.sendToGroup(groups.publishers, message, priority)
            .then(() => results.success.push('publishers'))
            .catch(() => results.failed.push('publishers'))
        );
        results.total++;
      }

      await Promise.allSettled(promises);

      return results;

    } catch (error) {
      console.error('Error sending to recipients:', error);
      throw error;
    }
  }
}

export const telegramEmergencyService = new TelegramEmergencyHolidayService();
export default telegramEmergencyService;
