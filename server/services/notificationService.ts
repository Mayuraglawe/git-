import { getSupabaseClient } from '../../shared/supabase';
import { getTelegramService, ExamNotificationPayload, AssignmentNotificationPayload } from './telegramService';

interface NotificationPayload {
  type: 'exam_scheduled' | 'assignment_posted';
  title: string;
  message: string;
  from_user_id: string;
  to_user_id: string;
  exam_id?: string;
  assignment_id?: string;
}

// In-memory storage for notifications (in production, this would be a database)
const notificationStore: Array<NotificationPayload & { id: string; created_at: string; is_read: boolean }> = [];

class NotificationService {
  private supabase = getSupabaseClient();

  /**
   * Send notification to a specific user
   */
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      // Create notification with unique ID and timestamp
      const notification = {
        ...payload,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        is_read: false
      };
      
      // Store notification in memory (in production, save to database)
      notificationStore.push(notification);
      
      console.log('📧 Notification sent and stored:', {
        id: notification.id,
        to: payload.to_user_id,
        type: payload.type,
        title: payload.title,
        message: payload.message
      });
      
      // TODO: In production, you would:
      // 1. Save to a notifications table in Supabase
      // 2. Send real-time updates via Supabase realtime
      // 3. Send email/push notifications
      
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Get notifications for a specific user
   */
  async getUserNotifications(userId: string): Promise<Array<NotificationPayload & { id: string; created_at: string; is_read: boolean }>> {
    return notificationStore.filter(notif => notif.to_user_id === userId);
  }

  /**
   * Get all notifications (for debugging)
   */
  getAllNotifications(): Array<NotificationPayload & { id: string; created_at: string; is_read: boolean }> {
    return [...notificationStore];
  }

  /**
   * Get all users in a department (students and publishers)
   */
  async getDepartmentUsers(departmentId: string): Promise<Array<{id: string, role: string, mentor_type?: string, telegram_chat_id?: string}>> {
    // Mock data representing actual users that might be in the auth system
    // This simulates different users who could receive notifications
    
    return [
      // Students - using various possible user IDs
      { id: 'student_1', role: 'student', telegram_chat_id: process.env.TELEGRAM_STUDENT_CHAT_ID },
      { id: 'demo_student_1693394400000', role: 'student', telegram_chat_id: process.env.TELEGRAM_STUDENT_CHAT_ID },
      { id: '6', role: 'student', telegram_chat_id: process.env.TELEGRAM_STUDENT_CHAT_ID },
      { id: '7', role: 'student', telegram_chat_id: process.env.TELEGRAM_STUDENT_CHAT_ID },
      
      // Publishers - using actual auth system IDs
      { id: 'publisher_demo', role: 'mentor', mentor_type: 'publisher', telegram_chat_id: process.env.TELEGRAM_PUBLISHER_CHAT_ID },
      { id: '3', role: 'mentor', mentor_type: 'publisher', telegram_chat_id: process.env.TELEGRAM_PUBLISHER_CHAT_ID },
      { id: '5', role: 'mentor', mentor_type: 'publisher', telegram_chat_id: process.env.TELEGRAM_PUBLISHER_CHAT_ID },
      
      // Additional demo user patterns that might exist
      { id: 'demo_mentor_1693394400000', role: 'mentor', mentor_type: 'publisher', telegram_chat_id: process.env.TELEGRAM_PUBLISHER_CHAT_ID },
      { id: 'demo_student_1693394401000', role: 'student', telegram_chat_id: process.env.TELEGRAM_STUDENT_CHAT_ID }
    ];
  }

