import type { Task, DailySection, Project } from '../types';

interface OfflineData {
  tasks: Task[];
  dailySections: Record<string, DailySection>;
  projects: Project[];
  lastSync: string;
  pendingChanges: OfflineChange[];
}

interface OfflineChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'task' | 'dailySection' | 'project';
  data: any;
  timestamp: string;
}

export class OfflineStorageService {
  private dbName = 'mypa-offline-db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        
        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('status', 'status');
          taskStore.createIndex('project', 'project');
          taskStore.createIndex('dueDate', 'dueDate');
          taskStore.createIndex('createdAt', 'createdAt');
        }
        
        // Daily sections store
        if (!db.objectStoreNames.contains('dailySections')) {
          db.createObjectStore('dailySections', { keyPath: 'date' });
        }
        
        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        
        // Pending changes store (for offline sync)
        if (!db.objectStoreNames.contains('pendingChanges')) {
          const changesStore = db.createObjectStore('pendingChanges', { keyPath: 'id' });
          changesStore.createIndex('timestamp', 'timestamp');
        }
        
        // App metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  // Task operations
  async saveTasks(tasks: Task[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    
    for (const task of tasks) {
      await this.promisifyRequest(store.put(task));
    }
  }

  async getTasks(): Promise<Task[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['tasks'], 'readonly');
    const store = transaction.objectStore('tasks');
    const request = store.getAll();
    
    return this.promisifyRequest(request);
  }

  async saveTask(task: Task): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    
    await this.promisifyRequest(store.put(task));
  }

  async deleteTask(taskId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    
    await this.promisifyRequest(store.delete(taskId));
  }

  // Daily sections operations
  async saveDailySection(section: DailySection): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['dailySections'], 'readwrite');
    const store = transaction.objectStore('dailySections');
    
    await this.promisifyRequest(store.put(section));
  }

  async getDailySection(date: string): Promise<DailySection | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['dailySections'], 'readonly');
    const store = transaction.objectStore('dailySections');
    const request = store.get(date);
    
    return this.promisifyRequest(request);
  }

  async getAllDailySections(): Promise<Record<string, DailySection>> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['dailySections'], 'readonly');
    const store = transaction.objectStore('dailySections');
    const request = store.getAll();
    
    const sections = await this.promisifyRequest(request);
    return sections.reduce((acc, section) => {
      acc[section.date] = section;
      return acc;
    }, {} as Record<string, DailySection>);
  }

  // Projects operations
  async saveProjects(projects: Project[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['projects'], 'readwrite');
    const store = transaction.objectStore('projects');
    
    for (const project of projects) {
      await this.promisifyRequest(store.put(project));
    }
  }

  async getProjects(): Promise<Project[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');
    const request = store.getAll();
    
    return this.promisifyRequest(request);
  }

  // Offline sync operations
  async addPendingChange(change: Omit<OfflineChange, 'id' | 'timestamp'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const fullChange: OfflineChange = {
      ...change,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    const transaction = this.db.transaction(['pendingChanges'], 'readwrite');
    const store = transaction.objectStore('pendingChanges');
    
    await this.promisifyRequest(store.put(fullChange));
  }

  async getPendingChanges(): Promise<OfflineChange[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['pendingChanges'], 'readonly');
    const store = transaction.objectStore('pendingChanges');
    const request = store.getAll();
    
    return this.promisifyRequest(request);
  }

  async clearPendingChanges(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['pendingChanges'], 'readwrite');
    const store = transaction.objectStore('pendingChanges');
    
    await this.promisifyRequest(store.clear());
  }

  // Metadata operations
  async setLastSync(timestamp: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');
    
    await this.promisifyRequest(store.put({ key: 'lastSync', value: timestamp }));
  }

  async getLastSync(): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['metadata'], 'readonly');
    const store = transaction.objectStore('metadata');
    const request = store.get('lastSync');
    
    const result = await this.promisifyRequest(request);
    return result ? result.value : null;
  }

  // Cache management
  async getCacheSize(): Promise<number> {
    if (!this.db) return 0;
    
    let totalSize = 0;
    const storeNames = ['tasks', 'dailySections', 'projects', 'pendingChanges', 'metadata'];
    
    for (const storeName of storeNames) {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore('store');
      const request = store.getAll();
      const data = await this.promisifyRequest(request);
      
      // Rough size calculation
      totalSize += JSON.stringify(data).length;
    }
    
    return totalSize;
  }

  async clearOldData(daysToKeep: number = 30): Promise<void> {
    if (!this.db) return;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    
    // Clear old daily sections
    const transaction = this.db.transaction(['dailySections'], 'readwrite');
    const store = transaction.objectStore('dailySections');
    const request = store.openCursor();
    
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        if (cursor.key < cutoffStr) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }

  // Export/Import for backup
  async exportData(): Promise<OfflineData> {
    if (!this.db) throw new Error('Database not initialized');
    
    const [tasks, dailySections, projects, pendingChanges, lastSync] = await Promise.all([
      this.getTasks(),
      this.getAllDailySections(),
      this.getProjects(),
      this.getPendingChanges(),
      this.getLastSync()
    ]);
    
    return {
      tasks,
      dailySections,
      projects,
      pendingChanges,
      lastSync: lastSync || new Date().toISOString()
    };
  }

  async importData(data: OfflineData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await Promise.all([
      this.saveTasks(data.tasks),
      this.saveProjects(data.projects),
      this.setLastSync(data.lastSync)
    ]);
    
    // Save daily sections
    for (const [_date, section] of Object.entries(data.dailySections)) {
      await this.saveDailySection(section);
    }
    
    // Save pending changes
    for (const change of data.pendingChanges) {
      const transaction = this.db.transaction(['pendingChanges'], 'readwrite');
      const store = transaction.objectStore('pendingChanges');
      await this.promisifyRequest(store.put(change));
    }
  }

  // Helper method to promisify IndexedDB requests
  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Check if we're in offline mode
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Get storage quota information
  async getStorageInfo(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }
}

// Global offline storage service instance
export const offlineStorageService = new OfflineStorageService();