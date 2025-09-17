import { useEffect } from 'react';
import { useMarkdownStore } from '../stores/useMarkdownStore';
import { appService } from '../services/appService';
import { isOverdue, isDueToday } from '../utils/dateUtils';
import type { Task } from '../types/index';

export const useNotifications = () => {
  const { tasks } = useMarkdownStore();

  useEffect(() => {
    const scheduleTaskNotifications = async () => {
      // Request notification permission first
      const permission = await appService.requestNotificationPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }

      // Find tasks that need reminders
      const pendingTasks = tasks.filter(task => 
        task.status === 'pending' && 
        task.dueDate && 
        !isOverdue(task.dueDate)
      );

      // Schedule notifications for due tasks
      pendingTasks.forEach(task => {
        if (task.dueDate) {
          appService.scheduleTaskReminder(task);
        }
      });

      // Show immediate notification for overdue tasks
      const overdueTasks = tasks.filter(task => 
        task.status === 'pending' && 
        task.dueDate && 
        isOverdue(task.dueDate)
      );

      if (overdueTasks.length > 0) {
        appService.showNotification('⚠️ Overdue Tasks', {
          body: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
          data: { type: 'overdue-summary', count: overdueTasks.length },
          tag: 'overdue-tasks'
        });
      }

      // Show notification for tasks due today
      const dueTodayTasks = tasks.filter(task => 
        task.status === 'pending' && 
        task.dueDate && 
        isDueToday(task.dueDate)
      );

      if (dueTodayTasks.length > 0) {
        appService.showNotification('📅 Tasks Due Today', {
          body: `${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? 's' : ''} due today`,
          data: { type: 'due-today-summary', count: dueTodayTasks.length },
          tag: 'due-today-tasks'
        });
      }
    };

    // Schedule notifications when tasks change
    scheduleTaskNotifications();
  }, [tasks]);

  return {
    requestPermission: () => appService.requestNotificationPermission(),
    scheduleReminder: (task: Task) => 
      appService.scheduleTaskReminder(task),
    showNotification: (title: string, options?: NotificationOptions) => 
      appService.showNotification(title, options)
  };
};