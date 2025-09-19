import { registerSW } from 'virtual:pwa-register';
import type { Task } from '../types';
import { isOverdue, isDueToday } from '../utils/dateUtils';

export interface PWAUpdateInfo {
  needRefresh: boolean;
  offlineReady: boolean;
  updateSW: () => Promise<void>;
}

interface ExtendedNotificationOptions extends NotificationOptions {
  renotify?: boolean;
  actions?: { action: string; title: string }[];
}

class AppService {
  private updateSW: (() => Promise<void>) | null = null;
  private needRefresh = false;
  private offlineReady = false;
  private listeners: ((info: PWAUpdateInfo) => void)[] = [];

  private scheduledNotifications = new Map<string, NodeJS.Timeout>();

  init() {
    if ('serviceWorker' in navigator) {
      this.updateSW = registerSW({
        onNeedRefresh: () => {
          this.needRefresh = true;
          this.notifyListeners();
        },
        onOfflineReady: () => {
          this.offlineReady = true;
          this.notifyListeners();
        },
        onRegistered: (registration) => {
          console.log('SW Registered: ', registration);
        },
        onRegisterError: (error) => {
          console.log('SW registration error', error);
        }
      });
    }
    this.initInstallPrompt();
    this.initNetworkStatus();
  }

  onUpdate(callback: (info: PWAUpdateInfo) => void) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.getInfo());
  }

  private notifyListeners() {
    const info = this.getInfo();
    this.listeners.forEach(listener => listener(info));
  }

  private getInfo(): PWAUpdateInfo {
    return {
      needRefresh: this.needRefresh,
      offlineReady: this.offlineReady,
      updateSW: this.updateSW || (() => Promise.resolve())
    };
  }

  // Install prompt for "Add to Home Screen"
  private deferredPrompt: (Event & { prompt?: () => Promise<void>; userChoice?: Promise<{ outcome: string }> }) | null = null;

  initInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('Before install prompt fired');
      e.preventDefault();
      this.deferredPrompt = e;
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.deferredPrompt = null;
    });
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('No install prompt available');
      return false;
    }

    if (this.deferredPrompt.prompt) {
      this.deferredPrompt.prompt();
    }
    const userChoice = await this.deferredPrompt.userChoice;
    const outcome = userChoice?.outcome || 'dismissed';
    console.log(`User response to the install prompt: ${outcome}`);
    
    this.deferredPrompt = null;
    return outcome === 'accepted';
  }

  canInstall(): boolean {
    return !!this.deferredPrompt;
  }

  // Check if app is already installed
  isStandalone(): boolean {
    return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  }

  // Network status
  private onlineStatus = navigator.onLine;
  private networkListeners: ((online: boolean) => void)[] = [];

  initNetworkStatus() {
    const updateOnlineStatus = () => {
      const wasOnline = this.onlineStatus;
      this.onlineStatus = navigator.onLine;
      
      if (wasOnline !== this.onlineStatus) {
        this.notifyNetworkListeners();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  onNetworkChange(callback: (online: boolean) => void) {
    this.networkListeners.push(callback);
    // Immediately call with current state
    callback(this.onlineStatus);
  }

  private notifyNetworkListeners() {
    this.networkListeners.forEach(listener => listener(this.onlineStatus));
  }

  isOnline(): boolean {
    return this.onlineStatus;
  }

  // Push notifications
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  async showNotification(title: string, options?: ExtendedNotificationOptions): Promise<void> {
    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
        // Use service worker for better reliability
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/icon-192x192.svg',
          badge: '/icon-192x192.svg',
          tag: 'mypa-notification',
          renotify: true,
          ...options
        });
      } else {
        // Fallback to regular notification
        new Notification(title, {
          icon: '/icon-192x192.svg',
          ...options
        });
      }
    }
  }

  async showTaskReminder(task: Task): Promise<void> {
    const title = '📋 Task Reminder';
    const options: ExtendedNotificationOptions = {
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

    await this.showNotification(title, options);
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

    const options: ExtendedNotificationOptions = {
      body: body.trim(),
      tag: 'daily-digest',
      data: { type: 'daily-digest' },
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      requireInteraction: false
    };

    await this.showNotification('🌅 Daily Task Digest', options);
  }

  async showOverdueAlert(tasks: Task[]): Promise<void> {
    if (tasks.length === 0) return;

    const title = '⚠️ Overdue Tasks Alert';
    const options: ExtendedNotificationOptions = {
      body: `You have ${tasks.length} overdue task${tasks.length > 1 ? 's' : ''} that need attention.`,
      tag: 'overdue-alert',
      data: { type: 'overdue-alert', taskIds: tasks.map(t => t.id) },
      actions: [
        { action: 'view', title: 'View Tasks' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      requireInteraction: true
    };

    await this.showNotification(title, options);
  }

  scheduleTaskReminder(task: Task): void {
    if (!task.dueDate) return;

    const dueTime = new Date(task.dueDate);
    const now = new Date();
    
    const reminderTime = new Date(dueTime);
    if (dueTime.getHours() === 0 && dueTime.getMinutes() === 0) {
      reminderTime.setHours(9, 0, 0, 0);
    } else {
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
        scheduleNext();
      }, timeUntilDigest);
    };
    
    scheduleNext();
  }

  handleNotificationClick(event: NotificationEvent): void {
    const data = event.notification.data;
    
    switch (data?.type) {
      case 'task-reminder':
        event.waitUntil(
          this.focusOrOpenApp(`/?task=${data.taskId}`)
        );
        break;
      case 'daily-digest':
      case 'overdue-alert':
        event.waitUntil(
          this.focusOrOpenApp('/')
        );
        break;
    }
    
    event.notification.close();
  }

  handleNotificationAction(event: NotificationEvent, action: string): void {
    const data = event.notification.data;
    
    switch (action) {
      case 'complete':
        if (data?.taskId) {
          console.log('Mark task complete:', data.taskId);
        }
        break;
      case 'snooze':
        if (data?.taskId) {
          setTimeout(() => {
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
    console.log('Focus or open app:', url);
  }

  async checkOverdueTasks(tasks: Task[]): Promise<void> {
    const overdueTasks = tasks.filter(t => 
      t.dueDate && isOverdue(t.dueDate) && t.status !== 'completed'
    );
    
    if (overdueTasks.length > 0) {
      const lastAlertKey = 'last-overdue-alert';
      const lastAlert = localStorage.getItem(lastAlertKey);
      const now = new Date().getTime();
      
      if (!lastAlert || now - parseInt(lastAlert) > 4 * 60 * 60 * 1000) { // 4 hours
        await this.showOverdueAlert(overdueTasks);
        localStorage.setItem(lastAlertKey, now.toString());
      }
    }
  }

  getAppVersion(): string {
    return '1.0.0';
  }

  async checkForUpdate(): Promise<boolean> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CHECK_FOR_UPDATE' });
      return true;
    }
    return false;
  }

  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }
}

export const appService = new AppService();

export const initializeApp = () => {
  appService.init();
};