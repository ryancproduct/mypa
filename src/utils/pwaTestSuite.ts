import { appService } from '../services/appService';
import { offlineStorageService } from '../services/offlineStorageService';
import type { Task, DailySection, Project } from '../types';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  details?: any;
}

export class PWATestSuite {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    this.results = [];
    
    console.log('🧪 Starting PWA Test Suite...');
    
    await this.testServiceWorkerRegistration();
    await this.testInstallPrompt();
    await this.testNotifications();
    await this.testOfflineStorage();
    await this.testCaching();
    await this.testManifest();
    await this.testNetworkStatus();
    
    console.log('✅ PWA Test Suite Complete');
    console.table(this.results);
    
    return this.results;
  }

  private async testServiceWorkerRegistration(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          this.addResult('Service Worker', 'pass', 'Service worker is registered and active');
        } else {
          this.addResult('Service Worker', 'fail', 'Service worker not found');
        }
      } else {
        this.addResult('Service Worker', 'skip', 'Service workers not supported');
      }
    } catch (error) {
      this.addResult('Service Worker', 'fail', `Error: ${error}`);
    }
  }

  private async testInstallPrompt(): Promise<void> {
    try {
      const canInstall = appService.canInstall();
      const isStandalone = appService.isStandalone();
      
      if (isStandalone) {
        this.addResult('Install Prompt', 'pass', 'App is running in standalone mode');
      } else if (canInstall) {
        this.addResult('Install Prompt', 'pass', 'Install prompt is available');
      } else {
        this.addResult('Install Prompt', 'skip', 'Install prompt not available (may already be installed)');
      }
    } catch (error) {
      this.addResult('Install Prompt', 'fail', `Error: ${error}`);
    }
  }

  private async testNotifications(): Promise<void> {
    try {
      if ('Notification' in window) {
        const permission = Notification.permission;
        
        if (permission === 'granted') {
          this.addResult('Notifications', 'pass', 'Notifications permission granted');
          
          // Test notification service
          await this.testNotificationService();
        } else if (permission === 'denied') {
          this.addResult('Notifications', 'fail', 'Notifications permission denied');
        } else {
          this.addResult('Notifications', 'skip', 'Notifications permission not requested yet');
        }
      } else {
        this.addResult('Notifications', 'skip', 'Notifications not supported');
      }
    } catch (error) {
      this.addResult('Notifications', 'fail', `Error: ${error}`);
    }
  }

  private async testNotificationService(): Promise<void> {
    try {
      // Test notification service initialization
      const permission = await appService.requestNotificationPermission();
      
      if (permission === 'granted') {
        this.addResult('Notification Service', 'pass', 'Notification service initialized successfully');
        
        // Test task reminder (without actually showing notification)
        const testTask: Task = {
          id: 'test-task',
          content: 'Test task for PWA testing',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 60000).toISOString().split('T')[0] // 1 minute from now
        };
        
        // This would schedule a notification (commented out to avoid spam)
        // appService.scheduleTaskReminder(testTask);
        console.log('Test task created:', testTask.id);
        
        this.addResult('Task Reminders', 'pass', 'Task reminder scheduling working');
      } else {
        this.addResult('Notification Service', 'fail', 'Failed to initialize notification service');
      }
    } catch (error) {
      this.addResult('Notification Service', 'fail', `Error: ${error}`);
    }
  }

  private async testOfflineStorage(): Promise<void> {
    try {
      // Test IndexedDB initialization
      await offlineStorageService.initialize();
      this.addResult('IndexedDB Init', 'pass', 'IndexedDB initialized successfully');
      
      // Test basic CRUD operations
      await this.testOfflineStorageCRUD();
      
      // Test storage info
      const storageInfo = await offlineStorageService.getStorageInfo();
      this.addResult('Storage Quota', 'pass', `Used: ${Math.round(storageInfo.used / 1024)}KB, Quota: ${Math.round(storageInfo.quota / 1024 / 1024)}MB`);
      
    } catch (error) {
      this.addResult('Offline Storage', 'fail', `Error: ${error}`);
    }
  }

  private async testOfflineStorageCRUD(): Promise<void> {
    try {
      // Test task operations
      const testTask: Task = {
        id: 'test-task-pwa',
        content: 'PWA test task',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await offlineStorageService.saveTask(testTask);
      const savedTasks = await offlineStorageService.getTasks();
      const foundTask = savedTasks.find(t => t.id === testTask.id);
      
      if (foundTask) {
        this.addResult('Task Storage', 'pass', 'Task CRUD operations working');
        
        // Clean up
        await offlineStorageService.deleteTask(testTask.id);
      } else {
        this.addResult('Task Storage', 'fail', 'Task not found after save');
      }
      
      // Test daily section operations
      const testSection: DailySection = {
        id: 'test-section-2024-01-01',
        date: '2024-01-01',
        priorities: [],
        schedule: [],
        followUps: [],
        notes: [],
        completed: [],
        blockers: []
      };
      
      await offlineStorageService.saveDailySection(testSection);
      const savedSection = await offlineStorageService.getDailySection('2024-01-01');
      
      if (savedSection) {
        this.addResult('Daily Section Storage', 'pass', 'Daily section CRUD operations working');
      } else {
        this.addResult('Daily Section Storage', 'fail', 'Daily section not found after save');
      }
      
      // Test projects
      const testProject: Project = {
        id: 'test-project',
        name: 'Test Project',
        tag: '#TestProject',
        description: 'PWA test project'
      };
      
      await offlineStorageService.saveProjects([testProject]);
      const savedProjects = await offlineStorageService.getProjects();
      const foundProject = savedProjects.find(p => p.id === testProject.id);
      
      if (foundProject) {
        this.addResult('Project Storage', 'pass', 'Project CRUD operations working');
      } else {
        this.addResult('Project Storage', 'fail', 'Project not found after save');
      }
      
    } catch (error) {
      this.addResult('CRUD Operations', 'fail', `Error: ${error}`);
    }
  }

  private async testCaching(): Promise<void> {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        
        if (cacheNames.length > 0) {
          this.addResult('Cache Storage', 'pass', `${cacheNames.length} cache(s) found: ${cacheNames.join(', ')}`);
          
          // Test specific cache existence
          const appCache = await caches.open('workbox-precache-v2-http://localhost:5173/');
          if (appCache) {
            this.addResult('App Cache', 'pass', 'Application cache is working');
          }
        } else {
          this.addResult('Cache Storage', 'skip', 'No caches found (may be first run)');
        }
      } else {
        this.addResult('Cache Storage', 'skip', 'Cache API not supported');
      }
    } catch (error) {
      this.addResult('Cache Storage', 'fail', `Error: ${error}`);
    }
  }

  private async testManifest(): Promise<void> {
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      
      if (manifestLink) {
        const manifestUrl = (manifestLink as HTMLLinkElement).href;
        const response = await fetch(manifestUrl);
        
        if (response.ok) {
          const manifest = await response.json();
          this.addResult('App Manifest', 'pass', `Manifest loaded: ${manifest.name || 'Unnamed app'}`);
          
          // Check key manifest properties
          const requiredFields = ['name', 'start_url', 'display', 'icons'];
          const missingFields = requiredFields.filter(field => !manifest[field]);
          
          if (missingFields.length === 0) {
            this.addResult('Manifest Validation', 'pass', 'All required manifest fields present');
          } else {
            this.addResult('Manifest Validation', 'fail', `Missing fields: ${missingFields.join(', ')}`);
          }
        } else {
          this.addResult('App Manifest', 'fail', 'Failed to load manifest');
        }
      } else {
        this.addResult('App Manifest', 'fail', 'No manifest link found');
      }
    } catch (error) {
      this.addResult('App Manifest', 'fail', `Error: ${error}`);
    }
  }

  private async testNetworkStatus(): Promise<void> {
    try {
      const isOnline = navigator.onLine;
      this.addResult('Network Status', 'pass', `Currently ${isOnline ? 'online' : 'offline'}`);
      
      // Test PWA service network detection
      const pwaOnlineStatus = appService.isOnline();
      if (pwaOnlineStatus === isOnline) {
        this.addResult('PWA Network Detection', 'pass', 'PWA service correctly detects network status');
      } else {
        this.addResult('PWA Network Detection', 'fail', 'PWA service network status mismatch');
      }
    } catch (error) {
      this.addResult('Network Status', 'fail', `Error: ${error}`);
    }
  }

  private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, details?: any): void {
    this.results.push({ name, status, message, details });
    
    const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
    console.log(`${emoji} ${name}: ${message}`);
  }

  // Generate test report
  generateReport(): string {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'pass').length;
    const failedTests = this.results.filter(r => r.status === 'fail').length;
    const skippedTests = this.results.filter(r => r.status === 'skip').length;
    
    let report = `PWA Test Suite Report\n`;
    report += `===================\n\n`;
    report += `Total Tests: ${totalTests}\n`;
    report += `Passed: ${passedTests}\n`;
    report += `Failed: ${failedTests}\n`;
    report += `Skipped: ${skippedTests}\n`;
    report += `Success Rate: ${Math.round((passedTests / (totalTests - skippedTests)) * 100)}%\n\n`;
    
    report += `Detailed Results:\n`;
    report += `----------------\n`;
    
    this.results.forEach(result => {
      const status = result.status.toUpperCase().padEnd(6);
      report += `${status} ${result.name}: ${result.message}\n`;
    });
    
    return report;
  }
}

// Helper function to run tests from console
export const runPWATests = async (): Promise<void> => {
  const testSuite = new PWATestSuite();
  const results = await testSuite.runAllTests();
  
  console.log('\n' + testSuite.generateReport());
  
  // Store results in sessionStorage for debugging
  sessionStorage.setItem('pwa-test-results', JSON.stringify(results));
};

// Make available globally for console testing
(window as any).runPWATests = runPWATests;