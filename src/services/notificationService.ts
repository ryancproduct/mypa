import { pwaService } from './pwaService';
import type { Task } from '../types';
import { isOverdue, isDueToday } from '../utils/dateUtils';

interface NotificationOptions {
  title: string;
  body: string;
  tag?: string;
  data?: any;
  actions?: { action: string; title: string }[];
  icon?: string;
  badge?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

export class NotificationService {
  private scheduledNotifications = new Map<string, NodeJS.Timeout>();
  
  async initialize(): Promise<boolean> {
    const permission = await pwaService.requestNotificationPermission();
    return permission === 'granted';
  }

  async showTaskReminder(task: Task): Promise<void> {
    const options: NotificationOptions = {
      title: '📋 Task Reminder',
      body: task.content,
      tag: `task-${task.id}`,
      data: { taskId: task.id, type: 'task-reminder' },
      actions: [
        { action: 'complete', title: 'Mark Complete' },
        { action: 'snooze', title: 'Snooze 1h' }
      ],
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      requireInteraction: true
    };

    await pwaService.showNotification(options.title, options);
  }

  async showDailyDigest(tasks: Task[]): Promise<void> {
    const overdueTasks = tasks.filter(t => t.dueDate && isOverdue(t.dueDate) && t.status !== 'completed');
    const dueTodayTasks = tasks.filter(t => t.dueDate && isDueToday(t.dueDate) && t.status !== 'completed');
    
    let body = '';
    if (overdueTasks.length > 0) {
      body += `⚠️ ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}\n`;
    }
    if (dueTodayTasks.length > 0) {
      body += `📅 ${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? 's' : ''} due today\n`;
    }
    if (!body) {
      body = '✅ All caught up! Ready for a productive day.';
    }

    const options: NotificationOptions = {
      title: '🌅 Daily Task Digest',
      body: body.trim(),
      tag: 'daily-digest',
      data: { type: 'daily-digest' },
      actions: [
        { action: 'open', title: 'Open MyPA' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg'
    };

    await pwaService.showNotification(options.title, options);
  }

  async showOverdueAlert(tasks: Task[]): Promise<void> {
    if (tasks.length === 0) return;

    const options: NotificationOptions = {
      title: '⚠️ Overdue Tasks Alert',
      body: `You have ${tasks.length} overdue task${tasks.length > 1 ? 's' : ''} that need attention.`,
      tag: 'overdue-alert',
      data: { type: 'overdue-alert', taskIds: tasks.map(t => t.id) },
      actions: [
        { action: 'review', title: 'Review Tasks' },
        { action: 'snooze', title: 'Remind Later' }
      ],
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      requireInteraction: true
    };

    await pwaService.showNotification(options.title, options);
  }

  scheduleTaskReminder(task: Task): void {
    if (!task.dueDate) return;

    const dueTime = new Date(task.dueDate);
    const now = new Date();
    
    // Schedule reminder 1 hour before due time (if due time is specified) or at 9 AM on due date
    const reminderTime = new Date(dueTime);
    if (dueTime.getHours() === 0 && dueTime.getMinutes() === 0) {
      // No specific time, remind at 9 AM
      reminderTime.setHours(9, 0, 0, 0);
    } else {
      // Remind 1 hour before
      reminderTime.setHours(reminderTime.getHours() - 1);
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    if (timeUntilReminder > 0 && timeUntilReminder <= 7 * 24 * 60 * 60 * 1000) { // Within 7 days
      const timeoutId = setTimeout(() => {
        this.showTaskReminder(task);
        this.scheduledNotifications.delete(task.id);
      }, timeUntilReminder);
      
      this.scheduledNotifications.set(task.id, timeoutId);
    }
  }

  cancelTaskReminder(taskId: string): void {
    const timeoutId = this.scheduledNotifications.get(taskId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledNotifications.delete(taskId);
    }
  }

  scheduleDailyDigest(): void {
    const scheduleNext = () => {
      const now = new Date();
      const nextDigest = new Date();
      nextDigest.setHours(8, 0, 0, 0); // 8 AM daily
      
      if (nextDigest <= now) {
        nextDigest.setDate(nextDigest.getDate() + 1);
      }
      
      const timeUntilDigest = nextDigest.getTime() - now.getTime();
      
      setTimeout(() => {
        // This would be called with actual task data in a real implementation
        // For now, we'll just schedule the next one
        scheduleNext();
      }, timeUntilDigest);
    };
    
    scheduleNext();
  }

  // Handle notification clicks (for service worker context)
  handleNotificationClick(event: any): void {
    const data = event.notification.data;
    
    switch (data?.type) {
      case 'task-reminder':
        // Navigate to specific task
        event.waitUntil(
          this.focusOrOpenApp(`/?task=${data.taskId}`)
        );
        break;
      case 'daily-digest':
      case 'overdue-alert':
        // Navigate to main app
        event.waitUntil(
          this.focusOrOpenApp('/')
        );
        break;
    }
    
    event.notification.close();
  }

  // Handle notification actions (for service worker context)
  handleNotificationAction(event: any, action: string): void {
    const data = event.notification.data;
    
    switch (action) {
      case 'complete':
        if (data?.taskId) {
          // This would integrate with the task store to mark as complete
          console.log('Mark task complete:', data.taskId);
        }
        break;
      case 'snooze':
        if (data?.taskId) {
          // Reschedule reminder for 1 hour later
          setTimeout(() => {
            // Re-fetch task and show reminder again
          }, 60 * 60 * 1000);
        }
        break;
      case 'open':
      case 'review':
        event.waitUntil(
          this.focusOrOpenApp('/')
        );
        break;
    }
    
    event.notification.close();
  }

  private async focusOrOpenApp(url: string = '/'): Promise<void> {
    // This would be called from service worker context
    // For now, just log the action
    console.log('Focus or open app:', url);
  }

  // Check for overdue tasks and send alerts
  async checkOverdueTasks(tasks: Task[]): Promise<void> {
    const overdueTasks = tasks.filter(t => 
      t.dueDate && isOverdue(t.dueDate) && t.status !== 'completed'
    );
    
    if (overdueTasks.length > 0) {
      // Don't spam notifications - only show if it's been a while since last one
      const lastAlertKey = 'last-overdue-alert';
      const lastAlert = localStorage.getItem(lastAlertKey);
      const now = new Date().getTime();
      
      if (!lastAlert || now - parseInt(lastAlert) > 4 * 60 * 60 * 1000) { // 4 hours
        await this.showOverdueAlert(overdueTasks);
        localStorage.setItem(lastAlertKey, now.toString());
      }
    }
  }
}

// Global notification service instance
export const notificationService = new NotificationService();