  /**
   * Send exam notification to all students and publishers in department
   * Also sends Telegram notifications if configured
   */
  async sendExamNotifications(
    creatorId: string, 
    departmentId: string, 
    examId: string, 
    examDetails: { type: string, subject: string, date: string, time: string, duration?: string, instructions?: string, topics?: string, creatorName?: string, departmentName?: string }
  ): Promise<void> {
    try {
      const users = await this.getDepartmentUsers(departmentId);
      
      // Send in-app notifications
      const notificationPromises = users.map(user => {
        const payload: NotificationPayload = {
          type: 'exam_scheduled',
          title: `${examDetails.type} Exam Scheduled`,
          message: `${examDetails.type} exam for ${examDetails.subject} has been scheduled on ${examDetails.date} at ${examDetails.time}.`,
          from_user_id: creatorId,
          to_user_id: user.id,
          exam_id: examId
        };
        
        return this.sendNotification(payload);
      });
      
      await Promise.all(notificationPromises);
      console.log(`✅ In-app exam notifications sent to ${users.length} users in department ${departmentId}`);

      // Send Telegram notifications
      const telegramService = getTelegramService();
      if (telegramService.isReady()) {
        const telegramPayload: ExamNotificationPayload = {
          type: examDetails.type as 'midterm' | 'endterm',
          subject: examDetails.subject,
          date: examDetails.date,
          time: examDetails.time,
          duration: examDetails.duration,
          instructions: examDetails.instructions,
          topics: examDetails.topics,
          creatorName: examDetails.creatorName,
          departmentName: examDetails.departmentName
        };

        // Collect unique Telegram chat IDs
        const chatIds = [...new Set(
          users
            .map(user => user.telegram_chat_id)
            .filter(chatId => chatId && chatId !== '')
        )] as string[];

        if (chatIds.length > 0) {
          const telegramResult = await telegramService.broadcastExamNotification(
            chatIds,
            telegramPayload
          );
          console.log(`📱 Telegram exam notifications: ${telegramResult.successful} sent, ${telegramResult.failed} failed`);
        } else {
          console.log('ℹ️ No Telegram chat IDs configured for exam notifications');
        }
      } else {
        console.log('ℹ️ Telegram service not ready - skipping Telegram notifications');
      }
    } catch (error) {
      console.error('Failed to send exam notifications:', error);
    }
  }

  /**
   * Send assignment notification to all students and publishers in department
   * Also sends Telegram notifications if configured
   */
  async sendAssignmentNotifications(
    creatorId: string, 
    departmentId: string, 
    assignmentId: string, 
    assignmentDetails: { title: string, subject: string, dueDate: string, dueTime?: string, description?: string, maxMarks?: string, submissionFormat?: string, creatorName?: string, departmentName?: string }
  ): Promise<void> {
    try {
      const users = await this.getDepartmentUsers(departmentId);
      
      // Send in-app notifications
      const notificationPromises = users.map(user => {
        const payload: NotificationPayload = {
          type: 'assignment_posted',
          title: 'New Assignment Posted',
          message: `Assignment "${assignmentDetails.title}" for ${assignmentDetails.subject} has been posted. Due date: ${assignmentDetails.dueDate}.`,
          from_user_id: creatorId,
          to_user_id: user.id,
          assignment_id: assignmentId
        };
        
        return this.sendNotification(payload);
      });
      
      await Promise.all(notificationPromises);
      console.log(`✅ In-app assignment notifications sent to ${users.length} users in department ${departmentId}`);

      // Send Telegram notifications
      const telegramService = getTelegramService();
      if (telegramService.isReady()) {
        const telegramPayload: AssignmentNotificationPayload = {
          title: assignmentDetails.title,
          subject: assignmentDetails.subject,
          dueDate: assignmentDetails.dueDate,
          dueTime: assignmentDetails.dueTime,
          description: assignmentDetails.description,
          maxMarks: assignmentDetails.maxMarks,
          submissionFormat: assignmentDetails.submissionFormat,
          creatorName: assignmentDetails.creatorName,
          departmentName: assignmentDetails.departmentName
        };

        // Collect unique Telegram chat IDs
        const chatIds = [...new Set(
          users
            .map(user => user.telegram_chat_id)
            .filter(chatId => chatId && chatId !== '')
        )] as string[];

        if (chatIds.length > 0) {
          const telegramResult = await telegramService.broadcastAssignmentNotification(
            chatIds,
            telegramPayload
          );
          console.log(`📱 Telegram assignment notifications: ${telegramResult.successful} sent, ${telegramResult.failed} failed`);
        } else {
          console.log('ℹ️ No Telegram chat IDs configured for assignment notifications');
        }
      } else {
        console.log('ℹ️ Telegram service not ready - skipping Telegram notifications');
      }
    } catch (error) {
      console.error('Failed to send assignment notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();

// Export the notification store for API access
export { notificationStore };