import { registerSW } from 'virtual:pwa-register';

export interface PWAUpdateInfo {
  needRefresh: boolean;
  offlineReady: boolean;
  updateSW: () => Promise<void>;
}

interface ExtendedNotificationOptions extends NotificationOptions {
  renotify?: boolean;
  actions?: { action: string; title: string }[];
}

class PWAService {
  private updateSW: (() => Promise<void>) | null = null;
  private needRefresh = false;
  private offlineReady = false;
  private listeners: ((info: PWAUpdateInfo) => void)[] = [];

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
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  initInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('Before install prompt fired');
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
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

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
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

  // Task reminder notifications (legacy - use notificationService instead)
  async scheduleTaskReminder(taskId: string, title: string, dueTime: Date): Promise<void> {
    const now = new Date();
    const timeUntilDue = dueTime.getTime() - now.getTime();
    
    if (timeUntilDue > 0 && timeUntilDue <= 24 * 60 * 60 * 1000) { // Within 24 hours
      setTimeout(() => {
        this.showNotification('📋 Task Reminder', {
          body: title,
          data: { taskId, type: 'task-reminder' },
          actions: [
            { action: 'complete', title: 'Mark Complete' },
            { action: 'snooze', title: 'Snooze 1h' }
          ]
        });
      }, timeUntilDue);
    }
  }

  // Get app version for cache management
  getAppVersion(): string {
    return '1.0.0'; // This should be dynamic in production
  }

  // Check if app needs update
  async checkForUpdate(): Promise<boolean> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CHECK_FOR_UPDATE' });
      return true;
    }
    return false;
  }

  // Clear app cache
  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }
}

// Global PWA service instance
export const pwaService = new PWAService();

// Initialize PWA features
export const initializePWA = () => {
  pwaService.init();
  pwaService.initInstallPrompt();
  pwaService.initNetworkStatus();
};

